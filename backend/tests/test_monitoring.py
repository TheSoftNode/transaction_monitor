import pytest
import json
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch
from django.core.cache import cache


@pytest.mark.django_db
class TestMonitoring:
    """Test monitoring endpoints"""

    def test_health_check_healthy(self, api_client):
        """Test health check when all services are healthy"""
        url = reverse("health_check")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = json.loads(response.content)
        assert data["status"] == "healthy"
        assert "checks" in data
        assert data["checks"]["database"] == "healthy"
        assert data["checks"]["cache"] == "healthy"

    @patch("django.db.connection.cursor")
    def test_health_check_database_unhealthy(self, mock_cursor, api_client):
        """Test health check when database is unhealthy"""
        mock_cursor.side_effect = Exception("Database connection failed")

        url = reverse("health_check")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        data = json.loads(response.content)
        assert data["status"] == "unhealthy"
        assert "Database connection failed" in data["checks"]["database"]

    @patch("django.core.cache.cache.set")
    def test_health_check_cache_unhealthy(self, mock_cache_set, api_client):
        """Test health check when cache is unhealthy"""
        mock_cache_set.side_effect = Exception("Cache connection failed")

        url = reverse("health_check")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        data = json.loads(response.content)
        assert data["status"] == "unhealthy"

    def test_metrics_endpoint(self, api_client):
        """Test Prometheus metrics endpoint"""
        url = reverse("metrics")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "text/plain" in response["Content-Type"]
        # Check for some standard Prometheus metrics or just that response has content
        assert len(response.content) > 0
