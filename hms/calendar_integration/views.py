"""
Views for Google Calendar OAuth integration.
"""
import code
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponseBadRequest
from requests import request

from .services import GoogleCalendarService


@login_required
def connect_google_calendar(request):
    """Initiate Google Calendar OAuth flow."""
    if not GoogleCalendarService().client_id:
        messages.error(request, 'Google Calendar integration is not configured.')
        return redirect('accounts:profile')
    
    service = GoogleCalendarService()
    
    # Create state to store user info
    state = str(request.user.id)
    
    authorization_url, returned_state = service.get_authorization_url(state=state)
    
    # Store state in session for verification
    request.session['google_oauth_state'] = returned_state
    
    return redirect(authorization_url)


@login_required
def oauth2_callback(request):
    """Handle OAuth2 callback from Google."""
    error = request.GET.get('error')
    if error:
        messages.error(request, f'Google authorization failed: {error}')
        return redirect('accounts:profile')
    
    code = request.GET.get('code')
    state = request.GET.get('state')
    
    if not code:
        return HttpResponseBadRequest('Missing authorization code')
    
    # Verify state
    stored_state = request.session.get('google_oauth_state')
    if state != stored_state:
        messages.error(request, 'Invalid state parameter. Please try again.')
        return redirect('accounts:profile')
    
    try:
        service = GoogleCalendarService()
        tokens = service.exchange_code_for_tokens(code)
        
        user = request.user
        user.google_access_token = tokens['access_token']
        
        # --- FIX STARTS HERE ---
        # Only overwrite the refresh token if Google sent a new one.
        # Otherwise, keep the old one (if we have it).
        if tokens.get('refresh_token'):
            user.google_refresh_token = tokens['refresh_token']
        # --- FIX ENDS HERE ---
            
        user.google_token_expiry = tokens['expiry']
        user.save()
        
        del request.session['google_oauth_state']
        
        messages.success(request, 'Google Calendar connected successfully!')
    except Exception as e:
        messages.error(request, f'Failed to connect Google Calendar: {str(e)}')
    
    return redirect('accounts:dashboard') # Changed from 'profile' to 'dashboard' to match your settings


@login_required
def disconnect_google_calendar(request):
    """Disconnect Google Calendar."""
    if request.method == 'POST':
        user = request.user
        user.google_access_token = None
        user.google_refresh_token = None
        user.google_token_expiry = None
        user.save()
        
        messages.success(request, 'Google Calendar disconnected successfully.')
    
    return redirect('accounts:profile')
