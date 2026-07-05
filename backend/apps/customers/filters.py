from django_filters import rest_framework as filters

from .models import Customer


class CustomerFilter(filters.FilterSet):
    country_code = filters.CharFilter(field_name="country_code", lookup_expr="iexact")
    risk_level = filters.ChoiceFilter(choices=Customer.RISK_LEVEL_CHOICES)
    is_blacklisted = filters.BooleanFilter()
    created_after = filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Customer
        fields = ["country_code", "risk_level", "is_blacklisted"]
