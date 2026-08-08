from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsPatient
from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from doctors.models import DoctorProfile
from doctors.serializers import DoctorProfileSerializer
from .models import PatientProfile
from .serializers import PatientProfileSerializer


class MyPatientProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/patients/me/profile/ for the logged-in patient."""
    serializer_class = PatientProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatient]

    def get_object(self):
        profile, _ = PatientProfile.objects.get_or_create(user=self.request.user)
        return profile


class PatientDashboardView(APIView):
    """GET /api/patients/dashboard/ returns patient dashboard data as JSON."""
    permission_classes = [permissions.IsAuthenticated, IsPatient]

    def get(self, request):
        today = timezone.now().date()
        appointments = Appointment.objects.filter(
            patient=request.user,
            status='confirmed',
        )
        upcoming = appointments.filter(
            availability__date__gte=today,
        ).select_related(
            'availability',
            'availability__doctor',
            'availability__doctor__doctor_profile',
        ).order_by('availability__date', 'availability__start_time')[:5]
        featured_doctors = DoctorProfile.objects.filter(
            is_available=True,
        ).select_related('user')[:4]

        return Response({
            'total_appointments': appointments.count(),
            'upcoming_appointments': AppointmentSerializer(upcoming, many=True).data,
            'featured_doctors': DoctorProfileSerializer(featured_doctors, many=True).data,
        })
