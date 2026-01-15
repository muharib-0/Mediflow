"""
Custom User model for HMS with role-based authentication.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model with role-based authentication."""
    
    class Role(models.TextChoices):
        DOCTOR = 'doctor', 'Doctor'
        PATIENT = 'patient', 'Patient'
        ADMIN = 'admin', 'Admin'
    
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=10, 
        choices=Role.choices, 
        default=Role.PATIENT
    )
    phone_number = models.CharField(max_length=15, blank=True)
    
    # Google Calendar OAuth tokens
    google_access_token = models.TextField(blank=True, null=True)
    google_refresh_token = models.TextField(blank=True, null=True)
    google_token_expiry = models.DateTimeField(blank=True, null=True)
    
    # Profile picture
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.get_full_name() or self.email} ({self.role})"
    
    @property
    def is_doctor(self):
        return self.role == self.Role.DOCTOR
    
    @property
    def is_patient(self):
        return self.role == self.Role.PATIENT
    
    @property
    def has_google_calendar_connected(self):
        return bool(self.google_refresh_token)
