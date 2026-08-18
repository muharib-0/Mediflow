# """
# Views for patient dashboard and doctor browsing.
# """
# from django.shortcuts import render, redirect, get_object_or_404
# from django.contrib.auth.decorators import login_required
# from django.contrib import messages
# from django.utils import timezone
# from django.db.models import Q

# from .models import PatientProfile
# from .forms import PatientProfileForm
# from doctors.models import DoctorProfile, Availability
# from appointments.models import Appointment
# from accounts.models import User


# def patient_required(view_func):
#     """Decorator to ensure only patients can access the view."""
#     @login_required
#     def wrapper(request, *args, **kwargs):
#         if not request.user.is_patient:
#             messages.error(request, 'Access denied. This page is for patients only.')
#             return redirect('accounts:dashboard')
#         return view_func(request, *args, **kwargs)
#     return wrapper


# @patient_required
# def dashboard(request):
#     """Patient dashboard with overview."""
#     # Ensure patient profile exists
#     profile, created = PatientProfile.objects.get_or_create(user=request.user)
    
#     today = timezone.now().date()
    
#     # Get upcoming appointments
#     upcoming_appointments = Appointment.objects.filter(
#         patient=request.user,
#         availability__date__gte=today,
#         status='confirmed'
#     ).select_related(
#         'availability', 'availability__doctor', 'availability__doctor__doctor_profile'
#     ).order_by('availability__date', 'availability__start_time')[:5]
    
#     # Today's appointments
#     todays_appointments = Appointment.objects.filter(
#         patient=request.user,
#         availability__date=today,
#         status='confirmed'
#     ).select_related(
#         'availability', 'availability__doctor', 'availability__doctor__doctor_profile'
#     ).order_by('availability__start_time')
    
#     # Total appointments count
#     total_appointments = Appointment.objects.filter(
#         patient=request.user,
#         status='confirmed'
#     ).count()
    
#     # Get featured doctors (max 4)
#     featured_doctors = DoctorProfile.objects.filter(
#         is_available=True
#     ).select_related('user')[:4]
    
#     context = {
#         'profile': profile,
#         'upcoming_appointments': upcoming_appointments,
#         'todays_appointments': todays_appointments,
#         'total_appointments': total_appointments,
#         'featured_doctors': featured_doctors,
#     }
    
#     return render(request, 'patients/dashboard.html', context)


# @patient_required
# def profile_setup(request):
#     """Setup or update patient profile."""
#     profile, created = PatientProfile.objects.get_or_create(user=request.user)
    
#     if request.method == 'POST':
#         form = PatientProfileForm(request.POST, instance=profile)
#         if form.is_valid():
#             form.save()
#             messages.success(request, 'Profile updated successfully!')
#             return redirect('patients:dashboard')
#     else:
#         form = PatientProfileForm(instance=profile)
    
#     return render(request, 'patients/profile_setup.html', {'form': form, 'profile': profile})


# @patient_required
# def browse_doctors(request):
#     """Browse all available doctors."""
#     specialization = request.GET.get('specialization', '')
#     search = request.GET.get('search', '')
    
#     doctors = DoctorProfile.objects.filter(is_available=True).select_related('user')
    
#     if specialization:
#         doctors = doctors.filter(specialization=specialization)
    
#     if search:
#         doctors = doctors.filter(
#             Q(user__first_name__icontains=search) |
#             Q(user__last_name__icontains=search) |
#             Q(qualification__icontains=search)
#         )
    
#     # Get specialization choices for filter
#     specializations = DoctorProfile.SPECIALIZATION_CHOICES
    
#     context = {
#         'doctors': doctors,
#         'specializations': specializations,
#         'current_specialization': specialization,
#         'search_query': search,
#     }
    
#     return render(request, 'patients/browse_doctors.html', context)


# @patient_required
# def doctor_detail(request, doctor_id):
#     """View doctor details and available slots."""
#     doctor_profile = get_object_or_404(
#         DoctorProfile.objects.select_related('user'),
#         id=doctor_id
#     )
    
#     today = timezone.now().date()
    
#     # Get available slots for the next 14 days
#     available_slots = Availability.objects.filter(
#         doctor=doctor_profile.user,
#         date__gte=today,
#         is_booked=False
#     ).order_by('date', 'start_time')[:50]
    
#     # Group slots by date
#     slots_by_date = {}
#     for slot in available_slots:
#         date_str = slot.date.strftime('%Y-%m-%d')
#         if date_str not in slots_by_date:
#             slots_by_date[date_str] = {
#                 'date': slot.date,
#                 'date_display': slot.date.strftime('%A, %B %d, %Y'),
#                 'slots': []
#             }
#         slots_by_date[date_str]['slots'].append(slot)
    
#     context = {
#         'doctor': doctor_profile,
#         'slots_by_date': slots_by_date,
#     }
    
#     return render(request, 'patients/doctor_detail.html', context)


# @patient_required
# def my_appointments(request):
#     """View all patient appointments."""
#     today = timezone.now().date()
    
#     # Upcoming appointments
#     upcoming = Appointment.objects.filter(
#         patient=request.user,
#         availability__date__gte=today,
#         status='confirmed'
#     ).select_related(
#         'availability', 'availability__doctor', 'availability__doctor__doctor_profile'
#     ).order_by('availability__date', 'availability__start_time')
    
#     # Past appointments
#     past = Appointment.objects.filter(
#         patient=request.user,
#         availability__date__lt=today,
#         status='confirmed'
#     ).select_related(
#         'availability', 'availability__doctor', 'availability__doctor__doctor_profile'
#     ).order_by('-availability__date', '-availability__start_time')[:20]
    
#     # Cancelled appointments
#     cancelled = Appointment.objects.filter(
#         patient=request.user,
#         status='cancelled'
#     ).select_related(
#         'availability', 'availability__doctor', 'availability__doctor__doctor_profile'
#     ).order_by('-created_at')[:10]
    
#     context = {
#         'upcoming': upcoming,
#         'past': past,
#         'cancelled': cancelled,
#     }
    
#     return render(request, 'patients/my_appointments.html', context)



#DRF views for patient profiles and health metrics

from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from .models import PatientProfile, HealthMetric, Medication
from .serializers import (
    
    PatientProfileSerializer, 
    PatientDashboardSerializer,
    HealthMetricSerializer, 
    MedicationSerializer
)

# --- 1. Authentication & Registration ---


# --- 2. Patient Profile & Dashboard ---

class PatientProfileViewSet(viewsets.ModelViewSet):
    serializer_class = PatientProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PatientProfile.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # 1. Check if the user already has a profile
        profile = PatientProfile.objects.filter(user=request.user).first()
        
        if profile:
            # 2. If it exists, intercept the POST and treat it like an UPDATE (PATCH)
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        # 3. If no profile exists, create a new one normally
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
class PatientDashboardView(generics.RetrieveAPIView):
    """
    Endpoint for the React Dashboard. 
    Returns everything (profile, medications, metrics) in one network request.
    No ID needed in the URL; it uses the token to find the user.
    """
    serializer_class = PatientDashboardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Fetch the profile of the currently authenticated user
        profile, created = PatientProfile.objects.get_or_create(user=self.request.user)
        return profile


# --- 3. Medical Data Management ---

class HealthMetricViewSet(viewsets.ModelViewSet):
    """
    Endpoint for adding/viewing daily weight and BMI.
    """
    serializer_class = HealthMetricSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter metrics to only show the logged-in user's data
        return HealthMetric.objects.filter(patient__user=self.request.user)

    def perform_create(self, serializer):
        profile = PatientProfile.objects.get(user=self.request.user)
        serializer.save(patient=profile)


class MedicationViewSet(viewsets.ModelViewSet):
    """
    Endpoint for viewing prescriptions.
    (Creation is typically restricted to Doctors, but kept open here for testing).
    """
    serializer_class = MedicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Medication.objects.filter(patient__user=self.request.user)

    def perform_create(self, serializer):
        profile = PatientProfile.objects.get(user=self.request.user)
        serializer.save(patient=profile)