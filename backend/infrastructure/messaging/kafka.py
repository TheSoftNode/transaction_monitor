import json
import logging
from typing import Dict, Any, Callable
from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError
from django.conf import settings
from .base import BaseMessagePublisher, BaseMessageConsumer

logger = logging.getLogger(__name__)


class KafkaMessagePublisher(BaseMessagePublisher):
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            acks="all",
            retries=3,
            max_in_flight_requests_per_connection=1,
        )

    def publish(self, topic: str, message: Dict[str, Any]) -> bool:
        try:
            future = self.producer.send(topic, value=message)
            record_metadata = future.get(timeout=10)
            logger.info(
                f"Message published to {topic}: "
                f"partition={record_metadata.partition}, offset={record_metadata.offset}"
            )
            return True
        except KafkaError as e:
            logger.error(f"Failed to publish message to {topic}: {str(e)}")
            return False

    def close(self):
        if self.producer:
            self.producer.flush()
            self.producer.close()


class KafkaMessageConsumer(BaseMessageConsumer):
    def __init__(self, group_id: str):
        self.group_id = group_id
        self.consumer = None
        self.running = False
        self.callbacks = {}

    def subscribe(self, topic: str, callback: Callable[[Dict[str, Any]], None]):
        self.callbacks[topic] = callback
        if not self.consumer:
            self.consumer = KafkaConsumer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                group_id=self.group_id,
                value_deserializer=lambda m: json.loads(m.decode("utf-8")),
                auto_offset_reset="earliest",
                enable_auto_commit=True,
                auto_commit_interval_ms=1000,
            )
        self.consumer.subscribe(list(self.callbacks.keys()))

    def start(self):
        if not self.consumer:
            logger.error("No consumer initialized. Subscribe to topics first.")
            return

        self.running = True
        logger.info(f"Starting Kafka consumer for group: {self.group_id}")

        try:
            for message in self.consumer:
                if not self.running:
                    break

                topic = message.topic
                value = message.value

                logger.info(
                    f"Received message from {topic}: "
                    f"partition={message.partition}, offset={message.offset}"
                )

                if topic in self.callbacks:
                    try:
                        self.callbacks[topic](value)
                    except Exception as e:
                        logger.error(
                            f"Error processing message from {topic}: {str(e)}",
                            exc_info=True,
                        )
        except Exception as e:
            logger.error(f"Consumer error: {str(e)}", exc_info=True)
        finally:
            self.close()

    def stop(self):
        self.running = False
        logger.info("Stopping Kafka consumer")

    def close(self):
        if self.consumer:
            self.consumer.close()
            logger.info("Kafka consumer closed")
