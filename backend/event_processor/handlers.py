import logging
from typing import Dict, Any
from django.utils import timezone
from apps.transactions.models import Transaction
from apps.alerts.models import AuditLog
from rules.engine import RuleEngine

logger = logging.getLogger(__name__)


class TransactionEventHandler:
    def __init__(self):
        self.rule_engine = RuleEngine()

    def handle_transaction_created(self, event_data: Dict[str, Any]):
        """
        Handle transaction.created event
        - Evaluate rules
        - Update risk score
        - Create alerts if needed
        """
        transaction_id = event_data.get("transaction_id")
        if not transaction_id:
            logger.error("No transaction_id in event data")
            return

        try:
            transaction = Transaction.objects.select_related("customer").get(
                id=transaction_id
            )

            logger.info(f"Processing transaction: {transaction.transaction_reference}")

            result = self.rule_engine.process_transaction(transaction)

            logger.info(
                f"Transaction processed: {transaction.transaction_reference}, "
                f"Risk Score: {result['risk_score']}, "
                f"Alerts Created: {result['rules_count']}"
            )

            if result["rules_count"] > 0:
                transaction.processed_at = timezone.now()
                transaction.save(update_fields=["processed_at"])

        except Transaction.DoesNotExist:
            logger.error(f"Transaction not found: {transaction_id}")
        except Exception as e:
            logger.error(
                f"Error processing transaction {transaction_id}: {str(e)}",
                exc_info=True,
            )

    def reload_rules(self):
        """Reload rules from database"""
        self.rule_engine.load_active_rules()
        logger.info("Rules reloaded")
