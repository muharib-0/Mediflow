from rest_framework import serializers

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
