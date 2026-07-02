import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.customers.models import Customer
from apps.transactions.models import Transaction
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
        email='customer@example.com',
        first_name='John',
        last_name='Doe',
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
        email='blacklist@example.com',
        first_name='Jane',
        last_name='Smith',
        country_code='USA',
        risk_level='high',
        is_blacklisted=True
    )
