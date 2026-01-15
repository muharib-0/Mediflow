"""
Models for doctor profiles and availability slots.
"""
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


class DoctorProfile(models.Model):
    """Extended profile for doctor users."""
    
    SPECIALIZATION_CHOICES = [
        ('general', 'General Physician'),
        ('cardiology', 'Cardiology'),
        ('dermatology', 'Dermatology'),
        ('neurology', 'Neurology'),
        ('orthopedics', 'Orthopedics'),
        ('pediatrics', 'Pediatrics'),
        ('psychiatry', 'Psychiatry'),
        ('gynecology', 'Gynecology'),
        ('ophthalmology', 'Ophthalmology'),
        ('ent', 'ENT (Ear, Nose, Throat)'),
        ('dentistry', 'Dentistry'),
        ('other', 'Other'),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doctor_profile'
    )
    specialization = models.CharField(
        max_length=50,
        choices=SPECIALIZATION_CHOICES,
        default='general'
    )
    qualification = models.CharField(max_length=200)
    experience_years = models.PositiveIntegerField(default=0)
    bio = models.TextField(blank=True)
    consultation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=500.00
    )
    is_available = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'doctor_profiles'
        verbose_name = 'Doctor Profile'
        verbose_name_plural = 'Doctor Profiles'
    
    def __str__(self):
        return f"Dr. {self.user.get_full_name()} - {self.get_specialization_display()}"
    
    @property
    def full_name(self):
        return f"Dr. {self.user.get_full_name()}"


class Availability(models.Model):
    """Time slots when doctors are available for appointments."""
    
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='availability_slots'
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_booked = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'availability_slots'
        verbose_name = 'Availability Slot'
        verbose_name_plural = 'Availability Slots'
        ordering = ['date', 'start_time']
        # Prevent duplicate slots for the same doctor
        unique_together = ['doctor', 'date', 'start_time', 'end_time']
    
    def __str__(self):
        return f"{self.doctor.get_full_name()} - {self.date} ({self.start_time} - {self.end_time})"
    
    def clean(self):
        """Validate the availability slot."""
        # End time must be after start time
        if self.start_time >= self.end_time:
            raise ValidationError('End time must be after start time.')
        
        # Date must be in the future (for new slots)
        if not self.pk:  # Only for new slots
            today = timezone.now().date()
            if self.date < today:
                raise ValidationError('Cannot create slots in the past.')
        
        # Check for overlapping slots (only if doctor is set)
        if self.doctor_id:  # Check if doctor is assigned
            overlapping = Availability.objects.filter(
                doctor=self.doctor_id,
                date=self.date,
            ).exclude(pk=self.pk).filter(
                models.Q(start_time__lt=self.end_time, end_time__gt=self.start_time)
            )
            
            if overlapping.exists():
                raise ValidationError('This slot overlaps with an existing slot.')
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def is_in_future(self):
        """Check if the slot is in the future."""
        now = timezone.now()
        slot_datetime = timezone.make_aware(
            timezone.datetime.combine(self.date, self.start_time)
        )
        return slot_datetime > now
    
    @property
    def is_available(self):
        """Check if the slot is available for booking."""
        return not self.is_booked and self.is_in_future
    
    @property
    def duration_minutes(self):
        """Get duration of the slot in minutes."""
        from datetime import datetime
        start = datetime.combine(self.date, self.start_time)
        end = datetime.combine(self.date, self.end_time)
        return int((end - start).total_seconds() / 60)
