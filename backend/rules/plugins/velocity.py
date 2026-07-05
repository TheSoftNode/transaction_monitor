from datetime import timedelta

from apps.transactions.models import Transaction
from django.utils import timezone
from rules.base import BaseRule
from rules.registry import RuleRegistry


@RuleRegistry.register
class VelocityRule(BaseRule):
    """Triggers when a customer makes too many transactions within a time window"""

    def __init__(self, config=None):
        super().__init__(config)
        self.max_transactions = self.config.get("max_transactions", 5)
        self.time_window_hours = self.config.get("time_window_hours", 1)

    def evaluate(self, transaction: Transaction) -> bool:
        time_threshold = timezone.now() - timedelta(hours=self.time_window_hours)

        recent_transactions = Transaction.objects.filter(
            customer=transaction.customer, created_at__gte=time_threshold
        ).count()

        return recent_transactions > self.max_transactions

    def get_severity(self) -> str:
        return "high"

    def get_message(self, transaction: Transaction) -> str:
        time_threshold = timezone.now() - timedelta(hours=self.time_window_hours)
        count = Transaction.objects.filter(
            customer=transaction.customer, created_at__gte=time_threshold
        ).count()

        return (
            f"Velocity check failed: {count} transactions in the last "
            f"{self.time_window_hours} hour(s), exceeding limit of {self.max_transactions}"
        )
