import logging
from typing import List, Optional
from django.db import transaction as db_transaction
from django.conf import settings
from apps.transactions.models import Transaction
from apps.alerts.models import Alert, AuditLog
from .models import RuleConfiguration
from .registry import RuleRegistry
from .base import BaseRule

logger = logging.getLogger(__name__)


class RuleEngine:
    def __init__(self, use_rust_scorer: bool = False):
        self.rules: List[BaseRule] = []
        self.use_rust_scorer = use_rust_scorer or getattr(
            settings, 'RUST_RISK_SCORER_ENABLED', False
        )
        self.load_active_rules()

    def load_active_rules(self):
        """Load all active rules from the database"""
        self.rules = []
        active_configs = RuleConfiguration.objects.filter(is_active=True).order_by('-priority')

        for config in active_configs:
            rule_class = RuleRegistry.get_rule(config.rule_name)
            if rule_class:
                rule_instance = rule_class(config=config.parameters)
                self.rules.append(rule_instance)
                logger.info(f"Loaded rule: {config.rule_name}")
            else:
                logger.warning(f"Rule class not found: {config.rule_name}")

    def evaluate_transaction(self, transaction: Transaction) -> dict:
        """
        Evaluate all rules against a transaction.
        Uses Rust microservice if enabled, otherwise falls back to Python rules.
        """
        if self.use_rust_scorer:
            rust_result = self._evaluate_with_rust(transaction)
            if rust_result:
                return rust_result

        triggered_rules = []
        total_risk_score = 0

        for rule in self.rules:
            try:
                if rule.evaluate(transaction):
                    triggered_rules.append({
                        'rule': rule,
                        'severity': rule.get_severity(),
                        'message': rule.get_message(transaction),
                        'risk_impact': rule.get_risk_score_impact()
                    })
                    total_risk_score += rule.get_risk_score_impact()
                    logger.info(
                        f"Rule triggered: {rule.name} for transaction {transaction.transaction_reference}"
                    )
            except Exception as e:
                logger.error(f"Error evaluating rule {rule.name}: {str(e)}", exc_info=True)

        risk_score = min(total_risk_score, 100)

        return {
            'triggered_rules': triggered_rules,
            'risk_score': risk_score,
            'rules_count': len(triggered_rules)
        }

    def _evaluate_with_rust(self, transaction: Transaction) -> Optional[dict]:
        """Evaluate transaction using Rust microservice"""
        try:
            from core.rust_client import rust_scorer

            transaction_data = {
                'id': transaction.id,
                'customer_id': transaction.customer.id,
                'amount': transaction.amount,
                'currency': transaction.currency,
                'transaction_type': transaction.transaction_type,
                'country_code': transaction.customer.country_code,
                'customer_risk_level': transaction.customer.risk_level,
                'is_blacklisted': transaction.customer.is_blacklisted,
            }

            result = rust_scorer.calculate_risk_score(transaction_data)
            if result:
                return {
                    'triggered_rules': [],
                    'risk_score': result['risk_score'],
                    'rules_count': len(result.get('risk_factors', [])),
                    'rust_result': result
                }
        except Exception as e:
            logger.warning(f"Rust scorer failed, falling back to Python: {str(e)}")

        return None

    @db_transaction.atomic
    def process_transaction(self, transaction: Transaction, user=None, request_meta=None):
        """
        Process a transaction through the rule engine and create alerts/audit logs.
        """
        result = self.evaluate_transaction(transaction)

        transaction.risk_score = result['risk_score']
        if result['rules_count'] > 0:
            transaction.status = 'under_review'
        transaction.save(update_fields=['risk_score', 'status'])

        for rule_data in result['triggered_rules']:
            Alert.objects.create(
                transaction=transaction,
                rule_name=rule_data['rule'].name,
                severity=rule_data['severity'],
                message=rule_data['message'],
                status='open'
            )

        AuditLog.objects.create(
            transaction=transaction,
            event_type='RULE_EVALUATION',
            actor=user,
            details={
                'risk_score': result['risk_score'],
                'triggered_rules': [r['rule'].name for r in result['triggered_rules']],
                'rules_count': result['rules_count']
            },
            ip_address=request_meta.get('REMOTE_ADDR') if request_meta else None,
            user_agent=request_meta.get('HTTP_USER_AGENT') if request_meta else None
        )

        logger.info(
            f"Processed transaction {transaction.transaction_reference}: "
            f"Risk Score={result['risk_score']}, Alerts={result['rules_count']}"
        )

        return result
