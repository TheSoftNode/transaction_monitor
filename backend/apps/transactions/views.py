import logging
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.conf import settings
from .models import Transaction
from .serializers import (
    TransactionSerializer,
    TransactionListSerializer,
    TransactionStatusUpdateSerializer
)
from .filters import TransactionFilter
from infrastructure.messaging.kafka import KafkaMessagePublisher

logger = logging.getLogger(__name__)


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.select_related('customer').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TransactionFilter
    search_fields = ['transaction_reference', 'customer__full_name', 'customer__email']
    ordering_fields = ['created_at', 'amount', 'risk_score', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return TransactionListSerializer
        elif self.action == 'update_status':
            return TransactionStatusUpdateSerializer
        return TransactionSerializer

    def perform_create(self, serializer):
        transaction = serializer.save()

        try:
            publisher = KafkaMessagePublisher()
            event_data = {
                'transaction_id': str(transaction.id),
                'transaction_reference': transaction.transaction_reference,
                'customer_id': str(transaction.customer.id),
                'amount': str(transaction.amount),
                'currency': transaction.currency,
                'transaction_type': transaction.transaction_type,
                'created_at': transaction.created_at.isoformat(),
            }
            publisher.publish(settings.KAFKA_TOPICS['TRANSACTION_CREATED'], event_data)
            publisher.close()
            logger.info(f"Published transaction.created event for {transaction.transaction_reference}")
        except Exception as e:
            logger.error(f"Failed to publish event: {str(e)}", exc_info=True)

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        transaction = self.get_object()
        serializer = self.get_serializer(transaction, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
