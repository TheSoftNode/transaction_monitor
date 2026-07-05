from decimal import Decimal
from unittest.mock import MagicMock, Mock, patch

import pytest
from apps.customers.models import Customer
from apps.transactions.models import Transaction
from event_processor.handlers import TransactionEventHandler


@pytest.mark.django_db
class TestEventProcessor:
    """Test event processor functionality"""

    def test_transaction_event_handler_initialization(self):
        """Test handler initializes correctly"""
        handler = TransactionEventHandler()
        assert handler is not None
        assert handler.rule_engine is not None

    def test_handle_transaction_created(self, customer):
        """Test handling transaction.created event"""
        # Create a transaction
        transaction = Transaction.objects.create(
            transaction_reference="TXN_EVENT_TEST",
            customer=customer,
            amount=Decimal("15000.00"),
            currency="USD",
            transaction_type="withdrawal",
        )

        # Prepare event data
        event_data = {
            "transaction_id": str(transaction.id),
            "transaction_reference": transaction.transaction_reference,
            "customer_id": str(customer.id),
            "amount": "15000.00",
            "currency": "USD",
            "transaction_type": "withdrawal",
        }

        # Process the event
        handler = TransactionEventHandler()
        handler.handle_transaction_created(event_data)

        # Verify transaction was processed
        transaction.refresh_from_db()
        assert transaction.risk_score > 0

    def test_handle_transaction_created_with_nonexistent_transaction(self):
        """Test handling event for non-existent transaction"""
        event_data = {
            "transaction_id": "00000000-0000-0000-0000-000000000000",
        }

        handler = TransactionEventHandler()
        with pytest.raises(Transaction.DoesNotExist):
            handler.handle_transaction_created(event_data)

    @patch("event_processor.handlers.logger")
    def test_event_handler_logging(self, mock_logger, customer):
        """Test that event processing logs correctly"""
        transaction = Transaction.objects.create(
            transaction_reference="TXN_LOG_TEST",
            customer=customer,
            amount=Decimal("5000.00"),
            currency="USD",
            transaction_type="deposit",
        )

        event_data = {
            "transaction_id": str(transaction.id),
            "transaction_reference": transaction.transaction_reference,
        }

        handler = TransactionEventHandler()
        handler.handle_transaction_created(event_data)

        # Verify logging was called
        assert mock_logger.info.called
