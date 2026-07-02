import pytest
from django.urls import reverse
from rest_framework import status
from apps.customers.models import Customer


@pytest.mark.django_db
class TestCustomerAPI:
    """Test customer CRUD operations"""

    def test_create_customer(self, authenticated_client):
        """Test creating a new customer"""
        url = reverse('customers:customer-list')
        data = {
            'customer_reference': 'CUST002',
            'email': 'newcustomer@example.com',
            'first_name': 'Alice',
            'last_name': 'Johnson',
            'country_code': 'GBR',
            'risk_level': 'low'
        }
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['customer_reference'] == 'CUST002'
        assert Customer.objects.filter(customer_reference='CUST002').exists()

    def test_create_customer_duplicate_reference(self, authenticated_client, customer):
        """Test creating customer with duplicate reference"""
        url = reverse('customers:customer-list')
        data = {
            'customer_reference': customer.customer_reference,
            'email': 'different@example.com',
            'first_name': 'Bob',
            'last_name': 'Smith',
            'country_code': 'USA',
        }
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_customers(self, authenticated_client, customer):
        """Test listing customers"""
        url = reverse('customers:customer-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert len(response.data['results']) >= 1

    def test_retrieve_customer(self, authenticated_client, customer):
        """Test retrieving a specific customer"""
        url = reverse('customers:customer-detail', kwargs={'pk': customer.id})
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['customer_reference'] == customer.customer_reference

    def test_update_customer(self, authenticated_client, customer):
        """Test updating a customer"""
        url = reverse('customers:customer-detail', kwargs={'pk': customer.id})
        data = {
            'customer_reference': customer.customer_reference,
            'email': customer.email,
            'first_name': 'UpdatedName',
            'last_name': customer.last_name,
            'country_code': customer.country_code,
            'risk_level': 'medium'
        }
        response = authenticated_client.put(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'UpdatedName'
        assert response.data['risk_level'] == 'medium'

    def test_delete_customer(self, authenticated_client, customer):
        """Test deleting a customer"""
        url = reverse('customers:customer-detail', kwargs={'pk': customer.id})
        response = authenticated_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Customer.objects.filter(id=customer.id).exists()

    def test_filter_customers_by_risk_level(self, authenticated_client, customer, blacklisted_customer):
        """Test filtering customers by risk level"""
        url = reverse('customers:customer-list')
        response = authenticated_client.get(url, {'risk_level': 'high'})

        assert response.status_code == status.HTTP_200_OK
        assert all(c['risk_level'] == 'high' for c in response.data['results'])

    def test_search_customers(self, authenticated_client, customer):
        """Test searching customers"""
        url = reverse('customers:customer-list')
        response = authenticated_client.get(url, {'search': customer.email})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert any(c['email'] == customer.email for c in response.data['results'])
