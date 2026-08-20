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
        self.doctor = user_model.objects.create_user(
            email='doctor@example.com', username='doctor@example.com',
            password='safe-password-123', role='doctor',
        )
        self.slot = Availability.objects.create(
            doctor=self.doctor,
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

    def test_doctor_can_update_appointment_to_checked_in_and_in_progress(self):
        appointment = Appointment.objects.create(
            patient=self.patient,
            availability=self.slot,
            reason='Routine consultation',
            status='confirmed',
        )
        self.client.force_authenticate(self.doctor)

        checked_in_response = self.client.post(
            f'/api/appointments/{appointment.id}/status/',
            {'status': 'checked_in'},
            format='json',
        )
        self.assertEqual(checked_in_response.status_code, 200)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'checked_in')

        in_progress_response = self.client.post(
            f'/api/appointments/{appointment.id}/status/',
            {'status': 'in_progress', 'notes': 'Patient arrived and consultation started.'},
            format='json',
        )
        self.assertEqual(in_progress_response.status_code, 200)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'in_progress')
        self.assertIn('consultation started', appointment.notes.lower())

    def test_doctor_can_create_prescription_for_appointment(self):
        appointment = Appointment.objects.create(
            patient=self.patient,
            availability=self.slot,
            reason='Routine consultation',
            status='confirmed',
        )
        self.client.force_authenticate(self.doctor)

        response = self.client.post(
            f'/api/appointments/{appointment.id}/prescription/',
            {
                'diagnosis': 'Seasonal flu',
                'notes': 'Encourage hydration and rest.',
                'medications': [
                    {
                        'name': 'Paracetamol',
                        'dosage': '500mg',
                        'frequency': 'Every 8 hours',
                        'duration': '3 days',
                        'instructions': 'Take after food.',
                    }
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['id'])

    def test_doctor_can_view_patient_history_for_a_patient(self):
        previous_slot = Availability.objects.create(
            doctor=self.doctor,
            date=timezone.localdate() + timedelta(days=3),
            start_time='10:00',
            end_time='10:30',
        )
        previous_appointment = Appointment.objects.create(
            patient=self.patient,
            availability=previous_slot,
            reason='Follow-up consultation',
            status='completed',
        )

        self.client.force_authenticate(self.doctor)

        current_appointment = Appointment.objects.create(
            patient=self.patient,
            availability=self.slot,
            reason='Routine consultation',
            status='confirmed',
        )

        response = self.client.get(f'/api/appointments/{current_appointment.id}/history/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['patient_name'], self.patient.get_full_name())
        self.assertEqual(len(response.data['history']), 1)
        self.assertEqual(response.data['history'][0]['appointment_id'], previous_appointment.id)
        self.assertEqual(response.data['history'][0]['reason'], 'Follow-up consultation')
