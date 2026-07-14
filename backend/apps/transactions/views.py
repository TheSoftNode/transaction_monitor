import logging
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import models
from django.db import transaction as db_transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from prometheus_client import Counter
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from infrastructure.messaging.kafka import KafkaMessagePublisher
from infrastructure.messaging.models import OutboxEvent
from ml.anomaly_detector import detector as ml_detector

from .filters import TransactionFilter
from .models import Transaction
from .serializers import (
    TransactionListSerializer,
    TransactionSerializer,
    TransactionStatusUpdateSerializer,
)

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

    def create(self, request, *args, **kwargs):
        """Transparent idempotent replay.

        If a client retries a POST with a `transaction_reference` that
        already exists AND the rest of the payload matches, return the
        original transaction (200) instead of the usual uniqueness 400 -
        this is the safe form of retry-safety: it only short-circuits when
        the retry looks like the *same* request, so a reference reused by
        mistake for a genuinely different transaction still falls through
        to normal validation and gets rejected.
        """
        reference = request.data.get("transaction_reference")
        if reference:
            existing = (
                Transaction.objects.select_related("customer")
                .filter(transaction_reference=reference)
                .first()
            )
            if existing and self._matches_existing(existing, request.data):
                serializer = self.get_serializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    @staticmethod
    def _matches_existing(existing: Transaction, data: dict) -> bool:
        try:
            same_amount = existing.amount == Decimal(str(data.get("amount")))
        except (TypeError, ValueError, InvalidOperation):
            return False
        return (
            same_amount
            and str(existing.customer_id) == str(data.get("customer"))
            and existing.currency == data.get("currency", existing.currency)
            and existing.transaction_type == data.get("transaction_type")
        )

    def perform_create(self, serializer):
        # Save the transaction and its outbox event in one DB transaction:
        # either both commit or neither does, so the event can never be
        # dropped just because the process crashed between the two writes.
        with db_transaction.atomic():
            transaction = serializer.save()
            event_data = {
                "transaction_id": str(transaction.id),
                "transaction_reference": transaction.transaction_reference,
                "customer_id": str(transaction.customer.id),
                "amount": str(transaction.amount),
                "currency": transaction.currency,
                "transaction_type": transaction.transaction_type,
                "created_at": transaction.created_at.isoformat(),
            }
            outbox_event = OutboxEvent.objects.create(
                topic=settings.KAFKA_TOPICS["TRANSACTION_CREATED"],
                payload=event_data,
            )

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

        # Best-effort immediate publish. If Kafka is unreachable the event
        # stays "pending" in the DB - already durably committed above - and
        # is recovered later by `manage.py replay_outbox_events` instead of
        # being lost.
        self._publish_outbox_event(outbox_event)

    @staticmethod
    def _publish_outbox_event(outbox_event: OutboxEvent):
        published = False
        error = None
        try:
            publisher = KafkaMessagePublisher()
            try:
                published = publisher.publish(outbox_event.topic, outbox_event.payload)
            finally:
                publisher.close()
        except Exception as e:
            error = str(e)
            logger.error(
                f"Failed to publish outbox event {outbox_event.id}: {error}",
                exc_info=True,
            )

        if published:
            outbox_event.status = "published"
            outbox_event.published_at = timezone.now()
            outbox_event.save(update_fields=["status", "published_at"])
            logger.info(
                f"Published outbox event {outbox_event.id} for topic {outbox_event.topic}"
            )
        else:
            outbox_event.attempts += 1
            outbox_event.last_error = error or "publish() returned False"
            outbox_event.save(update_fields=["attempts", "last_error"])
            logger.warning(
                f"Outbox event {outbox_event.id} left pending after immediate publish "
                "failure; run `manage.py replay_outbox_events` to retry"
            )

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
