"""
Forms for doctor profile and availability management.
"""
from django import forms
from django.utils import timezone
from .models import DoctorProfile, Availability


class DoctorProfileForm(forms.ModelForm):
    """Form for creating/updating doctor profile."""
    
    class Meta:
        model = DoctorProfile
        fields = ['specialization', 'qualification', 'experience_years', 'bio', 'consultation_fee', 'is_available']
        widgets = {
            'specialization': forms.Select(attrs={'class': 'form-select'}),
            'qualification': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'e.g., MBBS, MD, MS'
            }),
            'experience_years': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '0',
                'placeholder': 'Years of experience'
            }),
            'bio': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Tell patients about yourself...'
            }),
            'consultation_fee': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '0',
                'step': '50',
                'placeholder': 'Consultation fee (₹)'
            }),
            'is_available': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }


class AvailabilityForm(forms.ModelForm):
    """Form for creating availability slots."""
    
    class Meta:
        model = Availability
        fields = ['date', 'start_time', 'end_time']
        widgets = {
            'date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date',
            }),
            'start_time': forms.TimeInput(attrs={
                'class': 'form-control',
                'type': 'time',
            }),
            'end_time': forms.TimeInput(attrs={
                'class': 'form-control',
                'type': 'time',
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set minimum date to today
        self.fields['date'].widget.attrs['min'] = timezone.now().date().isoformat()
    
    def clean(self):
        cleaned_data = super().clean()
        date = cleaned_data.get('date')
        start_time = cleaned_data.get('start_time')
        end_time = cleaned_data.get('end_time')
        
        if date and date < timezone.now().date():
            raise forms.ValidationError('Cannot create slots in the past.')
        
        if start_time and end_time and start_time >= end_time:
            raise forms.ValidationError('End time must be after start time.')
        
        return cleaned_data


class BulkAvailabilityForm(forms.Form):
    """Form for creating multiple availability slots at once."""
    
    date = forms.DateField(
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date',
        })
    )
    start_time = forms.TimeField(
        widget=forms.TimeInput(attrs={
            'class': 'form-control',
            'type': 'time',
        })
    )
    end_time = forms.TimeField(
        widget=forms.TimeInput(attrs={
            'class': 'form-control',
            'type': 'time',
        })
    )
    slot_duration = forms.ChoiceField(
        choices=[
            (15, '15 minutes'),
            (30, '30 minutes'),
            (45, '45 minutes'),
            (60, '1 hour'),
        ],
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    
    def clean(self):
        cleaned_data = super().clean()
        date = cleaned_data.get('date')
        start_time = cleaned_data.get('start_time')
        end_time = cleaned_data.get('end_time')
        
        if date and date < timezone.now().date():
            raise forms.ValidationError('Cannot create slots in the past.')
        
        if start_time and end_time and start_time >= end_time:
            raise forms.ValidationError('End time must be after start time.')
        
        return cleaned_data
