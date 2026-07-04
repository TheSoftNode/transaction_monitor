import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestAuthentication:
    """Test authentication endpoints"""

    def test_user_registration(self, api_client):
        """Test user registration"""
        url = reverse("authentication:register")
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "password2": "SecurePass123!",
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert "access" in response.data
        assert "refresh" in response.data
        assert User.objects.filter(username="newuser").exists()

    def test_user_registration_password_mismatch(self, api_client):
        """Test registration with mismatched passwords"""
        url = reverse("authentication:register")
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "password2": "DifferentPass123!",
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_user_login(self, api_client, user):
        """Test user login"""
        url = reverse("authentication:login")
        data = {"username": "testuser", "password": "testpass123"}
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_user_login_invalid_credentials(self, api_client, user):
        """Test login with invalid credentials"""
        url = reverse("authentication:login")
        data = {"username": "testuser", "password": "wrongpassword"}
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_token_refresh(self, api_client, user):
        """Test JWT token refresh"""
        # First login to get tokens
        login_url = reverse("authentication:login")
        login_data = {"username": "testuser", "password": "testpass123"}
        login_response = api_client.post(login_url, login_data)
        refresh_token = login_response.data["refresh"]

        # Now refresh the token
        refresh_url = reverse("authentication:token_refresh")
        refresh_data = {"refresh": refresh_token}
        response = api_client.post(refresh_url, refresh_data)

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data

    def test_protected_endpoint_without_auth(self, api_client):
        """Test accessing protected endpoint without authentication"""
        url = reverse("customers:customer-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_protected_endpoint_with_auth(self, authenticated_client):
        """Test accessing protected endpoint with authentication"""
        url = reverse("customers:customer-list")
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
