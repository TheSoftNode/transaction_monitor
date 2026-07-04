from .base import *

DEBUG = True

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS += [
    "django_extensions",
]

CORS_ALLOW_ALL_ORIGINS = True

LOGGING["root"]["level"] = "DEBUG"
LOGGING["loggers"]["django"]["level"] = "DEBUG"
LOGGING["loggers"]["apps"]["level"] = "DEBUG"
LOGGING["loggers"]["rules"]["level"] = "DEBUG"

RATE_LIMIT_ENABLE = False

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
