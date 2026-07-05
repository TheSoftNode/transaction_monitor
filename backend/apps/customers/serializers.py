from rest_framework import serializers

from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "customer_reference",
            "full_name",
            "email",
            "phone",
            "country_code",
            "risk_level",
            "is_blacklisted",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_customer_reference(self, value):
        if self.instance is None:
            if Customer.objects.filter(customer_reference=value).exists():
                raise serializers.ValidationError("Customer reference already exists.")
        return value

    def validate_email(self, value):
        if self.instance is None:
            if Customer.objects.filter(email=value).exists():
                raise serializers.ValidationError("Email already exists.")
        return value


class CustomerListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "customer_reference",
            "full_name",
            "email",
            "country_code",
            "risk_level",
            "is_blacklisted",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
