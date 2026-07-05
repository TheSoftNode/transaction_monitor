from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework import status

from apps.alerts.models import Alert
from apps.transactions.models import Transaction


@pytest.mark.django_db
class TestTransactionViewsExtended:
    """Extended tests for transaction views"""

    def test_transaction_update_status_endpoint(
        self, authenticated_client, transaction
    ):
        """Test update-status custom action"""
        url = reverse(
            "transactions:transaction-update-status", kwargs={"pk": transaction.id}
        )
        data = {"status": "approved"}
        response = authenticated_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        transaction.refresh_from_db()
        assert transaction.status == "approved"

    def test_transaction_update_status_invalid(self, authenticated_client, transaction):
        """Test update-status with invalid status"""
        url = reverse(
            "transactions:transaction-update-status", kwargs={"pk": transaction.id}
        )
        data = {"status": "invalid_status"}
        response = authenticated_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_transaction_ordering(self, authenticated_client, customer):
        """Test transaction ordering"""
        # Create multiple transactions
        Transaction.objects.create(
            transaction_reference="TXN_ORDER_1",
            customer=customer,
            amount=Decimal("1000.00"),
            currency="USD",
            transaction_type="deposit",
        )
        Transaction.objects.create(
            transaction_reference="TXN_ORDER_2",
            customer=customer,
            amount=Decimal("2000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        url = reverse("transactions:transaction-list")
        response = authenticated_client.get(url, {"ordering": "-amount"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 2

    def test_transaction_date_filter(self, authenticated_client, transaction):
        """Test filtering transactions by date"""
        url = reverse("transactions:transaction-list")
        response = authenticated_client.get(
            url, {"created_after": "2020-01-01", "created_before": "2030-01-01"}
        )

        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestAlertViewsExtended:
    """Extended tests for alert views"""

    def test_alert_resolve_action(self, authenticated_client, transaction, user):
        """Test alert resolve custom action"""
        alert = Alert.objects.create(
            transaction=transaction,
            rule_name="TestRule",
            severity="medium",
            message="Test alert",
            status="active",
        )

        url = reverse("alerts:alert-resolve", kwargs={"pk": alert.id})
        response = authenticated_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "resolved"
        assert alert.resolved_by == user
        assert alert.resolved_at is not None

    def test_alert_list_filtering(self, authenticated_client, transaction):
        """Test filtering alerts"""
        Alert.objects.create(
            transaction=transaction,
            rule_name="Rule1",
            severity="high",
            message="Alert 1",
            status="active",
        )
        Alert.objects.create(
            transaction=transaction,
            rule_name="Rule2",
            severity="low",
            message="Alert 2",
            status="resolved",
        )

        url = reverse("alerts:alert-list")
        response = authenticated_client.get(url, {"severity": "high"})

        assert response.status_code == status.HTTP_200_OK
        assert all(a["severity"] == "high" for a in response.data["results"])

    def test_alert_status_filter(self, authenticated_client, transaction):
        """Test filtering alerts by status"""
        Alert.objects.create(
            transaction=transaction,
            rule_name="Rule3",
            severity="medium",
            message="Alert 3",
            status="active",
        )

        url = reverse("alerts:alert-list")
        response = authenticated_client.get(url, {"status": "open"})

        assert response.status_code == status.HTTP_200_OK
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestCustomerViewsExtended:
    """Extended tests for customer views"""

    def test_customer_ordering(self, authenticated_client, customer):
        """Test customer ordering"""
        url = reverse("customers:customer-list")
        response = authenticated_client.get(url, {"ordering": "full_name"})

        assert response.status_code == status.HTTP_200_OK

    def test_customer_blacklist_filter(
        self, authenticated_client, blacklisted_customer
    ):
        """Test filtering by blacklist status"""
        url = reverse("customers:customer-list")
        response = authenticated_client.get(url, {"is_blacklisted": "true"})

        assert response.status_code == status.HTTP_200_OK
        assert all(c["is_blacklisted"] for c in response.data["results"])

    def test_customer_partial_update(self, authenticated_client, customer):
        """Test partial update of customer"""
        url = reverse("customers:customer-detail", kwargs={"pk": customer.id})
        data = {"risk_level": "high"}
        response = authenticated_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        customer.refresh_from_db()
        assert customer.risk_level == "high"
