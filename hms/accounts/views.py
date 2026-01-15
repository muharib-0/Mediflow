"""
Views for user authentication and account management.
"""
import requests
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView
from django.contrib import messages
from django.views.generic import CreateView
from django.urls import reverse_lazy
from django.conf import settings

from .forms import SignUpForm, LoginForm, UserProfileForm
from .models import User


class SignUpView(CreateView):
    """Handle user registration."""
    
    model = User
    form_class = SignUpForm
    template_name = 'accounts/signup.html'
    success_url = reverse_lazy('accounts:login')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        user = self.object
        
        # Send welcome email via serverless function
        try:
            self._send_welcome_email(user)
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
        
        messages.success(
            self.request, 
            f'Account created successfully! Welcome, {user.first_name}. Please log in.'
        )
        return response
    
    def _send_welcome_email(self, user):
        """Send welcome email via serverless email service."""
        try:
            payload = {
                'action': 'SIGNUP_WELCOME',
                'to_email': user.email,
                'user_name': user.get_full_name() or user.email,
                'role': user.role
            }
            response = requests.post(
                settings.EMAIL_SERVICE_URL,
                json=payload,
                timeout=5
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Email service error: {e}")


class CustomLoginView(LoginView):
    """Custom login view with styled form."""
    
    form_class = LoginForm
    template_name = 'accounts/login.html'
    redirect_authenticated_user = True
    
    def get_success_url(self):
        return reverse_lazy('accounts:dashboard')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, f'Welcome back, {self.request.user.first_name}!')
        return response


@login_required
def dashboard_view(request):
    """Redirect to appropriate dashboard based on user role."""
    if request.user.is_doctor:
        return redirect('doctors:dashboard')
    elif request.user.is_patient:
        return redirect('patients:dashboard')
    else:
        return redirect('accounts:profile')


@login_required
def profile_view(request):
    """User profile view and update."""
    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('accounts:profile')
    else:
        form = UserProfileForm(instance=request.user)
    
    return render(request, 'accounts/profile.html', {'form': form})


def logout_view(request):
    """Handle user logout."""
    logout(request)
    messages.info(request, 'You have been logged out successfully.')
    return redirect('accounts:login')


def home_view(request):
    """Home page view."""
    if request.user.is_authenticated:
        return redirect('accounts:dashboard')
    return render(request, 'accounts/home.html')
