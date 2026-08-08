from rest_framework import serializers

from .models import PatientProfile


class PatientProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    age = serializers.IntegerField(read_only=True)

    class Meta:
        model = PatientProfile
        fields = [
            'id',
            'user_id',
            'email',
            'first_name',
            'last_name',
            'date_of_birth',
            'blood_group',
            'address',
            'emergency_contact',
            'emergency_contact_name',
            'medical_history',
            'allergies',
            'age',
        ]
        read_only_fields = ['id', 'user_id', 'email', 'first_name', 'last_name', 'age']
