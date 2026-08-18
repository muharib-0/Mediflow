"""
DRF serializers for accounts.

Note: google_access_token / google_refresh_token / google_token_expiry are
intentionally never exposed here. Use `has_google_calendar_connected` (a
plain boolean) if the frontend needs to know connection status.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from patients.models import PatientProfile
from doctors.models import DoctorProfile
User = get_user_model()



class UserSerializer(serializers.ModelSerializer):
    """Read-only representation of the logged-in user (safe for the frontend)."""

    has_google_calendar_connected = serializers.BooleanField(read_only=True)
    has_profile = serializers.SerializerMethodField()

    def get_has_profile(self, user):
        """Whether the user has finished the required profile setup."""
        if user.role == User.Role.PATIENT:
            return PatientProfile.objects.filter(user=user).exists()
        if user.role == User.Role.DOCTOR:
            # A placeholder profile may be created when the setup form is first
            # opened. It is not considered complete until it has been saved.
            return DoctorProfile.objects.filter(user=user).exclude(
                qualification='Not specified'
            ).exists()
        return True

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'phone_number', 'avatar',
            'has_google_calendar_connected', 'has_profile', 'created_at',
        ]
        read_only_fields = ['id', 'role', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    """Handles patient/doctor self-registration.

    Deliberately does NOT allow role='admin' via this endpoint — admins
    should be created through the Django admin / createsuperuser only.
    """

    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[User.Role.PATIENT, User.Role.DOCTOR])

    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'role', 'phone_number', 'password', 'password_confirm',
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': "Passwords don't match."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer to include user info in the token response."""

    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        user_data = UserSerializer(user).data

        has_profile = False
        if user.role == 'patient':
            has_profile = PatientProfile.objects.filter(user=user).exists()
        elif user.role == 'doctor':
            has_profile = DoctorProfile.objects.filter(user=user).exists()

        user_data['has_profile'] = has_profile
        data['user'] = user_data
        data['role'] = user.role
        data['has_profile'] = has_profile

        return data
