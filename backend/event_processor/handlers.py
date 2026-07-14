import logging
from typing import Any, Dict

from django.utils import timezone

from apps.transactions.models import Transaction
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

        Idempotent: Kafka's at-least-once delivery means this can run more
        than once for the same transaction (e.g. redelivery after a crash).
        `processed_at` doubles as a "have I already done this" guard so a
        redelivered event is a no-op instead of creating duplicate alerts
        and audit log entries.
        """
        transaction_id = event_data.get("transaction_id")
        if not transaction_id:
            logger.error("No transaction_id in event data")
            return

        try:
            transaction = Transaction.objects.select_related("customer").get(
                id=transaction_id
            )

            if transaction.processed_at is not None:
                logger.info(
                    f"Transaction {transaction.transaction_reference} already "
                    "processed; skipping duplicate delivery"
                )
                return

            logger.info(f"Processing transaction: {transaction.transaction_reference}")

            result = self.rule_engine.process_transaction(transaction)

            logger.info(
                f"Transaction processed: {transaction.transaction_reference}, "
                f"Risk Score: {result['risk_score']}, "
                f"Alerts Created: {result['rules_count']}"
            )

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
