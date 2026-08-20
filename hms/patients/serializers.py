from rest_framework import serializers
from .models import PatientProfile, HealthMetric, Medication
from accounts.serializer import UserSerializer



class HealthMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthMetric
        fields = ['id', 'date', 'weight_lbs', 'bmi']

class MedicationSerializer(serializers.ModelSerializer):
    appointment_id = serializers.IntegerField(source='appointment.id', read_only=True, default=None)

    class Meta:
        model = Medication
        fields = ['id', 'name', 'dosage', 'frequency', 'status', 'prescribed_by', 'date_prescribed', 'appointment_id']

class PatientProfileSerializer(serializers.ModelSerializer):
    # Flatten user data into the profile response for convenience
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)

    class Meta:
        model = PatientProfile
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone_number', 
            'date_of_birth', 'blood_type', 'allergies', 
            'chronic_conditions', 'family_history'
        ]

class PatientDashboardSerializer(serializers.ModelSerializer):
    """
    A read-only serializer to power the React Dashboard. 
    It fetches the profile, plus nested metrics and medications in ONE network request.
    """
    user_info = UserSerializer(source='user', read_only=True)
    
    # Fetch only active medications
    active_medications = serializers.SerializerMethodField()
    
    # Fetch the 6 most recent health metrics for the chart
    recent_metrics = serializers.SerializerMethodField()

    class Meta:
        model = PatientProfile
        fields = [
            'id', 'user_info', 'date_of_birth', 'blood_type', 
            'allergies', 'chronic_conditions', 'family_history',
            'active_medications', 'recent_metrics'
        ]

    def get_active_medications(self, obj):
        meds = obj.medications.filter(status='active')
        return MedicationSerializer(meds, many=True).data

    def get_recent_metrics(self, obj):
        # Grab the latest 6 metrics, reverse them so they display chronologically on the chart
        metrics = obj.health_metrics.all()[:6][::-1] 
        return HealthMetricSerializer(metrics, many=True).data