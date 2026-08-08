"""
API views for accounts: register, JWT login (with user info attached),
and the "who am I" endpoint the React app calls on load / after refresh.
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializer import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/accounts/register/"""
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'user': UserSerializer(user).data, 'message': 'Registration successful. Please log in.'},
            status=status.HTTP_201_CREATED,
        )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds role/email claims and echoes the user object in the login response."""

    username_field = 'email'

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        return token


class LoginView(TokenObtainPairView):
    """POST /api/accounts/login/ -> { access, refresh, user }"""
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    """GET /api/accounts/me/ returns the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
