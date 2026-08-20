"""
Models for patient profiles.
"""
from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from accounts.models import User


class PatientProfile(models.Model):
    BLOOD_TYPE_CHOICES = (
        ('A+', 'A+'), ('A-', 'A-'), 
        ('B+', 'B+'), ('B-', 'B-'), 
        ('AB+', 'AB+'), ('AB-', 'AB-'), 
        ('O+', 'O+'), ('O-', 'O-'),
        ('Unknown', 'Unknown')
    )
    
    # Links directly to the auth user
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_profile')
    
    date_of_birth = models.DateField(null=True, blank=True)
    blood_type = models.CharField(max_length=10, choices=BLOOD_TYPE_CHOICES, default='Unknown')
    
    # Postgres-specific: Great for simple lists like ["Peanuts", "Penicillin"]
    allergies = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    chronic_conditions = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    
    family_history = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Profile: {self.user.username}"

class HealthMetric(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='health_metrics')
    date = models.DateField(auto_now_add=True)
    weight_lbs = models.DecimalField(max_digits=5, decimal_places=2)
    bmi = models.DecimalField(max_digits=4, decimal_places=1)

    class Meta:
        ordering = ['-date'] # Returns newest records first

    def __str__(self):
        return f"{self.patient.user.last_name} - {self.date}"

class Medication(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('discontinued', 'Discontinued'),
    )
    
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='medications')
    # Links a prescription back to the visit it came from. Nullable so
    # existing rows (created before this field existed, or any future
    # historical/manual entries) don't break — but new prescriptions from
    # doctors always set this.
    appointment = models.ForeignKey(
        'appointments.Appointment', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='prescriptions',
    )
    name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=50) # e.g., "500mg"
    frequency = models.CharField(max_length=100) # e.g., "Twice daily with meals"
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    prescribed_by = models.CharField(max_length=100) # Doctor's display name, set automatically from the appointment
    date_prescribed = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.patient.user.username}"