"""
DRF serializers for accounts.

Note: google_access_token / google_refresh_token / google_token_expiry are
intentionally never exposed here. Use `has_google_calendar_connected` (a
plain boolean) if the frontend needs to know connection status.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Read-only representation of the logged-in user (safe for the frontend)."""

    has_google_calendar_connected = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'phone_number', 'avatar',
            'has_google_calendar_connected', 'created_at',
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