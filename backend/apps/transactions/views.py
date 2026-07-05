import logging

from django.conf import settings
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from infrastructure.messaging.kafka import KafkaMessagePublisher
from ml.anomaly_detector import detector as ml_detector
from prometheus_client import Counter
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import TransactionFilter
from .models import Transaction
from .serializers import (TransactionListSerializer, TransactionSerializer,
                          TransactionStatusUpdateSerializer)

logger = logging.getLogger(__name__)

# Prometheus metrics
transaction_counter = Counter("transactions_total", "Total number of transactions")
ml_anomaly_counter = Counter(
    "ml_anomalies_detected", "Total anomalies detected by ML model"
)


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.select_related("customer").all()
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = TransactionFilter
    search_fields = ["transaction_reference", "customer__full_name", "customer__email"]
    ordering_fields = ["created_at", "amount", "risk_score", "status"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return TransactionListSerializer
        elif self.action == "update_status":
            return TransactionStatusUpdateSerializer
        return TransactionSerializer

    def perform_create(self, serializer):
        transaction = serializer.save()

        # Increment Prometheus counter
        transaction_counter.inc()

        # ML Anomaly Detection
        try:
            ml_result = ml_detector.predict(
                {
                    "amount": float(transaction.amount),
                    "transaction_type": transaction.transaction_type,
                    "customer_risk_level": transaction.customer.risk_level,
                    "is_blacklisted": transaction.customer.is_blacklisted,
                    "country_code": transaction.customer.country_code,
                    "timestamp": transaction.created_at,
                    "customer_transaction_count": Transaction.objects.filter(
                        customer=transaction.customer
                    ).count(),
                    "customer_total_volume": float(
                        Transaction.objects.filter(
                            customer=transaction.customer
                        ).aggregate(total=models.Sum("amount"))["total"]
                        or 0
                    ),
                }
            )

            # Always save ML results (even for untrained model)
            if transaction.metadata is None:
                transaction.metadata = {}
            transaction.metadata["ml_prediction"] = ml_result
            transaction.save(update_fields=["metadata"])

            if ml_result.get("is_anomaly"):
                ml_anomaly_counter.inc()
                logger.warning(
                    f"ML anomaly detected for {transaction.transaction_reference}: "
                    f"score={ml_result.get('anomaly_score'):.2f}"
                )
        except Exception as e:
            logger.error(f"ML prediction failed: {str(e)}", exc_info=True)

        try:
            publisher = KafkaMessagePublisher()
            event_data = {
                "transaction_id": str(transaction.id),
                "transaction_reference": transaction.transaction_reference,
                "customer_id": str(transaction.customer.id),
                "amount": str(transaction.amount),
                "currency": transaction.currency,
                "transaction_type": transaction.transaction_type,
                "created_at": transaction.created_at.isoformat(),
            }
            publisher.publish(settings.KAFKA_TOPICS["TRANSACTION_CREATED"], event_data)
            publisher.close()
            logger.info(
                f"Published transaction.created event for {transaction.transaction_reference}"
            )
        except Exception as e:
            logger.error(f"Failed to publish event: {str(e)}", exc_info=True)

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        transaction = self.get_object()
        serializer = self.get_serializer(transaction, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="ml-metrics")
    def ml_metrics(self, request):
        """Get ML model performance metrics"""
        metrics = ml_detector.get_metrics()
        return Response(
            {
                "ml_model": metrics,
                "model_status": "trained" if ml_detector.is_trained else "untrained",
                "model_version": ml_detector.MODEL_VERSION,
            }
        )
