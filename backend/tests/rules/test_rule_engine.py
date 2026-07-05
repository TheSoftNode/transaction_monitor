from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.alerts.models import Alert
from apps.customers.models import Customer
from apps.transactions.models import Transaction
from rules.engine import RuleEngine
from rules.plugins.customer_risk import HighRiskCustomerRule
from rules.plugins.geographic import BlacklistedCountryRule
from rules.plugins.high_value import HighValueTransactionRule
from rules.plugins.velocity import VelocityRule


@pytest.mark.django_db
class TestRuleEngine:
    """Test rule engine functionality"""

    def test_rule_engine_initialization(self):
        """Test rule engine initializes correctly"""
        engine = RuleEngine()
        assert engine is not None
        assert len(engine.rules) > 0

    def test_high_value_transaction_rule(self, customer):
        """Test high value transaction rule"""
        transaction = Transaction.objects.create(
            transaction_reference="TXN_HIGH_VALUE",
            customer=customer,
            amount=Decimal("15000.00"),
            currency="USD",
            transaction_type="withdrawal",
        )

        rule = HighValueTransactionRule()
        triggered = rule.evaluate(transaction)

        assert triggered is True
        assert rule.get_severity() == "high"

    def test_high_value_transaction_rule_not_triggered(self, customer):
        """Test high value rule not triggered for small transaction"""
        transaction = Transaction.objects.create(
            transaction_reference="TXN_LOW_VALUE",
            customer=customer,
            amount=Decimal("500.00"),
            currency="USD",
            transaction_type="deposit",
        )

        rule = HighValueTransactionRule()
        triggered = rule.evaluate(transaction)

        assert triggered is False

    def test_velocity_check_rule(self, customer):
        """Test velocity check rule"""
        # Create multiple transactions within short time
        base_time = timezone.now()
        for i in range(6):
            Transaction.objects.create(
                transaction_reference=f"TXN_VELOCITY_{i}",
                customer=customer,
                amount=Decimal("1000.00"),
                currency="USD",
                transaction_type="deposit",
                created_at=base_time - timedelta(minutes=i * 5),
            )

        # Get the latest transaction
        latest_transaction = (
            Transaction.objects.filter(customer=customer)
            .order_by("-created_at")
            .first()
        )

        rule = VelocityRule()
        triggered = rule.evaluate(latest_transaction)

        assert triggered is True

    def test_geographic_risk_rule(self):
        """Test geographic risk rule"""
        high_risk_customer = Customer.objects.create(
            customer_reference="CUST_HIGH_RISK_GEO",
            full_name="Risk Customer",
            email="highrisk@example.com",
            country_code="IRN",  # High risk country
        )

        transaction = Transaction.objects.create(
            transaction_reference="TXN_GEO_RISK",
            customer=high_risk_customer,
            amount=Decimal("5000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        rule = BlacklistedCountryRule()
        triggered = rule.evaluate(transaction)

        assert triggered is True

    def test_customer_risk_rule(self, blacklisted_customer):
        """Test customer risk rule"""
        transaction = Transaction.objects.create(
            transaction_reference="TXN_BLACKLIST",
            customer=blacklisted_customer,
            amount=Decimal("1000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        rule = HighRiskCustomerRule()
        triggered = rule.evaluate(transaction)

        assert triggered is True

    def test_rule_engine_process_transaction(self, customer):
        """Test rule engine processes transaction correctly"""
        transaction = Transaction.objects.create(
            transaction_reference="TXN_PROCESS",
            customer=customer,
            amount=Decimal("20000.00"),  # High value
            currency="USD",
            transaction_type="withdrawal",
        )

        engine = RuleEngine()
        result = engine.process_transaction(transaction)

        assert result["risk_score"] > 0
        assert len(result["triggered_rules"]) > 0
        assert transaction.risk_score > 0

    def test_alert_creation_on_rule_trigger(self, customer):
        """Test that alerts are created when rules are triggered"""
        transaction = Transaction.objects.create(
            transaction_reference="TXN_ALERT",
            customer=customer,
            amount=Decimal("25000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        initial_alert_count = Alert.objects.count()

        engine = RuleEngine()
        engine.process_transaction(transaction)

        new_alert_count = Alert.objects.count()
        assert new_alert_count > initial_alert_count

        # Verify alert details
        alert = Alert.objects.filter(transaction=transaction).first()
        assert alert is not None
        assert alert.severity in ["low", "medium", "high", "critical"]

    def test_multiple_rules_triggered(self, blacklisted_customer):
        """Test multiple rules can be triggered for same transaction"""
        transaction = Transaction.objects.create(
            transaction_reference="TXN_MULTI_RULE",
            customer=blacklisted_customer,
            amount=Decimal("30000.00"),  # High value + blacklisted
            currency="USD",
            transaction_type="withdrawal",
        )

        engine = RuleEngine()
        result = engine.process_transaction(transaction)

        # Should trigger both high value and customer risk rules
        assert len(result["triggered_rules"]) >= 2
        assert result["risk_score"] > 50  # Higher score due to multiple rules

    def test_risk_score_calculation(self, customer):
        """Test risk score is calculated correctly"""
        low_risk_transaction = Transaction.objects.create(
            transaction_reference="TXN_LOW_RISK",
            customer=customer,
            amount=Decimal("100.00"),
            currency="USD",
            transaction_type="deposit",
        )

        high_risk_transaction = Transaction.objects.create(
            transaction_reference="TXN_HIGH_RISK",
            customer=customer,
            amount=Decimal("50000.00"),
            currency="USD",
            transaction_type="withdrawal",
        )

        engine = RuleEngine()

        low_result = engine.process_transaction(low_risk_transaction)
        high_result = engine.process_transaction(high_risk_transaction)

        assert high_result["risk_score"] > low_result["risk_score"]
        assert 0 <= low_result["risk_score"] <= 100
        assert 0 <= high_result["risk_score"] <= 100
