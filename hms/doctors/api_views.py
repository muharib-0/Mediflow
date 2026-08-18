from datetime import datetime, timedelta

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsDoctor
from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from .models import Availability, DoctorProfile
from .serializers import AvailabilitySerializer, BulkAvailabilitySerializer, DoctorProfileSerializer


class DoctorListView(generics.ListAPIView):
    """GET /api/doctors/ lists available doctors for patient browsing."""
    serializer_class = DoctorProfileSerializer
    permission_classes = [permissions.AllowAny]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.user.is_authenticated and request.user.is_doctor:
            raise PermissionDenied('Doctors cannot browse the doctor directory.')

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

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.user.is_authenticated and request.user.is_doctor:
            raise PermissionDenied('Doctors cannot view other doctor profiles.')


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
        Availability.delete_expired_slots(doctor=request.user)
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

        booked_slots = appointments.filter(
            availability__date__gte=today,
        ).select_related('patient', 'availability').order_by(
            'availability__date', 'availability__start_time',
        )[:10]

        return Response({
            'total_slots': Availability.objects.filter(doctor=request.user).count(),
            'available_slots': Availability.objects.filter(
                doctor=request.user,
                is_booked=False,
                date__gte=today,
            ).count(),
            'total_patients': appointments.values('patient').distinct().count(),
            'upcoming_appointments': AppointmentSerializer(upcoming, many=True).data,
            'booked_slots': AppointmentSerializer(booked_slots, many=True).data,
        })


class MyAvailabilityListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/doctors/me/availability/ for doctor-owned slots."""
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def get_queryset(self):
        Availability.delete_expired_slots(doctor=self.request.user)
        return Availability.objects.filter(doctor=self.request.user)

    def perform_create(self, serializer):
        try:
            serializer.save(doctor=self.request.user)
        except DjangoValidationError as exc:
            # A second check is still needed if another request inserts an
            # overlapping slot after serializer validation has completed.
            raise ValidationError({
                'non_field_errors': (
                    exc.message_dict.get('__all__', exc.messages)
                    if hasattr(exc, 'error_dict')
                    else exc.messages
                ),
            })

class MyAvailabilityListBulkCreateView(APIView):
    """Generate doctor-owned slots from one selected date and time range."""
    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def post(self, request):
        serializer = BulkAvailabilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        current_start = datetime.combine(data['date'], data['start_time'])
        range_end = datetime.combine(data['date'], data['end_time'])
        duration = timedelta(minutes=data['slot_duration'])
        created_count = 0
        skipped_count = 0
        errors = []

        while current_start + duration <= range_end:
            slot = Availability(
                doctor=request.user,
                date=data['date'],
                start_time=current_start.time(),
                end_time=(current_start + duration).time(),
            )
            try:
                slot.save()
                created_count += 1
            except (DjangoValidationError, IntegrityError) as exc:
                # Existing or overlapping slots should not prevent the rest of
                # the selected range from being created.
                skipped_count += 1
                errors.append({
                    'start_time': current_start.strftime('%H:%M'),
                    'detail': str(exc),
                })
            current_start += duration

        return Response({
            'created_count': created_count,
            'skipped_count': skipped_count,
            'errors': errors,
        }, status=201)

        
class MyAvailabilityDetailView(generics.RetrieveDestroyAPIView):
    """GET/DELETE /api/doctors/me/availability/<id>/ for doctor-owned slots."""
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def get_queryset(self):
        Availability.delete_expired_slots(doctor=self.request.user)
        return Availability.objects.filter(doctor=self.request.user)


class PublicAvailabilityListView(generics.ListAPIView):
    """GET /api/doctors/availability/ lists future open slots."""
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        Availability.delete_expired_slots()
        queryset = Availability.objects.filter(
            is_booked=False,
            doctor__doctor_profile__is_available=True,
        ).select_related('doctor', 'doctor__doctor_profile')
        now = timezone.localtime()
        # Date-only filtering exposed slots earlier today which then failed at
        # booking time. Only return slots that are genuinely still bookable.
        queryset = queryset.filter(
            Q(date__gt=now.date()) | Q(date=now.date(), start_time__gt=now.time())
        )
        doctor_id = self.request.query_params.get('doctor_id')

        if doctor_id:
            # `doctor` on Availability is a FK to the User model. The related
            # DoctorProfile is accessible as `doctor.doctor_profile` (OneToOne),
            # so filter by the profile's PK using `doctor__doctor_profile__pk`.
            queryset = queryset.filter(doctor__doctor_profile__pk=doctor_id)

        return queryset.order_by('date', 'start_time')
