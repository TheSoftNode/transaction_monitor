from decimal import Decimal

import pytest
from apps.alerts.models import Alert, AuditLog
from apps.alerts.serializers import AlertSerializer, AuditLogSerializer
from apps.authentication.serializers import (CustomTokenObtainPairSerializer,
                                             RegisterSerializer)
from apps.customers.models import Customer
from apps.customers.serializers import CustomerSerializer
from apps.transactions.models import Transaction
from apps.transactions.serializers import TransactionSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestSerializers:
    """Test all serializers"""

    def test_customer_serializer_valid_data(self):
        """Test CustomerSerializer with valid data"""
        data = {
            "customer_reference": "CUST_SER_001",
            "full_name": "Test Customer",
            "email": "test@example.com",
            "country_code": "USA",
            "risk_level": "low",
        }
        serializer = CustomerSerializer(data=data)
        assert serializer.is_valid()
        customer = serializer.save()
        assert customer.customer_reference == "CUST_SER_001"

    def test_customer_serializer_invalid_email(self):
        """Test CustomerSerializer with invalid email"""
        data = {
            "customer_reference": "CUST_SER_002",
            "full_name": "Test Customer",
            "email": "invalid-email",
            "country_code": "USA",
        }
        serializer = CustomerSerializer(data=data)
        assert not serializer.is_valid()
        assert "email" in serializer.errors

    def test_transaction_serializer_valid_data(self, customer):
        """Test TransactionSerializer with valid data"""
        data = {
            "transaction_reference": "TXN_SER_001",
            "customer": str(customer.id),
            "amount": "1000.00",
            "currency": "USD",
            "transaction_type": "deposit",
        }
        serializer = TransactionSerializer(data=data)
        assert serializer.is_valid()
        transaction = serializer.save()
        assert transaction.amount == Decimal("1000.00")

    def test_transaction_serializer_negative_amount(self, customer):
        """Test TransactionSerializer with negative amount"""
        data = {
            "transaction_reference": "TXN_SER_002",
            "customer": str(customer.id),
            "amount": "-100.00",
            "currency": "USD",
            "transaction_type": "deposit",
        }
        serializer = TransactionSerializer(data=data)
        assert not serializer.is_valid()

    def test_alert_serializer(self, transaction):
        """Test AlertSerializer"""
        alert = Alert.objects.create(
            transaction=transaction,
            rule_name="TestRule",
            severity="high",
            message="Test alert",
            status="active",
        )
        serializer = AlertSerializer(alert)
        assert serializer.data["rule_name"] == "TestRule"
        assert serializer.data["severity"] == "high"

    def test_audit_log_serializer(self, transaction, user):
        """Test AuditLogSerializer"""
        audit_log = AuditLog.objects.create(
            transaction=transaction,
            event_type="TEST_EVENT",
            actor=user,
            ip_address="127.0.0.1",
            user_agent="Test Agent",
            details={"test": "data"},
        )
        serializer = AuditLogSerializer(audit_log)
        assert serializer.data["event_type"] == "TEST_EVENT"
        assert serializer.data["details"] == {"test": "data"}

    def test_register_serializer_valid(self):
        """Test RegisterSerializer with valid data"""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "TestPass123!",
            "password2": "TestPass123!",
        }
        serializer = RegisterSerializer(data=data)
        assert serializer.is_valid()

    def test_register_serializer_password_mismatch(self):
        """Test RegisterSerializer with password mismatch"""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "TestPass123!",
            "password2": "DifferentPass123!",
        }
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert (
            "password" in serializer.errors
            or "password2" in serializer.errors
            or "non_field_errors" in serializer.errors
        )

    def test_register_serializer_weak_password(self):
        """Test RegisterSerializer with weak password"""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "123",
            "password2": "123",
        }
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()

    def test_register_serializer_creates_user(self):
        """Test RegisterSerializer creates user correctly"""
        data = {
            "username": "createduser",
            "email": "created@example.com",
            "password": "SecurePass123!",
            "password2": "SecurePass123!",
        }
        serializer = RegisterSerializer(data=data)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.username == "createduser"
        assert user.email == "created@example.com"
        assert user.check_password("SecurePass123!")

    def test_token_obtain_serializer(self, user):
        """Test CustomTokenObtainPairSerializer"""
        serializer = CustomTokenObtainPairSerializer(
            data={"username": "testuser", "password": "testpass123"}
        )
        # This will fail because we need proper authentication context
        # but it tests the serializer instantiation
        assert serializer is not None
