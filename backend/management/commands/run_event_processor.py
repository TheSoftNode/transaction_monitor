from django.core.management.base import BaseCommand
from event_processor.main import EventProcessor


class Command(BaseCommand):
    help = 'Run the Kafka event processor'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting Event Processor...'))
        processor = EventProcessor()
        processor.start()
