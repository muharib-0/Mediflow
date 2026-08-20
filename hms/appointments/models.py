"""
Models for appointment booking.
"""
from django.db import models
from django.conf import settings


class Appointment(models.Model):
    """Appointment model linking patients to doctor availability slots."""
    
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('no_show', 'No Show'),
        ('cancelled', 'Cancelled'),
    ]
    
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    availability = models.OneToOneField(
        'doctors.Availability',
        on_delete=models.CASCADE,
        related_name='appointment'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='confirmed'
    )
    reason = models.TextField(blank=True, help_text='Reason for appointment')
    notes = models.TextField(blank=True, help_text='Additional notes')
    
    # Google Calendar event IDs
    google_event_id_doctor = models.CharField(max_length=255, blank=True)
    google_event_id_patient = models.CharField(max_length=255, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'appointments'
        verbose_name = 'Appointment'
        verbose_name_plural = 'Appointments'
        ordering = ['-created_at']
    
    def __str__(self):
        doctor = self.availability.doctor
        return f"Appointment: {self.patient.get_full_name()} with Dr. {doctor.get_full_name()} on {self.availability.date}"
    
    @property
    def doctor(self):
        return self.availability.doctor
    
    @property
    def date(self):
        return self.availability.date
    
    @property
    def start_time(self):
        return self.availability.start_time
    
    @property
    def end_time(self):
        return self.availability.end_time
    
    def cancel(self):
        """Cancel the appointment and free up the slot."""
        from django.utils import timezone
        self.status = 'cancelled'
        self.cancelled_at = timezone.now()
        self.save()
        
        # Free up the availability slot
        self.availability.is_booked = False
        self.availability.save()


class AppointmentPrescription(models.Model):
    """Prescription created for a completed or in-progress consultation."""

    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name='prescription',
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='issued_prescriptions',
    )
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prescriptions',
    )
    diagnosis = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    medications = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointment_prescriptions'
        ordering = ['-created_at']

    def __str__(self):
        return f"Prescription for {self.patient.get_full_name()} on {self.appointment.date}"
