"""
Models for patient profiles.
"""
from django.db import models
from django.conf import settings


class PatientProfile(models.Model):
    """Extended profile for patient users."""
    
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='patient_profile'
    )
    date_of_birth = models.DateField(blank=True, null=True)
    blood_group = models.CharField(
        max_length=5,
        choices=BLOOD_GROUP_CHOICES,
        blank=True
    )
    address = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=15, blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    medical_history = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    
    class Meta:
        db_table = 'patient_profiles'
        verbose_name = 'Patient Profile'
        verbose_name_plural = 'Patient Profiles'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - Patient"
    
    @property
    def age(self):
        """Calculate patient's age."""
        if self.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None
