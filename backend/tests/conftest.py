import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.customers.models import Customer
from apps.transactions.models import Transaction
from rules.models import RuleConfiguration
from decimal import Decimal

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def customer(db):
    return Customer.objects.create(
        customer_reference='CUST001',
        full_name='John Doe',
        email='customer@example.com',
        country_code='USA',
        risk_level='low'
    )


@pytest.fixture
def transaction(db, customer):
    return Transaction.objects.create(
        transaction_reference='TXN001',
        customer=customer,
        amount=Decimal('1000.00'),
        currency='USD',
        transaction_type='deposit',
        status='pending'
    )


@pytest.fixture
def high_value_transaction(db, customer):
    return Transaction.objects.create(
        transaction_reference='TXN_HIGH',
        customer=customer,
        amount=Decimal('15000.00'),
        currency='USD',
        transaction_type='withdrawal',
        status='pending'
    )


@pytest.fixture
def blacklisted_customer(db):
    return Customer.objects.create(
        customer_reference='CUST_BLACKLIST',
        full_name='Jane Smith',
        email='blacklist@example.com',
        country_code='USA',
        risk_level='high',
        is_blacklisted=True
    )


@pytest.fixture(autouse=True)
def rule_configurations(db):
    """Create rule configurations for testing - auto-applied to all tests"""
    # Clear existing configs first
    RuleConfiguration.objects.all().delete()

    configs = [
        RuleConfiguration.objects.create(
            rule_name='HighValueTransactionRule',
            is_active=True,
            priority=100,
            description='High value transaction check',
            parameters={'threshold': 10000}
        ),
        RuleConfiguration.objects.create(
            rule_name='VelocityRule',
            is_active=True,
            priority=90,
            description='Velocity check',
            parameters={'max_transactions': 5, 'time_window_minutes': 60}
        ),
        RuleConfiguration.objects.create(
            rule_name='BlacklistedCountryRule',
            is_active=True,
            priority=80,
            description='Geographic risk check',
            parameters={}
        ),
        RuleConfiguration.objects.create(
            rule_name='HighRiskCustomerRule',
            is_active=True,
            priority=70,
            description='Customer risk level check',
            parameters={}
        ),
    ]
    return configs
