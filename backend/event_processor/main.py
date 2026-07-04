#!/usr/bin/env python
import signal
import sys
import logging
from django.conf import settings
from infrastructure.messaging.kafka import KafkaMessageConsumer
from .handlers import TransactionEventHandler
from .config import *  # noqa - Initialize Django

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


class EventProcessor:
    def __init__(self):
        self.consumer = KafkaMessageConsumer(group_id="transaction-monitor-processors")
        self.transaction_handler = TransactionEventHandler()
        self.running = False

        signal.signal(signal.SIGINT, self.handle_shutdown)
        signal.signal(signal.SIGTERM, self.handle_shutdown)

    def handle_shutdown(self, signum, frame):
        logger.info(f"Received shutdown signal: {signum}")
        self.stop()
        sys.exit(0)

    def start(self):
        logger.info("Starting Event Processor...")

        self.consumer.subscribe(
            settings.KAFKA_TOPICS["TRANSACTION_CREATED"],
            self.transaction_handler.handle_transaction_created,
        )

        self.running = True
        logger.info("Event Processor is running. Press Ctrl+C to stop.")

        try:
            self.consumer.start()
        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received")
            self.stop()
        except Exception as e:
            logger.error(f"Fatal error: {str(e)}", exc_info=True)
            self.stop()

    def stop(self):
        logger.info("Stopping Event Processor...")
        self.running = False
        if self.consumer:
            self.consumer.stop()


if __name__ == "__main__":
    processor = EventProcessor()
    processor.start()
