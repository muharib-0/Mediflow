"""
Shared helpers used by the appointments API (and previously by the
now-removed template views). Kept separate from api_views.py so it has
no dependency on DRF and can't accidentally get deleted along with the
old view files during the templates -> React cleanup.
"""
import requests
from django.conf import settings


def send_booking_confirmation_email(appointment):
    """Send booking confirmation email via the serverless email function."""
    try:
        payload = {
            'action': 'BOOKING_CONFIRMATION',
            'patient_email': appointment.patient.email,
            'patient_name': appointment.patient.get_full_name(),
            'doctor_email': appointment.doctor.email,
            'doctor_name': f"Dr. {appointment.doctor.get_full_name()}",
            'appointment_date': appointment.date.strftime('%A, %B %d, %Y'),
            'appointment_time': f"{appointment.start_time.strftime('%I:%M %p')} - {appointment.end_time.strftime('%I:%M %p')}",
            'reason': appointment.reason or 'General Consultation',
        }
        response = requests.post(settings.EMAIL_SERVICE_URL, json=payload, timeout=5)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"Email service error: {e}")
        return False