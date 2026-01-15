"""
Views for doctor dashboard and availability management.
"""
from datetime import datetime, timedelta
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Count, Q

from .models import DoctorProfile, Availability
from .forms import DoctorProfileForm, AvailabilityForm, BulkAvailabilityForm
from appointments.models import Appointment


def doctor_required(view_func):
    """Decorator to ensure only doctors can access the view."""
    @login_required
    def wrapper(request, *args, **kwargs):
        if not request.user.is_doctor:
            messages.error(request, 'Access denied. This page is for doctors only.')
            return redirect('accounts:dashboard')
        return view_func(request, *args, **kwargs)
    return wrapper


@doctor_required
def dashboard(request):
    """Doctor dashboard with overview stats and upcoming appointments."""
    # Ensure doctor profile exists
    profile, created = DoctorProfile.objects.get_or_create(
        user=request.user,
        defaults={'qualification': 'Not specified'}
    )
    
    # Get today's date
    today = timezone.now().date()
    
    # Statistics
    total_slots = Availability.objects.filter(doctor=request.user).count()
    available_slots = Availability.objects.filter(
        doctor=request.user,
        is_booked=False,
        date__gte=today
    ).count()
    
    # Get upcoming appointments
    upcoming_appointments = Appointment.objects.filter(
        availability__doctor=request.user,
        availability__date__gte=today,
        status='confirmed'
    ).select_related('patient', 'availability').order_by(
        'availability__date', 'availability__start_time'
    )[:5]
    
    # Today's appointments
    todays_appointments = Appointment.objects.filter(
        availability__doctor=request.user,
        availability__date=today,
        status='confirmed'
    ).select_related('patient', 'availability').order_by('availability__start_time')
    
    # Get total patients count
    total_patients = Appointment.objects.filter(
        availability__doctor=request.user,
        status='confirmed'
    ).values('patient').distinct().count()
    
    context = {
        'profile': profile,
        'total_slots': total_slots,
        'available_slots': available_slots,
        'upcoming_appointments': upcoming_appointments,
        'todays_appointments': todays_appointments,
        'total_patients': total_patients,
    }
    
    return render(request, 'doctors/dashboard.html', context)


@doctor_required
def profile_setup(request):
    """Setup or update doctor profile."""
    profile, created = DoctorProfile.objects.get_or_create(
        user=request.user,
        defaults={'qualification': 'Not specified'}
    )
    
    if request.method == 'POST':
        form = DoctorProfileForm(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('doctors:dashboard')
    else:
        form = DoctorProfileForm(instance=profile)
    
    return render(request, 'doctors/profile_setup.html', {'form': form, 'profile': profile})


@doctor_required
def availability_list(request):
    """List all availability slots for the doctor."""
    today = timezone.now().date()
    
    # Upcoming slots
    upcoming_slots = Availability.objects.filter(
        doctor=request.user,
        date__gte=today
    ).order_by('date', 'start_time')
    
    # Past slots (last 7 days)
    past_slots = Availability.objects.filter(
        doctor=request.user,
        date__lt=today,
        date__gte=today - timedelta(days=7)
    ).order_by('-date', '-start_time')
    
    context = {
        'upcoming_slots': upcoming_slots,
        'past_slots': past_slots,
    }
    
    return render(request, 'doctors/availability_list.html', context)


@doctor_required
def add_availability(request):
    """Add a single availability slot."""
    if request.method == 'POST':
        form = AvailabilityForm(request.POST)
        if form.is_valid():
            slot = form.save(commit=False)
            slot.doctor = request.user
            try:
                slot.save()
                messages.success(request, 'Availability slot added successfully!')
                return redirect('doctors:availability_list')
            except Exception as e:
                messages.error(request, f'Error: {str(e)}')
    else:
        form = AvailabilityForm()
    
    return render(request, 'doctors/add_availability.html', {'form': form})


@doctor_required
def bulk_add_availability(request):
    """Add multiple availability slots at once."""
    if request.method == 'POST':
        form = BulkAvailabilityForm(request.POST)
        if form.is_valid():
            date = form.cleaned_data['date']
            start_time = form.cleaned_data['start_time']
            end_time = form.cleaned_data['end_time']
            slot_duration = int(form.cleaned_data['slot_duration'])
            
            # Create slots
            current_start = datetime.combine(date, start_time)
            end_datetime = datetime.combine(date, end_time)
            slots_created = 0
            
            while current_start + timedelta(minutes=slot_duration) <= end_datetime:
                slot_end = current_start + timedelta(minutes=slot_duration)
                
                # Check if slot already exists
                exists = Availability.objects.filter(
                    doctor=request.user,
                    date=date,
                    start_time=current_start.time(),
                    end_time=slot_end.time()
                ).exists()
                
                if not exists:
                    Availability.objects.create(
                        doctor=request.user,
                        date=date,
                        start_time=current_start.time(),
                        end_time=slot_end.time()
                    )
                    slots_created += 1
                
                current_start = slot_end
            
            if slots_created > 0:
                messages.success(request, f'{slots_created} availability slots created successfully!')
            else:
                messages.warning(request, 'No new slots created. Slots may already exist.')
            
            return redirect('doctors:availability_list')
    else:
        form = BulkAvailabilityForm()
    
    return render(request, 'doctors/bulk_add_availability.html', {'form': form})


@doctor_required
def delete_availability(request, slot_id):
    """Delete an availability slot."""
    slot = get_object_or_404(Availability, id=slot_id, doctor=request.user)
    
    if slot.is_booked:
        messages.error(request, 'Cannot delete a booked slot.')
        return redirect('doctors:availability_list')
    
    if request.method == 'POST':
        slot.delete()
        messages.success(request, 'Availability slot deleted successfully!')
        return redirect('doctors:availability_list')
    
    return render(request, 'doctors/delete_availability.html', {'slot': slot})


@doctor_required
def my_appointments(request):
    """View all appointments for the doctor."""
    today = timezone.now().date()
    
    # Upcoming appointments
    upcoming = Appointment.objects.filter(
        availability__doctor=request.user,
        availability__date__gte=today,
        status='confirmed'
    ).select_related('patient', 'availability').order_by(
        'availability__date', 'availability__start_time'
    )
    
    # Past appointments
    past = Appointment.objects.filter(
        availability__doctor=request.user,
        availability__date__lt=today,
        status='confirmed'
    ).select_related('patient', 'availability').order_by(
        '-availability__date', '-availability__start_time'
    )[:20]
    
    # Cancelled appointments
    cancelled = Appointment.objects.filter(
        availability__doctor=request.user,
        status='cancelled'
    ).select_related('patient', 'availability').order_by('-created_at')[:10]
    
    context = {
        'upcoming': upcoming,
        'past': past,
        'cancelled': cancelled,
    }
    
    return render(request, 'doctors/my_appointments.html', context)
