from decimal import Decimal

import pytest
from apps.transactions.models import Transaction
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestTransactionAPI:
    """Test transaction CRUD operations"""

    def test_create_transaction(self, authenticated_client, customer):
        """Test creating a new transaction"""
        url = reverse("transactions:transaction-list")
        data = {
            "transaction_reference": "TXN002",
            "customer": str(customer.id),
            "amount": "5000.00",
            "currency": "USD",
            "transaction_type": "deposit",
        }
        response = authenticated_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["transaction_reference"] == "TXN002"
        assert Decimal(response.data["amount"]) == Decimal("5000.00")

    def test_create_transaction_invalid_amount(self, authenticated_client, customer):
        """Test creating transaction with invalid amount"""
        url = reverse("transactions:transaction-list")
        data = {
            "transaction_reference": "TXN_INVALID",
            "customer": str(customer.id),
            "amount": "-100.00",
            "currency": "USD",
            "transaction_type": "deposit",
        }
        response = authenticated_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_transactions(self, authenticated_client, transaction):
        """Test listing transactions"""
        url = reverse("transactions:transaction-list")
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) >= 1

    def test_retrieve_transaction(self, authenticated_client, transaction):
        """Test retrieving a specific transaction"""
        url = reverse("transactions:transaction-detail", kwargs={"pk": transaction.id})
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert (
            response.data["transaction_reference"] == transaction.transaction_reference
        )

    def test_update_transaction_status(self, authenticated_client, transaction):
        """Test updating transaction status"""
        url = reverse(
            "transactions:transaction-update-status", kwargs={"pk": transaction.id}
        )
        data = {"status": "approved"}
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "approved"

        transaction.refresh_from_db()
        assert transaction.status == "approved"

    def test_filter_transactions_by_status(self, authenticated_client, transaction):
        """Test filtering transactions by status"""
        url = reverse("transactions:transaction-list")
        response = authenticated_client.get(url, {"status": "pending"})

        assert response.status_code == status.HTTP_200_OK
        assert all(t["status"] == "pending" for t in response.data["results"])

    def test_filter_transactions_by_customer(
        self, authenticated_client, transaction, customer
    ):
        """Test filtering transactions by customer"""
        url = reverse("transactions:transaction-list")
        response = authenticated_client.get(url, {"customer": str(customer.id)})

        assert response.status_code == status.HTTP_200_OK
        assert all(t["customer"] == str(customer.id) for t in response.data["results"])

    def test_search_transactions(self, authenticated_client, transaction):
        """Test searching transactions"""
        url = reverse("transactions:transaction-list")
        response = authenticated_client.get(
            url, {"search": transaction.transaction_reference}
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 1

    def test_pagination(self, authenticated_client, customer):
        """Test transaction pagination"""
        # Create multiple transactions
        for i in range(15):
            Transaction.objects.create(
                transaction_reference=f"TXN_PAGE_{i}",
                customer=customer,
                amount=Decimal("100.00"),
                currency="USD",
                transaction_type="deposit",
            )

        url = reverse("transactions:transaction-list")
        response = authenticated_client.get(url, {"page_size": 10})

        assert response.status_code == status.HTTP_200_OK
        assert "next" in response.data
        assert len(response.data["results"]) == 10
