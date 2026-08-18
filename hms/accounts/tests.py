from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class LoginPayloadTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            email='patient@example.com',
            username='patient1',
            password='StrongPass123!',
            role='patient',
            first_name='Patient',
            last_name='Example',
        )

    def test_login_returns_user_payload_for_frontend(self):
        response = self.client.post(
            '/api/accounts/login/',
            {'email': 'patient@example.com', 'password': 'StrongPass123!'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('user', response.json())
        self.assertEqual(response.json()['user']['email'], self.user.email)
        self.assertEqual(response.json()['user']['role'], self.user.role)
