from datetime import timedelta

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Availability


class AvailabilityApiTests(TestCase):
    def setUp(self):
        self.doctor = get_user_model().objects.create_user(
            email='doctor@example.com',
            username='doctor@example.com',
            password='safe-password-123',
            role='doctor',
        )
        self.client = APIClient()
        self.client.force_authenticate(self.doctor)
        self.date = timezone.localdate()

    def test_overlapping_single_slot_returns_bad_request(self):
        Availability.objects.create(
            doctor=self.doctor,
            date=self.date,
            start_time='09:00',
            end_time='09:30',
        )

        response = self.client.post('/api/doctors/me/availability/', {
            'date': self.date.isoformat(),
            'start_time': '09:15',
            'end_time': '09:45',
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('non_field_errors', response.data)

    def test_expired_slot_is_removed_from_database_when_listing_public_slots(self):
        future_slot = Availability.objects.create(
            doctor=self.doctor,
            date=self.date + timedelta(days=1),
            start_time='09:00',
            end_time='09:30',
        )
        Availability.objects.filter(pk=future_slot.pk).update(date=self.date - timedelta(days=1))

        response = self.client.get('/api/doctors/availability/')

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Availability.objects.filter(pk=future_slot.pk).exists())
        self.assertNotIn('09:00', str(response.content))
