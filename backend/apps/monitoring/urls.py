from django.urls import path, re_path
from .views import health_check, metrics

urlpatterns = [
    re_path(r'^health/?$', health_check, name='health_check'),
    re_path(r'^metrics/?$', metrics, name='metrics'),
]
