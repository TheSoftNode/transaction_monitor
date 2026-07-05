from rest_framework import serializers

from apps.transactions.serializers import TransactionListSerializer

from .models import Alert, AuditLog


class AlertSerializer(serializers.ModelSerializer):
    transaction_details = TransactionListSerializer(
        source="transaction", read_only=True
    )
    resolved_by_username = serializers.CharField(
        source="resolved_by.username", read_only=True
    )

    class Meta:
        model = Alert
        fields = [
            "id",
            "transaction",
            "transaction_details",
            "rule_name",
            "severity",
            "message",
            "status",
            "resolved_by",
            "resolved_by_username",
            "triggered_at",
            "resolved_at",
        ]
        read_only_fields = ["id", "triggered_at"]


class AlertListSerializer(serializers.ModelSerializer):
    transaction_reference = serializers.CharField(
        source="transaction.transaction_reference", read_only=True
    )

    class Meta:
        model = Alert
        fields = [
            "id",
            "transaction",
            "transaction_reference",
            "rule_name",
            "severity",
            "status",
            "triggered_at",
        ]
        read_only_fields = ["id", "triggered_at"]


class AlertResolveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ["status"]

    def validate_status(self, value):
        if value not in ["resolved", "false_positive"]:
            raise serializers.ValidationError(
                "Status must be 'resolved' or 'false_positive'."
            )
        return value


class AuditLogSerializer(serializers.ModelSerializer):
    transaction_reference = serializers.CharField(
        source="transaction.transaction_reference", read_only=True
    )
    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "transaction",
            "transaction_reference",
            "event_type",
            "actor",
            "actor_username",
            "details",
            "ip_address",
            "user_agent",
            "timestamp",
        ]
        read_only_fields = ["id", "timestamp"]
