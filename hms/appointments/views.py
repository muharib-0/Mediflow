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
from .models import Appointment
from .serializers import AppointmentSerializer, BookAppointmentSerializer, DoctorPatientDetailSerializer
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
