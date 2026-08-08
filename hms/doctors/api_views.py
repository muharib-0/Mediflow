from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsDoctor
from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from .models import Availability, DoctorProfile
from .serializers import AvailabilitySerializer, DoctorProfileSerializer


class DoctorListView(generics.ListAPIView):
    """GET /api/doctors/ lists available doctors for patient browsing."""
    serializer_class = DoctorProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = DoctorProfile.objects.filter(is_available=True).select_related('user')
        specialization = self.request.query_params.get('specialization')
        search = self.request.query_params.get('search')

        if specialization:
            queryset = queryset.filter(specialization=specialization)

        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(qualification__icontains=search)
                | Q(bio__icontains=search)
            )

        return queryset.order_by('user__first_name', 'user__last_name', 'id')


class DoctorDetailView(generics.RetrieveAPIView):
    """GET /api/doctors/<id>/ returns a doctor's public profile."""
    serializer_class = DoctorProfileSerializer
    permission_classes = [permissions.AllowAny]
    queryset = DoctorProfile.objects.filter(is_available=True).select_related('user')


class MyDoctorProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/doctors/me/profile/ for the logged-in doctor."""
    serializer_class = DoctorProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def get_object(self):
        profile, _ = DoctorProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'qualification': 'Not specified'},
        )
        return profile


class DoctorDashboardView(APIView):
    """GET /api/doctors/dashboard/ returns doctor dashboard stats as JSON."""
    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def get(self, request):
        today = timezone.now().date()
        appointments = Appointment.objects.filter(
            availability__doctor=request.user,
            status='confirmed',
        )
        upcoming = appointments.filter(
            availability__date__gte=today,
        ).select_related('patient', 'availability').order_by(
            'availability__date',
            'availability__start_time',
        )[:5]

        return Response({
            'total_slots': Availability.objects.filter(doctor=request.user).count(),
            'available_slots': Availability.objects.filter(
                doctor=request.user,
                is_booked=False,
                date__gte=today,
            ).count(),
            'total_patients': appointments.values('patient').distinct().count(),
            'upcoming_appointments': AppointmentSerializer(upcoming, many=True).data,
        })


class MyAvailabilityListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/doctors/me/availability/ for doctor-owned slots."""
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def get_queryset(self):
        return Availability.objects.filter(doctor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)


class MyAvailabilityDetailView(generics.RetrieveDestroyAPIView):
    """GET/DELETE /api/doctors/me/availability/<id>/ for doctor-owned slots."""
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def get_queryset(self):
        return Availability.objects.filter(doctor=self.request.user)


class PublicAvailabilityListView(generics.ListAPIView):
    """GET /api/doctors/availability/ lists future open slots."""
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Availability.objects.filter(
            date__gte=timezone.now().date(),
            is_booked=False,
            doctor__doctor_profile__is_available=True,
        ).select_related('doctor', 'doctor__doctor_profile')
        doctor_id = self.request.query_params.get('doctor_id')

        if doctor_id:
            queryset = queryset.filter(doctor__doctor_profile_id=doctor_id)

        return queryset.order_by('date', 'start_time')
