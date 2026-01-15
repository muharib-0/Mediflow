"""
Forms for patient profile management.
"""
from django import forms
from .models import PatientProfile


class PatientProfileForm(forms.ModelForm):
    """Form for creating/updating patient profile."""
    
    class Meta:
        model = PatientProfile
        fields = [
            'date_of_birth', 'blood_group', 'address',
            'emergency_contact', 'emergency_contact_name',
            'medical_history', 'allergies'
        ]
        widgets = {
            'date_of_birth': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date',
            }),
            'blood_group': forms.Select(attrs={'class': 'form-select'}),
            'address': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Your address'
            }),
            'emergency_contact': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Emergency contact number'
            }),
            'emergency_contact_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Emergency contact name'
            }),
            'medical_history': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Any relevant medical history...'
            }),
            'allergies': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': 'List any allergies...'
            }),
        }
