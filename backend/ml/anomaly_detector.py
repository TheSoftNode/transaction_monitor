import os
import logging
import numpy as np
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import RobustScaler
from sklearn.model_selection import train_test_split
import joblib
from django.conf import settings

from .feature_engineering import FeatureExtractor

logger = logging.getLogger(__name__)


class ModelMetrics:
    """Track model performance and statistics"""

    def __init__(self):
        self.predictions_count = 0
        self.anomalies_detected = 0
        self.avg_score = 0.0
        self.last_trained = None

    def update(self, is_anomaly: bool, score: float):
        self.predictions_count += 1
        if is_anomaly:
            self.anomalies_detected += 1
        n = self.predictions_count
        self.avg_score = ((self.avg_score * (n - 1)) + score) / n

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_predictions": self.predictions_count,
            "anomalies_detected": self.anomalies_detected,
            "anomaly_rate": (
                self.anomalies_detected / self.predictions_count
                if self.predictions_count > 0
                else 0
            ),
            "avg_anomaly_score": round(self.avg_score, 4),
            "last_trained": (
                self.last_trained.isoformat() if self.last_trained else None
            ),
        }


class TransactionAnomalyDetector:
    """
    Production-grade ML anomaly detector for financial transactions.

    Uses Isolation Forest algorithm with robust feature engineering
    and comprehensive monitoring.
    """

    MODEL_VERSION = "1.0.0"
    MIN_TRAINING_SAMPLES = 100

    def __init__(
        self,
        model_dir: Optional[str] = None,
        contamination: float = 0.05,
        n_estimators: int = 150,
    ):
        self.model_dir = model_dir or os.path.join(settings.BASE_DIR, "ml", "models")
        self.model_path = os.path.join(self.model_dir, "anomaly_detector.pkl")
        self.scaler_path = os.path.join(self.model_dir, "scaler.pkl")
        self.metadata_path = os.path.join(self.model_dir, "metadata.pkl")

        self.contamination = contamination
        self.n_estimators = n_estimators
        self.model: Optional[IsolationForest] = None
        self.scaler: Optional[RobustScaler] = None
        self.metrics = ModelMetrics()
        self.feature_extractor = FeatureExtractor()
        self.is_trained = False

        self._initialize()

    def _initialize(self):
        """Initialize or load model"""
        if self._model_exists():
            self._load_model()
        else:
            self._create_new_model()

    def _model_exists(self) -> bool:
        """Check if trained model files exist"""
        return os.path.exists(self.model_path) and os.path.exists(self.scaler_path)

    def _create_new_model(self):
        """Create new untrained model"""
        self.model = IsolationForest(
            contamination=self.contamination,
            n_estimators=self.n_estimators,
            max_samples="auto",
            random_state=42,
            n_jobs=-1,
            warm_start=False,
        )
        self.scaler = RobustScaler()
        logger.info(
            f"Initialized new model (contamination={self.contamination}, "
            f"n_estimators={self.n_estimators})"
        )

    def _load_model(self):
        """Load pre-trained model from disk"""
        try:
            self.model = joblib.load(self.model_path)
            self.scaler = joblib.load(self.scaler_path)

            if os.path.exists(self.metadata_path):
                metadata = joblib.load(self.metadata_path)
                self.metrics.last_trained = metadata.get("trained_at")

            self.is_trained = True
            logger.info(f"Loaded pre-trained model (v{self.MODEL_VERSION})")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            self._create_new_model()

    def train(
        self, transactions: List[Dict[str, Any]], validation_split: float = 0.2
    ) -> Dict[str, Any]:
        """
        Train model on historical transactions.

        Args:
            transactions: List of transaction dictionaries
            validation_split: Fraction of data for validation

        Returns:
            Training metrics and statistics
        """
        if len(transactions) < self.MIN_TRAINING_SAMPLES:
            logger.warning(
                f"Insufficient training data: {len(transactions)} < {self.MIN_TRAINING_SAMPLES}"
            )
            return {"success": False, "error": "Insufficient training data"}

        try:
            X = self._prepare_features(transactions)

            X_train, X_val = train_test_split(
                X, test_size=validation_split, random_state=42
            )

            self.scaler.fit(X_train)
            X_train_scaled = self.scaler.transform(X_train)
            X_val_scaled = self.scaler.transform(X_val)

            self.model.fit(X_train_scaled)
            self.is_trained = True

            train_scores = self.model.score_samples(X_train_scaled)
            val_scores = self.model.score_samples(X_val_scaled)

            self._save_model()

            self.metrics.last_trained = datetime.utcnow()

            training_stats = {
                "success": True,
                "samples_trained": len(X_train),
                "samples_validated": len(X_val),
                "train_score_mean": float(np.mean(train_scores)),
                "train_score_std": float(np.std(train_scores)),
                "val_score_mean": float(np.mean(val_scores)),
                "val_score_std": float(np.std(val_scores)),
                "model_version": self.MODEL_VERSION,
                "trained_at": self.metrics.last_trained.isoformat(),
            }

            logger.info(
                f"Model trained successfully on {len(transactions)} transactions"
            )
            return training_stats

        except Exception as e:
            logger.error(f"Training failed: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _prepare_features(self, transactions: List[Dict[str, Any]]) -> np.ndarray:
        """Extract and stack features from transactions"""
        features = [self.feature_extractor.extract(txn) for txn in transactions]
        return np.vstack(features)

    def _save_model(self):
        """Persist model, scaler, and metadata to disk"""
        os.makedirs(self.model_dir, exist_ok=True)

        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)

        metadata = {
            "version": self.MODEL_VERSION,
            "trained_at": datetime.utcnow(),
            "contamination": self.contamination,
            "n_estimators": self.n_estimators,
            "feature_names": self.feature_extractor.get_feature_names(),
        }
        joblib.dump(metadata, self.metadata_path)

        logger.info(f"Model saved to {self.model_dir}")

    def predict(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect if transaction is anomalous.

        Args:
            transaction_data: Transaction dictionary

        Returns:
            Prediction result with anomaly flag, score, and confidence
        """
        if not self.is_trained:
            return {
                "is_anomaly": False,
                "anomaly_score": 0.0,
                "confidence": 0.0,
                "warning": "Model not trained",
            }

        try:
            features = self.feature_extractor.extract(transaction_data)
            features_scaled = self.scaler.transform(features.reshape(1, -1))

            prediction = self.model.predict(features_scaled)[0]
            score = self.model.score_samples(features_scaled)[0]

            is_anomaly = prediction == -1
            normalized_score = self._normalize_score(score)

            self.metrics.update(is_anomaly, normalized_score)

            result = {
                "is_anomaly": bool(is_anomaly),
                "anomaly_score": float(normalized_score),
                "confidence": float(abs(score)),
                "model_version": self.MODEL_VERSION,
            }

            if is_anomaly:
                logger.info(
                    f"Anomaly detected: {transaction_data.get('transaction_id', 'unknown')} "
                    f"(score: {normalized_score:.2f})"
                )

            return result

        except Exception as e:
            logger.error(f"Prediction error: {str(e)}", exc_info=True)
            return {
                "is_anomaly": False,
                "anomaly_score": 0.0,
                "confidence": 0.0,
                "error": str(e),
            }

    def _normalize_score(self, raw_score: float) -> float:
        """Normalize anomaly score to 0-100 range"""
        return max(0, min(100, abs(raw_score) * 100))

    def batch_predict(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Efficiently predict anomalies for multiple transactions"""
        if not self.is_trained or not transactions:
            return [self.predict(txn) for txn in transactions]

        try:
            X = self._prepare_features(transactions)
            X_scaled = self.scaler.transform(X)

            predictions = self.model.predict(X_scaled)
            scores = self.model.score_samples(X_scaled)

            results = []
            for i, (pred, score) in enumerate(zip(predictions, scores)):
                is_anomaly = pred == -1
                normalized_score = self._normalize_score(score)

                self.metrics.update(is_anomaly, normalized_score)

                results.append(
                    {
                        "is_anomaly": bool(is_anomaly),
                        "anomaly_score": float(normalized_score),
                        "confidence": float(abs(score)),
                        "model_version": self.MODEL_VERSION,
                    }
                )

            return results

        except Exception as e:
            logger.error(f"Batch prediction error: {str(e)}")
            return [self.predict(txn) for txn in transactions]

    def get_metrics(self) -> Dict[str, Any]:
        """Get model performance metrics"""
        return self.metrics.to_dict()


detector = TransactionAnomalyDetector()
