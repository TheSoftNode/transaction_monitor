from django_filters import rest_framework as filters

from .models import Transaction


class TransactionFilter(filters.FilterSet):
    customer = filters.UUIDFilter(field_name="customer__id")
    transaction_type = filters.ChoiceFilter(
        choices=Transaction.TRANSACTION_TYPE_CHOICES
    )
    status = filters.ChoiceFilter(choices=Transaction.STATUS_CHOICES)
    currency = filters.CharFilter(field_name="currency", lookup_expr="iexact")
    min_amount = filters.NumberFilter(field_name="amount", lookup_expr="gte")
    max_amount = filters.NumberFilter(field_name="amount", lookup_expr="lte")
    min_risk_score = filters.NumberFilter(field_name="risk_score", lookup_expr="gte")
    max_risk_score = filters.NumberFilter(field_name="risk_score", lookup_expr="lte")
    created_after = filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Transaction
        fields = ["customer", "transaction_type", "status", "currency"]
