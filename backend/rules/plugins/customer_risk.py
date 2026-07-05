from apps.transactions.models import Transaction
from rules.base import BaseRule
from rules.registry import RuleRegistry


@RuleRegistry.register
class HighRiskCustomerRule(BaseRule):
    """Triggers when a transaction involves a high-risk or blacklisted customer"""

    def evaluate(self, transaction: Transaction) -> bool:
        return (
            transaction.customer.risk_level == "high"
            or transaction.customer.is_blacklisted
        )

    def get_severity(self, transaction: Transaction) -> str:
        if transaction.customer.is_blacklisted:
            return "critical"
        return "high"

    def get_message(self, transaction: Transaction) -> str:
        if transaction.customer.is_blacklisted:
            return (
                f"Transaction from blacklisted customer: {transaction.customer.full_name} "
                f"({transaction.customer.customer_reference})"
            )
        else:
            return (
                f"Transaction from high-risk customer: {transaction.customer.full_name} "
                f"(Risk Level: {transaction.customer.risk_level})"
            )
