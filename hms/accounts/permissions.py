"""
Role-based DRF permissions.

Mirrors the logic already used by the @patient_required / @doctor_required
view decorators in patients/views.py and doctors/views.py, so the two
frontends (old templates, new API) enforce identical rules.
"""
from rest_framework.permissions import BasePermission


class IsPatient(BasePermission):
    message = 'This action is only available to patients.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_patient)


class IsDoctor(BasePermission):
    message = 'This action is only available to doctors.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_doctor)


class IsAppointmentOwner(BasePermission):
    """Object-level check: the requesting patient owns this appointment,
    or the requesting doctor owns the underlying availability slot."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_patient:
            return obj.patient_id == user.id
        if user.is_doctor:
            return obj.availability.doctor_id == user.id
        return False