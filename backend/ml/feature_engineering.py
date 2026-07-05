from datetime import datetime
from typing import Any, Dict

import numpy as np


class FeatureExtractor:
    """Extract and engineer features from raw transaction data"""

    HIGH_RISK_COUNTRIES = {"IRN", "PRK", "SYR", "SDN", "CUB", "VEN"}
    MEDIUM_RISK_COUNTRIES = {"RUS", "CHN", "PAK", "AFG"}

    @staticmethod
    def extract(transaction_data: Dict[str, Any]) -> np.ndarray:
        """
        Extract feature vector from transaction.
        Returns standardized numpy array.
        """
        amount = float(transaction_data.get("amount", 0))
        timestamp = transaction_data.get("timestamp")

        if timestamp:
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp)
            hour = timestamp.hour
            day_of_week = timestamp.weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            is_night = 1 if hour < 6 or hour >= 22 else 0
        else:
            hour = 12
            day_of_week = 3
            is_weekend = 0
            is_night = 0

        features = [
            amount,
            np.log1p(amount),
            hour,
            day_of_week,
            is_weekend,
            is_night,
            FeatureExtractor._encode_transaction_type(
                transaction_data.get("transaction_type", "deposit")
            ),
            FeatureExtractor._encode_risk_level(
                transaction_data.get("customer_risk_level", "low")
            ),
            1 if transaction_data.get("is_blacklisted", False) else 0,
            FeatureExtractor._get_country_risk_score(
                transaction_data.get("country_code", "USA")
            ),
            transaction_data.get("customer_transaction_count", 0),
            float(transaction_data.get("customer_total_volume", 0)),
        ]

        return np.array(features, dtype=np.float32)

    @staticmethod
    def _encode_transaction_type(txn_type: str) -> int:
        mapping = {"deposit": 0, "withdrawal": 1, "transfer": 2, "payment": 1}
        return mapping.get(txn_type.lower(), 0)

    @staticmethod
    def _encode_risk_level(risk_level: str) -> int:
        mapping = {"low": 0, "medium": 1, "high": 2}
        return mapping.get(risk_level.lower(), 0)

    @staticmethod
    def _get_country_risk_score(country_code: str) -> int:
        if country_code in FeatureExtractor.HIGH_RISK_COUNTRIES:
            return 2
        elif country_code in FeatureExtractor.MEDIUM_RISK_COUNTRIES:
            return 1
        return 0

    @staticmethod
    def get_feature_names() -> list:
        """Return feature names for interpretability"""
        return [
            "amount",
            "log_amount",
            "hour",
            "day_of_week",
            "is_weekend",
            "is_night",
            "transaction_type",
            "customer_risk_level",
            "is_blacklisted",
            "country_risk_score",
            "customer_transaction_count",
            "customer_total_volume",
        ]
