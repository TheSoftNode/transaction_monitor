from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Alert, AuditLog
from .serializers import (
    AlertSerializer,
    AlertListSerializer,
    AlertResolveSerializer,
    AuditLogSerializer,
)
from .filters import AlertFilter, AuditLogFilter


class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.select_related(
        "transaction", "transaction__customer"
    ).all()
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = AlertFilter
    search_fields = ["rule_name", "transaction__transaction_reference"]
    ordering_fields = ["triggered_at", "severity", "status"]
    ordering = ["-triggered_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return AlertListSerializer
        elif self.action == "resolve":
            return AlertResolveSerializer
        return AlertSerializer

    @action(detail=True, methods=["post"], url_path="resolve")
    def resolve(self, request, pk=None):
        alert = self.get_object()
        serializer = self.get_serializer(alert, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(resolved_by=request.user, resolved_at=timezone.now())
        return Response(AlertSerializer(alert).data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("transaction", "actor").all()
    serializer_class = AuditLogSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = AuditLogFilter
    search_fields = ["event_type", "transaction__transaction_reference"]
    ordering_fields = ["timestamp", "event_type"]
    ordering = ["-timestamp"]
