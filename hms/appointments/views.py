"""
Views for appointment booking with race condition handling.
"""
import requests
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import transaction
from django.db.models import F
from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings

from .models import Appointment
from doctors.models import Availability, DoctorProfile
from patients.views import patient_required


@patient_required
def book_appointment(request, slot_id):
    """Book an appointment with race condition handling."""
    slot = get_object_or_404(
        Availability.objects.select_related('doctor', 'doctor__doctor_profile'),
        id=slot_id
    )
    
    # Check if slot is in the future
    if not slot.is_in_future:
        messages.error(request, 'This slot is no longer available.')
        return redirect('patients:browse_doctors')
    
    if request.method == 'POST':
        reason = request.POST.get('reason', '')
        
        # Use atomic transaction with select_for_update to prevent race conditions
        try:
            with transaction.atomic():
                # Lock the row and refresh from database
                locked_slot = Availability.objects.select_for_update().get(id=slot_id)
                
                if locked_slot.is_booked:
                    messages.error(request, 'Sorry, this slot was just booked by another patient. Please choose a different slot.')
                    return redirect('patients:doctor_detail', doctor_id=slot.doctor.doctor_profile.id)
                
                # Mark slot as booked
                locked_slot.is_booked = True
                locked_slot.save()
                
                # Create appointment
                appointment = Appointment.objects.create(
                    patient=request.user,
                    availability=locked_slot,
                    reason=reason,
                    status='confirmed'
                )
                
                # Try to create Google Calendar events
                try:
                    from calendar_integration.services import GoogleCalendarService
                    calendar_service = GoogleCalendarService()
                    
                    # Create event for doctor
                    if slot.doctor.has_google_calendar_connected:
                        doctor_event = calendar_service.create_appointment_event(
                            appointment,
                            for_doctor=True
                        )
                        if doctor_event:
                            appointment.google_event_id_doctor = doctor_event.get('id', '')
                    
                    # Create event for patient
                    if request.user.has_google_calendar_connected:
                        patient_event = calendar_service.create_appointment_event(
                            appointment,
                            for_doctor=False
                        )
                        if patient_event:
                            appointment.google_event_id_patient = patient_event.get('id', '')
                    
                    appointment.save()
                except Exception as e:
                    print(f"Google Calendar integration error: {e}")
                
                # Send confirmation email via serverless function
                try:
                    _send_booking_confirmation_email(appointment)
                except Exception as e:
                    print(f"Email notification error: {e}")
                
                messages.success(
                    request,
                    f'Appointment booked successfully with Dr. {slot.doctor.get_full_name()} on {slot.date} at {slot.start_time.strftime("%I:%M %p")}!'
                )
                return redirect('patients:my_appointments')
        
        except Exception as e:
            messages.error(request, f'An error occurred while booking: {str(e)}')
            return redirect('patients:doctor_detail', doctor_id=slot.doctor.doctor_profile.id)
    
    context = {
        'slot': slot,
        'doctor': slot.doctor.doctor_profile,
    }
    
    return render(request, 'appointments/book_appointment.html', context)


def _send_booking_confirmation_email(appointment):
    """Send booking confirmation email via serverless function."""
    try:
        payload = {
            'action': 'BOOKING_CONFIRMATION',
            'patient_email': appointment.patient.email,
            'patient_name': appointment.patient.get_full_name(),
            'doctor_email': appointment.doctor.email,
            'doctor_name': f"Dr. {appointment.doctor.get_full_name()}",
            'appointment_date': appointment.date.strftime('%A, %B %d, %Y'),
            'appointment_time': f"{appointment.start_time.strftime('%I:%M %p')} - {appointment.end_time.strftime('%I:%M %p')}",
            'reason': appointment.reason or 'General Consultation'
        }
        
        response = requests.post(
            settings.EMAIL_SERVICE_URL,
            json=payload,
            timeout=5
        )
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"Email service error: {e}")
        return False


@patient_required
def cancel_appointment(request, appointment_id):
    """Cancel an appointment."""
    appointment = get_object_or_404(
        Appointment.objects.select_related('availability', 'availability__doctor'),
        id=appointment_id,
        patient=request.user
    )
    
    # Check if appointment is in the future
    if not appointment.availability.is_in_future:
        messages.error(request, 'Cannot cancel a past appointment.')
        return redirect('patients:my_appointments')
    
    if appointment.status == 'cancelled':
        messages.warning(request, 'This appointment is already cancelled.')
        return redirect('patients:my_appointments')
    
    if request.method == 'POST':
        # Cancel the appointment
        appointment.cancel()
        
        # TODO: Delete Google Calendar events
        # TODO: Send cancellation email
        
        messages.success(request, 'Appointment cancelled successfully. The slot is now available for others.')
        return redirect('patients:my_appointments')
    
    return render(request, 'appointments/cancel_appointment.html', {'appointment': appointment})


@login_required
def appointment_detail(request, appointment_id):
    """View appointment details."""
    if request.user.is_doctor:
        appointment = get_object_or_404(
            Appointment.objects.select_related('patient', 'availability'),
            id=appointment_id,
            availability__doctor=request.user
        )
    else:
        appointment = get_object_or_404(
            Appointment.objects.select_related('availability', 'availability__doctor'),
            id=appointment_id,
            patient=request.user
        )
    
    return render(request, 'appointments/appointment_detail.html', {'appointment': appointment})
