from django_filters import rest_framework as filters
from .models import Alert, AuditLog


class AlertFilter(filters.FilterSet):
    severity = filters.ChoiceFilter(choices=Alert.SEVERITY_CHOICES)
    status = filters.ChoiceFilter(choices=Alert.STATUS_CHOICES)
    rule_name = filters.CharFilter(field_name='rule_name', lookup_expr='icontains')
    transaction = filters.UUIDFilter(field_name='transaction__id')
    triggered_after = filters.DateTimeFilter(field_name='triggered_at', lookup_expr='gte')
    triggered_before = filters.DateTimeFilter(field_name='triggered_at', lookup_expr='lte')

    class Meta:
        model = Alert
        fields = ['severity', 'status', 'rule_name', 'transaction']


class AuditLogFilter(filters.FilterSet):
    event_type = filters.CharFilter(field_name='event_type', lookup_expr='icontains')
    transaction = filters.UUIDFilter(field_name='transaction__id')
    actor = filters.NumberFilter(field_name='actor__id')
    timestamp_after = filters.DateTimeFilter(field_name='timestamp', lookup_expr='gte')
    timestamp_before = filters.DateTimeFilter(field_name='timestamp', lookup_expr='lte')

    class Meta:
        model = AuditLog
        fields = ['event_type', 'transaction', 'actor']
