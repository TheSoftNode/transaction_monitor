from django.apps import AppConfig


class RulesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "rules"
    verbose_name = "Rule Engine"

    def ready(self):
        from . import plugins  # noqa - Load all rule plugins
