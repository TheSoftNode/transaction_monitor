import logging

from django.core.cache import cache
from django.db import connection
from django.http import HttpResponse, JsonResponse
from prometheus_client import Histogram, generate_latest
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)

api_request_duration = Histogram("api_request_duration_seconds", "API request duration")


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint to verify service status
    """
    health_status = {"status": "healthy", "checks": {}}

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        logger.error(f"Database health check failed: {str(e)}")

    try:
        cache.set("health_check", "ok", 10)
        if cache.get("health_check") == "ok":
            health_status["checks"]["cache"] = "healthy"
        else:
            health_status["checks"]["cache"] = "unhealthy"
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["cache"] = f"unhealthy: {str(e)}"
        logger.error(f"Cache health check failed: {str(e)}")

    status_code = 200 if health_status["status"] == "healthy" else 503
    return JsonResponse(health_status, status=status_code)


@api_view(["GET"])
@permission_classes([AllowAny])
def metrics(request):
    """
    Prometheus metrics endpoint
    """
    metrics_output = generate_latest()
    return HttpResponse(metrics_output, content_type="text/plain")
