from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone

from .models import Availability, DoctorProfile


class DoctorProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = DoctorProfile
        fields = [
            'id',
            'user_id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'specialization',
            'qualification',
            'experience_years',
            'bio',
            'consultation_fee',
            'is_available',
        ]
        read_only_fields = ['id', 'user_id', 'email', 'first_name', 'last_name', 'full_name']


class AvailabilitySerializer(serializers.ModelSerializer):
    doctor_id = serializers.IntegerField(source='doctor.id', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Availability
        fields = [
            'id',
            'doctor_id',
            'doctor_name',
            'date',
            'start_time',
            'end_time',
            'is_booked',
            'is_available',
            'duration_minutes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'doctor_id',
            'doctor_name',
            'is_booked',
            'is_available',
            'duration_minutes',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        """Return overlap and time errors as a normal API 400 response.

        Availability.save() also runs full_clean(), but validating here keeps
        those expected user input errors from escaping as server errors.
        """
        request = self.context.get('request')
        doctor = getattr(request, 'user', None)
        if not doctor or not doctor.is_authenticated:
            return attrs

        slot = Availability(
            pk=self.instance.pk if self.instance else None,
            doctor=doctor,
            date=attrs.get('date', getattr(self.instance, 'date', None)),
            start_time=attrs.get('start_time', getattr(self.instance, 'start_time', None)),
            end_time=attrs.get('end_time', getattr(self.instance, 'end_time', None)),
        )
        try:
            slot.clean()
        except DjangoValidationError as exc:
            message = (
                exc.message_dict.get('__all__', exc.messages)
                if hasattr(exc, 'error_dict')
                else exc.messages
            )
            raise serializers.ValidationError({'non_field_errors': message})
        return attrs


class BulkAvailabilitySerializer(serializers.Serializer):
    """A date and time range from which appointment slots are generated."""

    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    slot_duration = serializers.ChoiceField(choices=[15, 30, 45, 60])

    def validate(self, attrs):
        if attrs['date'] < timezone.localdate():
            raise serializers.ValidationError({'date': 'Cannot create slots in the past.'})
        if attrs['start_time'] >= attrs['end_time']:
            raise serializers.ValidationError({'end_time': 'End time must be after start time.'})
        return attrs
