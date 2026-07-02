from decimal import Decimal
from apps.transactions.models import Transaction
from rules.base import BaseRule
from rules.registry import RuleRegistry


@RuleRegistry.register
class HighValueTransactionRule(BaseRule):
    """Triggers when a transaction exceeds a specified amount threshold"""

    def __init__(self, config=None):
        super().__init__(config)
        self.threshold = Decimal(self.config.get('threshold', 10000))

    def evaluate(self, transaction: Transaction) -> bool:
        return transaction.amount > self.threshold

    def get_severity(self) -> str:
        if transaction_amount := getattr(self, '_current_transaction_amount', None):
            if transaction_amount > self.threshold * 5:
                return 'critical'
            elif transaction_amount > self.threshold * 2:
                return 'high'
        return 'medium'

    def get_message(self, transaction: Transaction) -> str:
        self._current_transaction_amount = transaction.amount
        return (
            f"High value transaction detected: {transaction.amount} {transaction.currency} "
            f"exceeds threshold of {self.threshold}"
        )
