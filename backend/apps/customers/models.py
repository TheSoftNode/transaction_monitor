import uuid
from django.db import models


class Customer(models.Model):
    RISK_LEVEL_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer_reference = models.CharField(max_length=100, unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    country_code = models.CharField(max_length=3, db_index=True)
    risk_level = models.CharField(max_length=10, choices=RISK_LEVEL_CHOICES, default='low', db_index=True)
    is_blacklisted = models.BooleanField(default=False, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer_reference', 'email']),
            models.Index(fields=['country_code', 'risk_level']),
            models.Index(fields=['is_blacklisted', 'created_at']),
        ]

    def __str__(self):
        return f"{self.customer_reference} - {self.full_name}"
