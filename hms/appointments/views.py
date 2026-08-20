"""
API views for appointments.

book_appointment_view below is a deliberate 1:1 port of the locking logic
in appointments/views.py::book_appointment — same select_for_update() +
transaction.atomic() sequence, same "is it already booked, is it in the
future" checks. Only the request/response handling changed (JSON in/out
instead of Django messages + redirect). If you change the booking logic,
change it in both places, or better, factor it into a shared service
function that both the template view and this API view call.
"""
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAppointmentOwner, IsDoctor, IsPatient
from doctors.models import Availability
from .models import Appointment, AppointmentPrescription
from .serializers import (
    AppointmentPrescriptionSerializer,
    AppointmentSerializer, BookAppointmentSerializer, DoctorPatientHistorySerializer,
    DoctorPatientDetailSerializer, MarkAppointmentStatusSerializer,
)
from .services import send_booking_confirmation_email


class BookAppointmentView(APIView):
    """POST /api/appointments/book/<slot_id>/  body: { "reason": "..." }"""
    permission_classes = [permissions.IsAuthenticated, IsPatient]

    def post(self, request, slot_id):
        slot = get_object_or_404(
            Availability.objects.select_related('doctor', 'doctor__doctor_profile'),
            id=slot_id,
        )

        if not slot.is_in_future:
            return Response({'detail': 'This slot is no longer available.'}, status=status.HTTP_400_BAD_REQUEST)

        input_serializer = BookAppointmentSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        reason = input_serializer.validated_data['reason']

        try:
            with transaction.atomic():
                locked_slot = Availability.objects.select_for_update().get(id=slot_id)

                if locked_slot.is_booked:
                    return Response(
                        {'detail': 'Sorry, this slot was just booked by another patient. Please choose a different slot.'},
                        status=status.HTTP_409_CONFLICT,
                    )

                locked_slot.is_booked = True
                locked_slot.save()

                appointment = Appointment.objects.create(
                    patient=request.user,
                    availability=locked_slot,
                    reason=reason,
                    status='confirmed',
                )

                try:
                    from calendar_integration.services import GoogleCalendarService
                    calendar_service = GoogleCalendarService()

                    if slot.doctor.has_google_calendar_connected:
                        doctor_event = calendar_service.create_appointment_event(appointment, for_doctor=True)
                        if doctor_event:
                            appointment.google_event_id_doctor = doctor_event.get('id', '')

                    if request.user.has_google_calendar_connected:
                        patient_event = calendar_service.create_appointment_event(appointment, for_doctor=False)
                        if patient_event:
                            appointment.google_event_id_patient = patient_event.get('id', '')

                    appointment.save()
                except Exception as e:
                    print(f"Google Calendar integration error: {e}")

                try:
                    send_booking_confirmation_email(appointment)
                except Exception as e:
                    print(f"Email notification error: {e}")

        except Exception as e:
            return Response({'detail': f'An error occurred while booking: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)


class MyAppointmentsView(generics.ListAPIView):
    """GET /api/appointments/mine/ — works for both roles, scoped to the caller."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        base = Appointment.objects.select_related('patient', 'availability', 'availability__doctor')
        if user.is_doctor:
            return base.filter(availability__doctor=user)
        return base.filter(patient=user)


class DoctorPatientHistoryListView(generics.ListAPIView):
    """GET /api/appointments/patient-history/ -- doctor's clinical history."""

    permission_classes = [permissions.IsAuthenticated, IsDoctor]
    serializer_class = DoctorPatientHistorySerializer

    def get_queryset(self):
        queryset = Appointment.objects.filter(
            availability__doctor=self.request.user,
        ).exclude(
            status__in=['cancelled', 'no_show'],
        ).select_related(
            'patient', 'availability', 'availability__doctor', 'prescription',
        ).order_by('-availability__date', '-availability__start_time')

        patient = self.request.query_params.get('patient', '').strip()
        status_filter = self.request.query_params.get('status', '').strip()
        date_from = self.request.query_params.get('date_from', '').strip()
        date_to = self.request.query_params.get('date_to', '').strip()

        if patient:
            queryset = queryset.filter(
                patient__first_name__icontains=patient,
            ) | queryset.filter(
                patient__last_name__icontains=patient,
            ) | queryset.filter(
                patient__email__icontains=patient,
            )
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if date_from:
            queryset = queryset.filter(availability__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(availability__date__lte=date_to)

        return queryset.distinct()


class AppointmentDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAppointmentOwner]
    serializer_class = AppointmentSerializer
    queryset = Appointment.objects.select_related('patient', 'availability', 'availability__doctor')


class AppointmentPatientDetailView(APIView):
    """Doctors may view medical details only for patients booked with them."""
    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def get(self, request, appointment_id):
        appointment = get_object_or_404(
            Appointment.objects.select_related(
                'patient', 'patient__patient_profile', 'availability', 'availability__doctor'
            ),
            id=appointment_id,
            availability__doctor=request.user,
        )
        return Response(DoctorPatientDetailSerializer(appointment).data)


class MarkAppointmentStatusView(APIView):
    """POST /api/appointments/<id>/status/  body: { "status": "checked_in|in_progress|completed|no_show", "notes": "..." }

    Doctor-only. The appointment lifecycle supports being checked in before
    consultation, then set to ongoing/in-progress, and finally completed or no-show.
    """
    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def post(self, request, appointment_id):
        appointment = get_object_or_404(
            Appointment.objects.select_related('availability', 'availability__doctor'),
            id=appointment_id,
            availability__doctor=request.user,
        )

        if appointment.status == 'cancelled':
            return Response(
                {'detail': 'Cannot update a cancelled appointment.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MarkAppointmentStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data['status']
        notes = serializer.validated_data['notes']

        allowed_progression = ['confirmed', 'checked_in', 'in_progress', 'completed', 'no_show']
        if appointment.status not in allowed_progression:
            return Response(
                {'detail': f"Cannot update status from '{appointment.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status == 'completed' and appointment.availability.is_in_future:
            return Response(
                {'detail': 'This appointment has not happened yet.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if new_status == 'no_show' and appointment.availability.is_in_future:
            return Response(
                {'detail': 'This appointment cannot be marked as no-show before the scheduled time passes.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment.status = new_status
        if notes:
            appointment.notes = notes
        appointment.save()

        return Response(AppointmentSerializer(appointment).data)


class AppointmentPrescriptionView(APIView):
    """POST /api/appointments/<id>/prescription/ to create a prescription for a visit."""
    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def post(self, request, appointment_id):
        appointment = get_object_or_404(
            Appointment.objects.select_related('patient', 'availability', 'availability__doctor'),
            id=appointment_id,
            availability__doctor=request.user,
        )

        if appointment.status not in ['confirmed', 'checked_in', 'in_progress', 'completed']:
            return Response(
                {'detail': 'A prescription can only be created for an active or completed appointment.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        diagnosis = request.data.get('diagnosis', '').strip()
        notes = request.data.get('notes', '').strip()
        medications = request.data.get('medications', [])

        if not diagnosis and not notes and not medications:
            return Response(
                {'detail': 'Provide at least a diagnosis, notes, or medication list.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prescription = AppointmentPrescription.objects.create(
            appointment=appointment,
            doctor=request.user,
            patient=appointment.patient,
            diagnosis=diagnosis,
            notes=notes,
            medications=medications,
        )

        return Response(AppointmentPrescriptionSerializer(prescription).data, status=status.HTTP_201_CREATED)


class PatientAppointmentHistoryView(APIView):
    """GET /api/appointments/<id>/history/ shows prior clinical history for that patient."""
    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def get(self, request, appointment_id):
        appointment = get_object_or_404(
            Appointment.objects.select_related('patient', 'availability', 'availability__doctor'),
            id=appointment_id,
            availability__doctor=request.user,
        )

        history = Appointment.objects.filter(
            patient=appointment.patient,
        ).exclude(id=appointment.id).select_related('availability', 'availability__doctor').order_by('-availability__date', '-availability__start_time')

        data = []
        for past_appointment in history:
            prescription = getattr(past_appointment, 'prescription', None)
            data.append({
                'appointment_id': past_appointment.id,
                'date': past_appointment.date,
                'start_time': past_appointment.start_time,
                'end_time': past_appointment.end_time,
                'status': past_appointment.status,
                'reason': past_appointment.reason,
                'notes': past_appointment.notes,
                'diagnosis': prescription.diagnosis if prescription else '',
                'prescription': {
                    'id': prescription.id,
                    'diagnosis': prescription.diagnosis,
                    'notes': prescription.notes,
                    'medications': prescription.medications,
                } if prescription else None,
            })

        return Response({
            'patient_name': appointment.patient.get_full_name(),
            'history': data,
        })


class CancelAppointmentView(APIView):
    """POST /api/appointments/<id>/cancel/"""
    permission_classes = [permissions.IsAuthenticated, IsPatient]

    def post(self, request, appointment_id):
        appointment = get_object_or_404(
            Appointment.objects.select_related('availability', 'availability__doctor'),
            id=appointment_id,
            patient=request.user,
        )

        if not appointment.availability.is_in_future:
            return Response({'detail': 'Cannot cancel a past appointment.'}, status=status.HTTP_400_BAD_REQUEST)
        if appointment.status == 'cancelled':
            return Response({'detail': 'This appointment is already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        appointment.cancel()
        # TODO (same as the template view): delete Google Calendar events, send cancellation email
        return Response(AppointmentSerializer(appointment).data)