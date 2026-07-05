import uuid

from apps.transactions.models import Transaction
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Alert(models.Model):
    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    STATUS_CHOICES = [
        ("open", "Open"),
        ("investigating", "Investigating"),
        ("resolved", "Resolved"),
        ("false_positive", "False Positive"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(
        Transaction, on_delete=models.CASCADE, related_name="alerts", db_index=True
    )
    rule_name = models.CharField(max_length=255, db_index=True)
    severity = models.CharField(
        max_length=20, choices=SEVERITY_CHOICES, default="low", db_index=True
    )
    message = models.TextField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="open", db_index=True
    )
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_alerts",
    )
    triggered_at = models.DateTimeField(auto_now_add=True, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "alerts"
        ordering = ["-triggered_at"]
        indexes = [
            models.Index(fields=["transaction", "triggered_at"]),
            models.Index(fields=["severity", "status"]),
            models.Index(fields=["rule_name", "triggered_at"]),
            models.Index(fields=["-triggered_at", "status"]),
        ]

    def __str__(self):
        return f"{self.rule_name} - {self.transaction.transaction_reference} - {self.severity}"


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(
        Transaction, on_delete=models.CASCADE, related_name="audit_logs", db_index=True
    )
    event_type = models.CharField(max_length=100, db_index=True)
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["transaction", "timestamp"]),
            models.Index(fields=["event_type", "timestamp"]),
            models.Index(fields=["actor", "timestamp"]),
        ]

    def __str__(self):
        return f"{self.event_type} - {self.transaction.transaction_reference} - {self.timestamp}"
