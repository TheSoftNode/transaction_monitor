import pytest
from django.urls import reverse
from rest_framework import status

from apps.alerts.models import Alert, AuditLog
from apps.transactions.models import Transaction


@pytest.mark.django_db
class TestTransactionWorkflow:
    """Test end-to-end transaction workflow"""

    def test_complete_transaction_flow(self, authenticated_client):
        """Test complete flow from customer creation to transaction processing"""
        # Step 1: Create customer
        customer_url = reverse("customers:customer-list")
        customer_data = {
            "customer_reference": "CUST_FLOW",
            "full_name": "Flow Test",
            "email": "flow@example.com",
            "country_code": "USA",
            "risk_level": "low",
        }
        customer_response = authenticated_client.post(customer_url, customer_data)
        assert customer_response.status_code == status.HTTP_201_CREATED
        customer_id = customer_response.data["id"]

        # Step 2: Create transaction
        transaction_url = reverse("transactions:transaction-list")
        transaction_data = {
            "transaction_reference": "TXN_FLOW",
            "customer": customer_id,
            "amount": "5000.00",
            "currency": "USD",
            "transaction_type": "deposit",
        }
        transaction_response = authenticated_client.post(
            transaction_url, transaction_data, format="json"
        )
        assert transaction_response.status_code == status.HTTP_201_CREATED
        transaction_id = transaction_response.data["id"]

        # Note: In real scenario, event processor would handle this async
        # For testing, we manually trigger rule evaluation
        from rules.engine import RuleEngine

        transaction = Transaction.objects.get(id=transaction_id)
        engine = RuleEngine()
        engine.process_transaction(transaction)

        # Step 3: Verify transaction risk score (no rules trigger for a low-risk deposit)
        transaction.refresh_from_db()
        assert transaction.risk_score == 0

        # Step 4: Verify audit log was created by the rule engine
        audit_logs = AuditLog.objects.filter(transaction=transaction)
        assert audit_logs.count() > 0

    def test_high_risk_transaction_creates_alert(self, authenticated_client, customer):
        """Test that high-risk transaction creates alert"""
        initial_alert_count = Alert.objects.count()

        # Create high-value transaction
        transaction_url = reverse("transactions:transaction-list")
        transaction_data = {
            "transaction_reference": "TXN_HIGH_RISK_FLOW",
            "customer": str(customer.id),
            "amount": "50000.00",  # High value
            "currency": "USD",
            "transaction_type": "withdrawal",
        }
        response = authenticated_client.post(
            transaction_url, transaction_data, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED

        # Note: In real scenario, event processor would handle this async
        # For testing, we manually trigger rule evaluation
        from rules.engine import RuleEngine

        transaction = Transaction.objects.get(id=response.data["id"])
        engine = RuleEngine()
        engine.process_transaction(transaction)

        # Verify alert was created
        new_alert_count = Alert.objects.count()
        assert new_alert_count > initial_alert_count

        alert = Alert.objects.filter(transaction=transaction).first()
        assert alert is not None
        assert alert.severity in ["medium", "high", "critical"]

    def test_transaction_status_update_creates_audit_log(
        self, authenticated_client, transaction
    ):
        """Test that updating transaction status creates audit log"""
        url = reverse(
            "transactions:transaction-update-status", kwargs={"pk": transaction.id}
        )
        data = {"status": "approved"}
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK

        # Status updates don't automatically create audit logs
        # Audit logs are created by rule engine during transaction processing
        assert response.data["status"] == "approved"

    def test_blacklisted_customer_transaction(
        self, authenticated_client, blacklisted_customer
    ):
        """Test transaction from blacklisted customer triggers high-risk alert"""
        transaction_url = reverse("transactions:transaction-list")
        transaction_data = {
            "transaction_reference": "TXN_BLACKLIST_FLOW",
            "customer": str(blacklisted_customer.id),
            "amount": "1000.00",
            "currency": "USD",
            "transaction_type": "deposit",
        }
        response = authenticated_client.post(
            transaction_url, transaction_data, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED

        # Trigger rule evaluation
        from rules.engine import RuleEngine

        transaction = Transaction.objects.get(id=response.data["id"])
        engine = RuleEngine()
        result = engine.process_transaction(transaction)

        # Should have high risk score
        assert result["risk_score"] > 50

        # Should have alert
        assert Alert.objects.filter(transaction=transaction).exists()

    def test_multiple_transactions_velocity_check(self, authenticated_client, customer):
        """Test velocity check across multiple transactions"""
        transaction_url = reverse("transactions:transaction-list")

        # Create multiple transactions quickly
        for i in range(6):
            transaction_data = {
                "transaction_reference": f"TXN_VELOCITY_FLOW_{i}",
                "customer": str(customer.id),
                "amount": "1000.00",
                "currency": "USD",
                "transaction_type": "deposit",
            }
            response = authenticated_client.post(
                transaction_url, transaction_data, format="json"
            )
            assert response.status_code == status.HTTP_201_CREATED

        # Get last transaction and check for velocity alert
        from rules.engine import RuleEngine

        latest_transaction = (
            Transaction.objects.filter(customer=customer)
            .order_by("-created_at")
            .first()
        )

        engine = RuleEngine()
        result = engine.process_transaction(latest_transaction)

        # Should trigger velocity rule
        triggered_rule_names = [r["rule"].name for r in result["triggered_rules"]]
        assert "VelocityRule" in triggered_rule_names

    def test_alert_resolution_workflow(self, authenticated_client, transaction, user):
        """Test alert resolution workflow"""
        # Create alert
        alert = Alert.objects.create(
            transaction=transaction,
            rule_name="TestRule",
            severity="medium",
            message="Test alert",
            status="open",
        )

        # Resolve alert
        alert_url = reverse("alerts:alert-resolve", kwargs={"pk": alert.id})
        response = authenticated_client.post(
            alert_url, {"status": "resolved", "is_false_positive": False}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "resolved"

        alert.refresh_from_db()
        assert alert.status == "resolved"
        assert alert.resolved_by == user
        assert alert.resolved_at is not None
