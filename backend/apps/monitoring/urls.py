from django.urls import path
from .views import health_check, metrics

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('metrics/', metrics, name='metrics'),
]
