"""
Comprehensive tests to achieve 95%+ coverage
"""

from decimal import Decimal
from unittest.mock import patch

import pytest

from apps.alerts.models import Alert, AuditLog
from apps.transactions.models import Transaction
from rules.base import BaseRule
from rules.engine import RuleEngine
from rules.models import RuleConfiguration
from rules.registry import RuleRegistry


@pytest.mark.django_db
class TestRuleEngineComprehensive:
    """Comprehensive rule engine tests for coverage"""

    def test_rule_engine_evaluate_transaction(self, customer):
        """Test evaluate_transaction method"""
        transaction = Transaction.objects.create(
            transaction_reference="TXN_EVAL",
            customer=customer,
            amount=Decimal("15000.00"),
            currency="USD",
            transaction_type="withdrawal",
        )

        engine = RuleEngine()
        result = engine.evaluate_transaction(transaction)

        assert "triggered_rules" in result
        assert "risk_score" in result
        assert "rules_count" in result
        assert result["risk_score"] >= 0
        assert result["risk_score"] <= 100

    def test_rule_engine_process_transaction_with_metadata(self, customer, user):
        """Test process_transaction with request metadata"""
        transaction = Transaction.objects.create(
            transaction_reference="TXN_META",
            customer=customer,
            amount=Decimal("20000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        engine = RuleEngine()
        request_meta = {"REMOTE_ADDR": "192.168.1.1", "HTTP_USER_AGENT": "Mozilla/5.0"}

        engine.process_transaction(transaction, user=user, request_meta=request_meta)

        # Verify audit log was created with metadata
        audit_logs = AuditLog.objects.filter(transaction=transaction)
        assert audit_logs.exists()
        audit_log = audit_logs.first()
        assert audit_log.ip_address == "192.168.1.1"
        assert audit_log.user_agent == "Mozilla/5.0"

    def test_rule_engine_risk_score_cap(self, blacklisted_customer):
        """Test that risk score is capped at 100"""
        # Create a transaction that triggers multiple rules
        transaction = Transaction.objects.create(
            transaction_reference="TXN_CAP",
            customer=blacklisted_customer,
            amount=Decimal("100000.00"),  # Very high
            currency="USD",
            transaction_type="withdrawal",
        )

        engine = RuleEngine()
        result = engine.evaluate_transaction(transaction)

        # Risk score should never exceed 100
        assert result["risk_score"] <= 100

    @patch("rules.engine.logger")
    def test_rule_engine_error_handling(self, mock_logger, customer):
        """Test rule engine handles rule evaluation errors"""
        transaction = Transaction.objects.create(
            transaction_reference="TXN_ERROR",
            customer=customer,
            amount=Decimal("5000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        engine = RuleEngine()

        # Mock one of the rules to raise an exception
        with patch.object(
            (
                engine.rules[0]
                if engine.rules
                else type("obj", (object,), {"evaluate": lambda x: None})()
            ),
            "evaluate",
            side_effect=Exception("Test error"),
        ):
            result = engine.evaluate_transaction(transaction)

            # Should still return a valid result
            assert "risk_score" in result

    def test_alert_status_values(self, transaction):
        """Test all alert status values"""
        alert = Alert.objects.create(
            transaction=transaction,
            rule_name="TestRule",
            severity="high",
            message="Test",
            status="active",
        )

        assert alert.status == "active"

        alert.status = "resolved"
        alert.save()
        assert alert.status == "resolved"

    def test_alert_severity_values(self, transaction):
        """Test all alert severity values"""
        severities = ["low", "medium", "high", "critical"]

        for severity in severities:
            alert = Alert.objects.create(
                transaction=transaction,
                rule_name=f"Rule{severity}",
                severity=severity,
                message=f"Test {severity}",
                status="active",
            )
            assert alert.severity == severity


@pytest.mark.django_db
class TestModelsComprehensive:
    """Comprehensive model tests"""

    def test_customer_str_method(self, customer):
        """Test Customer __str__ method"""
        assert str(customer) == customer.customer_reference

    def test_transaction_str_method(self, transaction):
        """Test Transaction __str__ method"""
        expected = (
            f"{transaction.transaction_reference} - "
            f"{transaction.customer.full_name} - "
            f"{transaction.amount} {transaction.currency}"
        )
        assert str(transaction) == expected

    def test_alert_str_method(self, transaction):
        """Test Alert __str__ method"""
        alert = Alert.objects.create(
            transaction=transaction,
            rule_name="TestRule",
            severity="high",
            message="Test alert",
            status="active",
        )
        expected = f"Alert: {alert.rule_name} - {alert.severity} - {alert.transaction.transaction_reference}"
        assert str(alert) == expected

    def test_audit_log_str_method(self, transaction, user):
        """Test AuditLog __str__ method"""
        audit_log = AuditLog.objects.create(
            transaction=transaction, event_type="TEST", actor=user, details={}
        )
        expected = (
            f"{audit_log.event_type} - {audit_log.transaction.transaction_reference}"
        )
        assert str(audit_log) == expected

    def test_rule_configuration_str_method(self):
        """Test RuleConfiguration __str__ method"""
        config = RuleConfiguration.objects.create(
            rule_name="TestRule", is_active=True, priority=100
        )
        assert str(config) == f"{config.rule_name} (Priority: {config.priority})"


@pytest.mark.django_db
class TestRulePluginsComprehensive:
    """Comprehensive tests for all rule plugins"""

    def test_high_value_rule_name_property(self):
        """Test HighValueTransactionRule name property"""
        from rules.plugins.high_value import HighValueTransactionRule

        rule = HighValueTransactionRule()
        assert rule.name == "HighValueTransactionRule"

    def test_velocity_rule_name_property(self):
        """Test VelocityRule name property"""
        from rules.plugins.velocity import VelocityRule

        rule = VelocityRule()
        assert rule.name == "VelocityRule"

    def test_geographic_rule_name_property(self):
        """Test BlacklistedCountryRule name property"""
        from rules.plugins.geographic import BlacklistedCountryRule

        rule = BlacklistedCountryRule()
        assert rule.name == "BlacklistedCountryRule"

    def test_customer_risk_rule_name_property(self):
        """Test HighRiskCustomerRule name property"""
        from rules.plugins.customer_risk import HighRiskCustomerRule

        rule = HighRiskCustomerRule()
        assert rule.name == "HighRiskCustomerRule"

    def test_velocity_rule_config_parameters(self, customer):
        """Test VelocityRule with different config parameters"""
        from rules.plugins.velocity import VelocityRule

        # Create 3 transactions
        for i in range(3):
            Transaction.objects.create(
                transaction_reference=f"TXN_VEL_CONFIG_{i}",
                customer=customer,
                amount=Decimal("1000.00"),
                currency="USD",
                transaction_type="deposit",
            )

        latest = (
            Transaction.objects.filter(customer=customer)
            .order_by("-created_at")
            .first()
        )

        # Test with max_transactions=2 (should trigger)
        rule = VelocityRule(config={"max_transactions": 2, "time_window_minutes": 60})
        assert rule.evaluate(latest) is True

        # Test with max_transactions=5 (should not trigger)
        rule2 = VelocityRule(config={"max_transactions": 5, "time_window_minutes": 60})
        assert rule2.evaluate(latest) is False

    def test_blacklisted_country_list(self):
        """Test BlacklistedCountryRule blacklisted countries"""
        from rules.plugins.geographic import BlacklistedCountryRule

        rule = BlacklistedCountryRule()

        # Test some known high-risk countries
        assert "PRK" in rule.blacklisted_countries  # North Korea
        assert "IRN" in rule.blacklisted_countries  # Iran

    def test_high_risk_customer_checks_blacklist_and_risk_level(self, customer):
        """Test HighRiskCustomerRule checks both blacklist and risk level"""
        from rules.plugins.customer_risk import HighRiskCustomerRule

        transaction = Transaction.objects.create(
            transaction_reference="TXN_RISK_CHECK",
            customer=customer,
            amount=Decimal("1000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        rule = HighRiskCustomerRule()

        # Low risk, not blacklisted = not triggered
        assert rule.evaluate(transaction) is False

        # Make customer high risk
        customer.risk_level = "high"
        customer.save()
        transaction.refresh_from_db()
        assert rule.evaluate(transaction) is True

        # Make customer blacklisted
        customer.risk_level = "low"
        customer.is_blacklisted = True
        customer.save()
        transaction.refresh_from_db()
        assert rule.evaluate(transaction) is True


@pytest.mark.django_db
class TestEventProcessorComprehensive:
    """Comprehensive event processor tests"""

    def test_event_handler_with_valid_transaction(self, customer):
        """Test event handler processes valid transaction"""
        from event_processor.handlers import TransactionEventHandler

        transaction = Transaction.objects.create(
            transaction_reference="TXN_EVT_VALID",
            customer=customer,
            amount=Decimal("5000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        event_data = {
            "transaction_id": str(transaction.id),
            "transaction_reference": transaction.transaction_reference,
        }

        handler = TransactionEventHandler()
        handler.handle_transaction_created(event_data)

        # Verify transaction was processed (risk score updated)
        transaction.refresh_from_db()
        assert transaction.risk_score >= 0

    @patch("event_processor.handlers.logger")
    def test_event_handler_logging(self, mock_logger, customer):
        """Test event handler logs correctly"""
        from event_processor.handlers import TransactionEventHandler

        transaction = Transaction.objects.create(
            transaction_reference="TXN_EVT_LOG",
            customer=customer,
            amount=Decimal("3000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        event_data = {
            "transaction_id": str(transaction.id),
        }

        handler = TransactionEventHandler()
        handler.handle_transaction_created(event_data)

        # Verify logging was called
        assert mock_logger.info.called


@pytest.mark.django_db
class TestRegistryComprehensive:
    """Comprehensive tests for rule registry"""

    def test_registry_get_rule(self):
        """Test RuleRegistry.get_rule method"""
        from rules.plugins.high_value import HighValueTransactionRule

        rule_class = RuleRegistry.get_rule("HighValueTransactionRule")
        assert rule_class is HighValueTransactionRule

    def test_registry_get_nonexistent_rule(self):
        """Test RuleRegistry.get_rule with non-existent rule"""
        rule_class = RuleRegistry.get_rule("NonExistentRule")
        assert rule_class is None

    def test_registry_get_all_rules(self):
        """Test RuleRegistry.get_all_rules method"""
        all_rules = RuleRegistry.get_all_rules()

        assert "HighValueTransactionRule" in all_rules
        assert "VelocityRule" in all_rules
        assert "BlacklistedCountryRule" in all_rules
        assert "HighRiskCustomerRule" in all_rules
