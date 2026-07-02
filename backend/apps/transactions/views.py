from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Transaction
from .serializers import (
    TransactionSerializer,
    TransactionListSerializer,
    TransactionStatusUpdateSerializer
)
from .filters import TransactionFilter


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

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        transaction = self.get_object()
        serializer = self.get_serializer(transaction, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
