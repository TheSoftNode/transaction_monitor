from rest_framework import serializers
from .models import Transaction
from apps.customers.serializers import CustomerListSerializer


class TransactionSerializer(serializers.ModelSerializer):
    customer_details = CustomerListSerializer(source='customer', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_reference', 'customer', 'customer_details',
            'amount', 'currency', 'transaction_type', 'status', 'risk_score',
            'metadata', 'created_at', 'updated_at', 'processed_at'
        ]
        read_only_fields = ['id', 'risk_score', 'created_at', 'updated_at', 'processed_at']

    def validate_transaction_reference(self, value):
        if self.instance is None:
            if Transaction.objects.filter(transaction_reference=value).exists():
                raise serializers.ValidationError("Transaction reference already exists.")
        return value


class TransactionListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_reference', 'customer', 'customer_name',
            'amount', 'currency', 'transaction_type', 'status', 'risk_score', 'created_at'
        ]
        read_only_fields = ['id', 'risk_score', 'created_at']


class TransactionStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['status']

    def validate_status(self, value):
        if value not in dict(Transaction.STATUS_CHOICES):
            raise serializers.ValidationError("Invalid status value.")
        return value
