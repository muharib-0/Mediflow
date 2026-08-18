from datetime import date

from rest_framework import serializers

from .models import Appointment
from patients.models import PatientProfile


class AppointmentSerializer(serializers.ModelSerializer):
    """Read serializer — used for both the patient's and doctor's appointment lists."""

    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    date = serializers.DateField(read_only=True)
    start_time = serializers.TimeField(read_only=True)
    end_time = serializers.TimeField(read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'status', 'reason', 'notes',
            'doctor_name', 'patient_name', 'date', 'start_time', 'end_time',
            'created_at', 'cancelled_at',
        ]
        read_only_fields = fields

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.get_full_name()}"


class BookAppointmentSerializer(serializers.Serializer):
    """Input for POST /api/appointments/book/<slot_id>/ — the slot itself
    comes from the URL, this just carries the patient-supplied reason."""

    reason = serializers.CharField(required=False, allow_blank=True, default='')


class DoctorPatientDetailSerializer(serializers.Serializer):
    """Medical-profile data a doctor may view for an appointment they own."""

    appointment_id = serializers.IntegerField(source='id', read_only=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    email = serializers.EmailField(source='patient.email', read_only=True)
    phone_number = serializers.CharField(source='patient.phone_number', read_only=True)
    age = serializers.SerializerMethodField()
    blood_type = serializers.SerializerMethodField()
    allergies = serializers.SerializerMethodField()
    family_history = serializers.SerializerMethodField()
    chronic_conditions = serializers.SerializerMethodField()

    def profile_for(self, appointment):
        return PatientProfile.objects.filter(user=appointment.patient).first()

    def get_age(self, appointment):
        profile = self.profile_for(appointment)
        if not profile or not profile.date_of_birth:
            return None
        today = date.today()
        return today.year - profile.date_of_birth.year - (
            (today.month, today.day) < (profile.date_of_birth.month, profile.date_of_birth.day)
        )

    def get_blood_type(self, appointment):
        profile = self.profile_for(appointment)
        return profile.blood_type if profile else 'Unknown'

    def get_allergies(self, appointment):
        profile = self.profile_for(appointment)
        return profile.allergies if profile else []

    def get_family_history(self, appointment):
        profile = self.profile_for(appointment)
        return profile.family_history if profile and profile.family_history else ''

    def get_chronic_conditions(self, appointment):
        profile = self.profile_for(appointment)
        return profile.chronic_conditions if profile else []
