from django.db import models


class RuleConfiguration(models.Model):
    rule_name = models.CharField(max_length=255, unique=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    priority = models.IntegerField(default=0, db_index=True)
    parameters = models.JSONField(default=dict)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rule_configurations'
        ordering = ['-priority', 'rule_name']
        indexes = [
            models.Index(fields=['is_active', 'priority']),
        ]

    def __str__(self):
        return f"{self.rule_name} (Active: {self.is_active})"
