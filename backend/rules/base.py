from abc import ABC, abstractmethod
from typing import Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from apps.transactions.models import Transaction


class BaseRule(ABC):
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = self.__class__.__name__
        self.description = self.__doc__ or "No description provided"

    @abstractmethod
    def evaluate(self, transaction: "Transaction") -> bool:
        """
        Evaluate the rule against a transaction.
        Returns True if the rule is triggered, False otherwise.
        """
        pass

    @abstractmethod
    def get_severity(self) -> str:
        """
        Return the severity level: 'low', 'medium', 'high', or 'critical'
        """
        pass

    @abstractmethod
    def get_message(self, transaction: "Transaction") -> str:
        """
        Generate a descriptive message about why the rule was triggered.
        """
        pass

    def get_risk_score_impact(self) -> int:
        """
        Return the risk score impact (0-100) when this rule is triggered.
        """
        severity_scores = {
            "low": 10,
            "medium": 25,
            "high": 50,
            "critical": 75,
        }
        return severity_scores.get(self.get_severity(), 10)
