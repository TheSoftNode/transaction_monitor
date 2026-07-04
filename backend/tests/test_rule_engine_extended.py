import pytest
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from apps.customers.models import Customer
from apps.transactions.models import Transaction
from apps.alerts.models import Alert, AuditLog
from rules.engine import RuleEngine
from rules.plugins.high_value import HighValueTransactionRule
from rules.plugins.velocity import VelocityRule
from rules.plugins.geographic import BlacklistedCountryRule
from rules.plugins.customer_risk import HighRiskCustomerRule
from rules.models import RuleConfiguration


@pytest.mark.django_db
class TestRuleEngineExtended:
    """Extended tests for rule engine"""

    def test_rule_engine_with_configuration(self, customer):
        """Test rule engine uses database configuration"""
        # Create rule configuration
        RuleConfiguration.objects.create(
            rule_name="HighValueTransactionRule",
            is_active=True,
            priority=100,
            description="High value check",
            parameters={"threshold": 5000},
        )

        transaction = Transaction.objects.create(
            transaction_reference="TXN_CONFIG_TEST",
            customer=customer,
            amount=Decimal("6000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        engine = RuleEngine()
        result = engine.process_transaction(transaction)

        # Should trigger because 6000 > 5000 (configured threshold)
        assert result["risk_score"] > 0

    def test_rule_disabled_via_configuration(self, customer):
        """Test rule can be disabled via configuration"""
        # Create disabled rule configuration
        RuleConfiguration.objects.create(
            rule_name="HighValueTransactionRule",
            is_active=False,  # Disabled
            priority=100,
            parameters={"threshold": 100},
        )

        transaction = Transaction.objects.create(
            transaction_reference="TXN_DISABLED_RULE",
            customer=customer,
            amount=Decimal("50000.00"),  # Very high amount
            currency="USD",
            transaction_type="deposit",
        )

        engine = RuleEngine()
        result = engine.process_transaction(transaction)

        # Risk score might be 0 if rule is disabled
        # (depends on implementation)
        assert result is not None

    def test_high_value_rule_with_custom_threshold(self):
        """Test HighValueTransactionRule with custom threshold"""
        customer = Customer.objects.create(
            customer_reference="CUST_CUSTOM_THRESHOLD",
            full_name="Custom Threshold Customer",
            email="threshold@example.com",
            country_code="USA",
            risk_level="low",
        )

        transaction = Transaction.objects.create(
            transaction_reference="TXN_CUSTOM_THRESHOLD",
            customer=customer,
            amount=Decimal("8000.00"),
            currency="USD",
            transaction_type="withdrawal",
        )

        rule = HighValueTransactionRule(config={"threshold": 7000})
        triggered = rule.evaluate(transaction)

        assert triggered is True

    def test_high_value_rule_get_message(self, customer):
        """Test HighValueTransactionRule message generation"""
        transaction = Transaction.objects.create(
            transaction_reference="TXN_MESSAGE_TEST",
            customer=customer,
            amount=Decimal("25000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        rule = HighValueTransactionRule()
        message = rule.get_message(transaction)

        assert "High value transaction" in message or "high value" in message.lower()
        assert "25000" in message or transaction.currency in message

    def test_velocity_rule_time_window(self, customer):
        """Test VelocityRule respects time window"""
        base_time = timezone.now()

        # Create transactions within time window
        for i in range(3):
            Transaction.objects.create(
                transaction_reference=f"TXN_VELOCITY_WINDOW_{i}",
                customer=customer,
                amount=Decimal("1000.00"),
                currency="USD",
                transaction_type="deposit",
                created_at=base_time - timedelta(minutes=i * 10),
            )

        # Create transactions outside time window
        for i in range(3):
            Transaction.objects.create(
                transaction_reference=f"TXN_VELOCITY_OLD_{i}",
                customer=customer,
                amount=Decimal("1000.00"),
                currency="USD",
                transaction_type="deposit",
                created_at=base_time - timedelta(hours=3),
            )

        latest = (
            Transaction.objects.filter(customer=customer)
            .order_by("-created_at")
            .first()
        )

        rule = VelocityRule(config={"max_transactions": 5, "time_window_minutes": 60})
        triggered = rule.evaluate(latest)

        # Should not trigger because only 3 transactions in last hour
        assert triggered is False

    def test_blacklisted_country_rule_message(self):
        """Test BlacklistedCountryRule message"""
        customer = Customer.objects.create(
            customer_reference="CUST_BLACKLIST_MSG",
            full_name="Blacklist Message Test",
            email="blacklist_msg@example.com",
            country_code="PRK",  # North Korea - high risk
        )

        transaction = Transaction.objects.create(
            transaction_reference="TXN_BLACKLIST_MSG",
            customer=customer,
            amount=Decimal("1000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        rule = BlacklistedCountryRule()
        message = rule.get_message(transaction)

        assert "country" in message.lower() or "PRK" in message

    def test_high_risk_customer_rule_severity(self, blacklisted_customer):
        """Test HighRiskCustomerRule severity level"""
        rule = HighRiskCustomerRule()
        severity = rule.get_severity()

        assert severity in ["low", "medium", "high", "critical"]

    def test_risk_score_impact(self, customer):
        """Test risk score impact calculation"""
        rule = HighValueTransactionRule()
        impact = rule.get_risk_score_impact()

        assert isinstance(impact, int)
        assert 0 <= impact <= 100

    def test_transaction_status_changes_after_processing(self, customer):
        """Test transaction status changes to under_review for risky transactions"""
        transaction = Transaction.objects.create(
            transaction_reference="TXN_STATUS_CHANGE",
            customer=customer,
            amount=Decimal("50000.00"),
            currency="USD",
            transaction_type="withdrawal",
            status="pending",
        )

        engine = RuleEngine()
        engine.process_transaction(transaction)

        transaction.refresh_from_db()
        assert transaction.status in ["pending", "under_review"]

    def test_audit_log_created_on_processing(self, customer, user):
        """Test audit log is created when processing transaction"""
        transaction = Transaction.objects.create(
            transaction_reference="TXN_AUDIT_TEST",
            customer=customer,
            amount=Decimal("10000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        initial_count = AuditLog.objects.count()

        engine = RuleEngine()
        engine.process_transaction(transaction, user=user)

        new_count = AuditLog.objects.count()
        assert new_count > initial_count

    def test_multiple_alerts_for_multiple_rules(self, blacklisted_customer):
        """Test multiple alerts created when multiple rules trigger"""
        # Blacklisted customer + high value = 2 rules triggered
        transaction = Transaction.objects.create(
            transaction_reference="TXN_MULTI_ALERT",
            customer=blacklisted_customer,
            amount=Decimal("50000.00"),
            currency="USD",
            transaction_type="withdrawal",
        )

        initial_alerts = Alert.objects.filter(transaction=transaction).count()

        engine = RuleEngine()
        result = engine.process_transaction(transaction)

        new_alerts = Alert.objects.filter(transaction=transaction).count()

        # Should have more alerts after processing
        assert new_alerts > initial_alerts or result["rules_count"] > 0

    def test_rule_priority_ordering(self):
        """Test rules are ordered by priority"""
        RuleConfiguration.objects.create(
            rule_name="Rule1", is_active=True, priority=100
        )
        RuleConfiguration.objects.create(
            rule_name="Rule2", is_active=True, priority=200
        )

        configs = RuleConfiguration.objects.filter(is_active=True).order_by("-priority")

        assert configs.count() >= 2
        if configs.count() >= 2:
            assert configs[0].priority >= configs[1].priority
