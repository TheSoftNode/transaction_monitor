import logging

from django.core.management.base import BaseCommand
from django.utils import timezone

from infrastructure.messaging.kafka import KafkaMessagePublisher
from infrastructure.messaging.models import OutboxEvent

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Retry delivery of outbox events that were durably persisted but never "
        "made it to Kafka (e.g. because the broker was unreachable at request "
        "time). Safe to run repeatedly, e.g. from cron or a systemd timer."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--max-attempts",
            type=int,
            default=5,
            help="Stop retrying (mark 'failed') after this many attempts",
        )

    def handle(self, *args, **options):
        max_attempts = options["max_attempts"]
        pending = OutboxEvent.objects.filter(status="pending").order_by("created_at")

        total = pending.count()
        if total == 0:
            self.stdout.write("No pending outbox events.")
            return

        self.stdout.write(f"Found {total} pending outbox event(s). Retrying...")

        publisher = KafkaMessagePublisher()
        published_count = 0
        failed_count = 0

        try:
            for event in pending:
                try:
                    ok = publisher.publish(event.topic, event.payload)
                except Exception as e:
                    ok = False
                    event.last_error = str(e)
                    logger.error(
                        f"Error replaying outbox event {event.id}: {str(e)}",
                        exc_info=True,
                    )

                if ok:
                    event.status = "published"
                    event.published_at = timezone.now()
                    event.save(update_fields=["status", "published_at", "last_error"])
                    published_count += 1
                else:
                    event.attempts += 1
                    if event.attempts >= max_attempts:
                        event.status = "failed"
                    event.save(update_fields=["attempts", "status", "last_error"])
                    failed_count += 1
        finally:
            publisher.close()

        self.stdout.write(
            self.style.SUCCESS(
                f"Replay complete: {published_count} published, {failed_count} still pending/failed"
            )
        )
