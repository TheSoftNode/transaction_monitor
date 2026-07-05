from apps.transactions.models import Transaction
from rules.base import BaseRule
from rules.registry import RuleRegistry


@RuleRegistry.register
class BlacklistedCountryRule(BaseRule):
    """Triggers when a transaction involves a customer from a blacklisted country"""

    def __init__(self, config=None):
        super().__init__(config)
        self.blacklisted_countries = self.config.get(
            "blacklisted_countries", ["KP", "IR", "SY", "CU", "VE"]
        )

    def evaluate(self, transaction: Transaction) -> bool:
        return transaction.customer.country_code.upper() in self.blacklisted_countries

    def get_severity(self, transaction: Transaction) -> str:
        return "critical"

    def get_message(self, transaction: Transaction) -> str:
        return (
            f"Transaction from blacklisted country: {transaction.customer.country_code}. "
            f"Customer: {transaction.customer.full_name}"
        )
