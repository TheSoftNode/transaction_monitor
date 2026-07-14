import uuid

from django.db import models


class OutboxEvent(models.Model):
    """A durably-persisted event awaiting delivery to Kafka.

    Written in the same DB transaction as the business row it describes
    (transactional outbox pattern), so a Kafka outage delays delivery
    instead of silently losing the event. A relay (best-effort publish on
    write, plus the `replay_outbox_events` management command) moves rows
    from pending -> published.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("published", "Published"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.CharField(max_length=255, db_index=True)
    payload = models.JSONField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending", db_index=True
    )
    attempts = models.IntegerField(default=0)
    last_error = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "event_outbox"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"{self.topic} - {self.status} - {self.id}"
