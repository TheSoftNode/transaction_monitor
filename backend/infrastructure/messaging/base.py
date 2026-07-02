from abc import ABC, abstractmethod
from typing import Dict, Any, Callable, Optional


class BaseMessagePublisher(ABC):
    @abstractmethod
    def publish(self, topic: str, message: Dict[str, Any]) -> bool:
        """Publish a message to a topic"""
        pass

    @abstractmethod
    def close(self):
        """Close the publisher connection"""
        pass


class BaseMessageConsumer(ABC):
    @abstractmethod
    def subscribe(self, topic: str, callback: Callable[[Dict[str, Any]], None]):
        """Subscribe to a topic and process messages with callback"""
        pass

    @abstractmethod
    def start(self):
        """Start consuming messages"""
        pass

    @abstractmethod
    def stop(self):
        """Stop consuming messages"""
        pass

    @abstractmethod
    def close(self):
        """Close the consumer connection"""
        pass
