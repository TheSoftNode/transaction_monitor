"""
Management command to seed the database with sample data
"""

from decimal import Decimal
from random import choice, randint, uniform

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.alerts.models import Alert
from apps.customers.models import Customer
from apps.transactions.models import Transaction
from rules.models import RuleConfiguration

User = get_user_model()


class Command(BaseCommand):
    help = "Seed the database with sample data for testing and demonstration"

    def add_arguments(self, parser):
        parser.add_argument(
            "--customers",
            type=int,
            default=20,
            help="Number of customers to create (default: 20)",
        )
        parser.add_argument(
            "--transactions",
            type=int,
            default=50,
            help="Number of transactions to create (default: 50)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data before seeding",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        customers_count = options["customers"]
        transactions_count = options["transactions"]
        clear_data = options["clear"]

        if clear_data:
            self.stdout.write(self.style.WARNING("Clearing existing data..."))
            Alert.objects.all().delete()
            Transaction.objects.all().delete()
            Customer.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS("✓ Existing data cleared"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSeeding database with {customers_count} customers "
                f"and {transactions_count} transactions..."
            )
        )

        # Create admin user if not exists
        admin_user = self._create_admin_user()

        # Seed rule configurations
        self._seed_rule_configurations()

        # Seed customers
        customers = self._seed_customers(customers_count)

        # Seed transactions
        self._seed_transactions(transactions_count, customers)

        self.stdout.write(
            self.style.SUCCESS(
                f"\n{'='*60}\n"
                f"Database seeded successfully!\n"
                f"{'='*60}\n"
                f"Customers created: {customers_count}\n"
                f"Transactions created: {transactions_count}\n"
                f"Admin user: {admin_user.username}\n"
                f"{'='*60}\n"
            )
        )

    def _create_admin_user(self):
        """Create or get admin user"""
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@transactionmonitor.com",
                "is_staff": True,
                "is_superuser": True,
                "first_name": "Admin",
                "last_name": "User",
            },
        )

        if created:
            admin_user.set_password("admin123")
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Admin user created: username=admin, password=admin123"
                )
            )
        else:
            self.stdout.write(self.style.WARNING("✓ Admin user already exists"))

        return admin_user

    def _seed_rule_configurations(self):
        """Seed rule configurations"""
        rules = [
            {
                "rule_name": "HighValueTransactionRule",
                "is_active": True,
                "priority": 100,
                "parameters": {"threshold": 10000},
                "description": "Triggers for transactions above $10,000",
            },
            {
                "rule_name": "VelocityRule",
                "is_active": True,
                "priority": 90,
                "parameters": {"max_transactions": 5, "time_window_hours": 1},
                "description": "Triggers for more than 5 transactions in 1 hour",
            },
            {
                "rule_name": "BlacklistedCountryRule",
                "is_active": True,
                "priority": 95,
                "parameters": {"blacklisted_countries": ["KP", "IR", "SY", "CU", "VE"]},
                "description": "Triggers for blacklisted countries",
            },
            {
                "rule_name": "HighRiskCustomerRule",
                "is_active": True,
                "priority": 85,
                "parameters": {},
                "description": "Triggers for high-risk or blacklisted customers",
            },
        ]

        created_count = 0
        for rule_data in rules:
            rule, created = RuleConfiguration.objects.update_or_create(
                rule_name=rule_data["rule_name"], defaults=rule_data
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"✓ {created_count} rule configurations created")
        )

    def _seed_customers(self, count):
        """Seed customer data"""
        countries = ["US", "GB", "CA", "DE", "FR", "AU", "JP", "SG", "KP", "IR"]
        risk_levels = ["low", "medium", "high"]

        first_names = [
            "John",
            "Jane",
            "Michael",
            "Sarah",
            "David",
            "Emma",
            "Robert",
            "Lisa",
            "James",
            "Maria",
            "William",
            "Anna",
            "Richard",
            "Sophie",
            "Thomas",
            "Emily",
            "Daniel",
            "Olivia",
            "Matthew",
            "Isabella",
        ]
        last_names = [
            "Smith",
            "Johnson",
            "Williams",
            "Brown",
            "Jones",
            "Garcia",
            "Miller",
            "Davis",
            "Rodriguez",
            "Martinez",
            "Anderson",
            "Taylor",
            "Thomas",
            "Moore",
            "Jackson",
            "Martin",
            "Lee",
            "White",
            "Harris",
            "Clark",
        ]

        customers = []
        for i in range(count):
            first_name = choice(first_names)
            last_name = choice(last_names)
            country = choice(countries)

            # Higher chance of high risk for blacklisted countries
            if country in ["KP", "IR"]:
                risk_level = choice(["high", "high", "high", "medium"])
                is_blacklisted = choice([True, False])
            else:
                risk_level = choice(risk_levels)
                is_blacklisted = False

            customer = Customer.objects.create(
                customer_reference=f"CUST{1000 + i:04d}",
                full_name=f"{first_name} {last_name}",
                email=f"{first_name.lower()}.{last_name.lower()}{i}@example.com",
                phone=f"+1{randint(2000000000, 9999999999)}",
                country_code=country,
                risk_level=risk_level,
                is_blacklisted=is_blacklisted,
                metadata={
                    "account_created": timezone.now().isoformat(),
                    "source": "seed_data",
                },
            )
            customers.append(customer)

        self.stdout.write(self.style.SUCCESS(f"✓ {count} customers created"))
        return customers

    def _seed_transactions(self, count, customers):
        """Seed transaction data"""
        transaction_types = ["deposit", "withdrawal", "transfer", "payment"]
        currencies = ["USD", "EUR", "GBP", "CAD", "AUD"]
        statuses = ["pending", "approved", "rejected", "under_review"]

        transactions = []
        for i in range(count):
            customer = choice(customers)
            transaction_type = choice(transaction_types)

            # Generate realistic amounts
            amount = self._generate_amount(customer.risk_level)

            # High-risk customers more likely to have high amounts
            if customer.risk_level == "high" or customer.is_blacklisted:
                amount = amount * uniform(1.5, 3.0)

            transaction = Transaction.objects.create(
                transaction_reference=f"TXN{10000 + i:05d}",
                customer=customer,
                amount=Decimal(str(round(amount, 2))),
                currency=choice(currencies),
                transaction_type=transaction_type,
                status=choice(statuses),
                risk_score=randint(0, 100),
                metadata={
                    "ip_address": f"192.168.{randint(1, 255)}.{randint(1, 255)}",
                    "user_agent": "Mozilla/5.0 (Seed Data)",
                    "source": "seed_data",
                },
            )
            transactions.append(transaction)

        self.stdout.write(self.style.SUCCESS(f"✓ {count} transactions created"))
        return transactions

    def _generate_amount(self, risk_level):
        """Generate transaction amount based on risk level"""
        if risk_level == "low":
            return uniform(100, 5000)
        elif risk_level == "medium":
            return uniform(1000, 15000)
        else:  # high
            return uniform(5000, 50000)
