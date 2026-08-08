from rest_framework import serializers

from .models import Appointment


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