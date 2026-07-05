import logging

from apps.transactions.models import Transaction
from django.core.management.base import BaseCommand
from django.db.models import Sum
from ml.anomaly_detector import detector

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Train ML anomaly detection model on historical transactions"

    def add_arguments(self, parser):
        parser.add_argument(
            "--min-samples",
            type=int,
            default=100,
            help="Minimum number of transactions required for training",
        )

    def handle(self, *args, **options):
        min_samples = options["min_samples"]

        self.stdout.write("Fetching historical transactions...")
        transactions = Transaction.objects.select_related("customer").all()

        if transactions.count() < min_samples:
            self.stdout.write(
                self.style.ERROR(
                    f"Insufficient data: {transactions.count()} transactions found, "
                    f"need at least {min_samples}"
                )
            )
            return

        self.stdout.write(f"Found {transactions.count()} transactions")
        self.stdout.write("Preparing training data...")

        training_data = []
        for txn in transactions:
            customer_txn_count = Transaction.objects.filter(
                customer=txn.customer
            ).count()
            customer_total_volume = (
                Transaction.objects.filter(customer=txn.customer).aggregate(
                    total=Sum("amount")
                )["total"]
                or 0
            )

            training_data.append(
                {
                    "amount": float(txn.amount),
                    "transaction_type": txn.transaction_type,
                    "customer_risk_level": txn.customer.risk_level,
                    "is_blacklisted": txn.customer.is_blacklisted,
                    "country_code": txn.customer.country,
                    "timestamp": txn.created_at,
                    "customer_transaction_count": customer_txn_count,
                    "customer_total_volume": float(customer_total_volume),
                }
            )

        self.stdout.write(
            self.style.SUCCESS(f"Training model on {len(training_data)} samples...")
        )

        result = detector.train(training_data)

        if result.get("success"):
            self.stdout.write(self.style.SUCCESS("Model trained successfully!"))
            self.stdout.write(f"Training samples: {result['samples_trained']}")
            self.stdout.write(f"Validation samples: {result['samples_validated']}")
            self.stdout.write(
                f"Train score: {result['train_score_mean']:.4f} ± {result['train_score_std']:.4f}"
            )
            self.stdout.write(
                f"Validation score: {result['val_score_mean']:.4f} ± {result['val_score_std']:.4f}"
            )
            self.stdout.write(f"Model version: {result['model_version']}")
        else:
            self.stdout.write(
                self.style.ERROR(f"Training failed: {result.get('error')}")
            )
