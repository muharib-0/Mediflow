from django.test import TestCase
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from doctors.models import Availability
from .models import Appointment


class BookingApiTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.patient = user_model.objects.create_user(
            email='patient@example.com', username='patient@example.com',
            password='safe-password-123', role='patient',
        )
        doctor = user_model.objects.create_user(
            email='doctor@example.com', username='doctor@example.com',
            password='safe-password-123', role='doctor',
        )
        self.slot = Availability.objects.create(
            doctor=doctor,
            date=timezone.localdate() + timedelta(days=1),
            start_time='09:00',
            end_time='09:30',
        )
        self.client = APIClient()
        self.client.force_authenticate(self.patient)

    def test_patient_can_book_an_open_slot(self):
        response = self.client.post(
            f'/api/appointments/book/{self.slot.id}/',
            {'reason': 'Routine consultation'}, format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Appointment.objects.filter(patient=self.patient, availability=self.slot).exists())
        self.slot.refresh_from_db()
        self.assertTrue(self.slot.is_booked)
