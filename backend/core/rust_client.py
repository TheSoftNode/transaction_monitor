import logging
from typing import Any, Dict, Optional

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class RustRiskScorerClient:
    """Client for integrating with Rust risk scoring microservice"""

    def __init__(self):
        self.base_url = getattr(
            settings, "RUST_RISK_SCORER_URL", "http://localhost:8001"
        )
        self.timeout = 5
        self.enabled = getattr(settings, "RUST_RISK_SCORER_ENABLED", False)

    def is_available(self) -> bool:
        """Check if Rust service is available"""
        if not self.enabled:
            return False

        try:
            response = requests.get(f"{self.base_url}/health", timeout=2)
            return response.status_code == 200
        except Exception:
            return False

    def calculate_risk_score(
        self, transaction_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Calculate risk score using Rust microservice.

        Falls back gracefully if service is unavailable.
        """
        if not self.enabled:
            logger.debug("Rust risk scorer is disabled")
            return None

        try:
            payload = {
                "transaction_id": str(transaction_data.get("id", "")),
                "customer_id": str(transaction_data.get("customer_id", "")),
                "amount": float(transaction_data.get("amount", 0)),
                "currency": transaction_data.get("currency", "USD"),
                "transaction_type": transaction_data.get("transaction_type", ""),
                "country_code": transaction_data.get("country_code", "USA"),
                "customer_risk_level": transaction_data.get(
                    "customer_risk_level", "low"
                ),
                "is_blacklisted": transaction_data.get("is_blacklisted", False),
            }

            response = requests.post(
                f"{self.base_url}/api/score", json=payload, timeout=self.timeout
            )

            if response.status_code == 200:
                result = response.json()
                logger.info(
                    f"Rust scorer: transaction {payload['transaction_id']} "
                    f"scored {result['risk_score']} in {result['processing_time_us']}μs"
                )
                return result
            else:
                logger.warning(f"Rust scorer returned status {response.status_code}")
                return None

        except requests.Timeout:
            logger.warning("Rust risk scorer timeout")
            return None
        except Exception as e:
            logger.error(f"Rust risk scorer error: {str(e)}")
            return None


rust_scorer = RustRiskScorerClient()
