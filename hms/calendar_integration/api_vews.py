"""
Views for Google Calendar OAuth integration.
"""
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.conf import settings
from django.http import HttpResponseBadRequest
from requests import request

from .services import GoogleCalendarService


@login_required
def connect_google_calendar(request):
    """Initiate Google Calendar OAuth flow."""
    if not GoogleCalendarService().client_id:
        return redirect(f'{settings.FRONTEND_URL}/settings?calendar_error=not_configured')
    
    service = GoogleCalendarService()
    
    # Create state to store user info
    state = str(request.user.id)
    
    authorization_url, returned_state = service.get_authorization_url(state=state)
    
    # Store state in session for verification
    request.session['google_oauth_state'] = returned_state
    
    return redirect(authorization_url)


@login_required
def disconnect_google_calendar(request):
    """Clear stored Google Calendar tokens for the current user."""
    user = request.user
    user.google_access_token = ''
    user.google_refresh_token = ''
    user.google_token_expiry = None
    user.save()

    return redirect(f'{settings.FRONTEND_URL}/settings?calendar_disconnected=1')


@login_required
def oauth2_callback(request):
    """Handle OAuth2 callback from Google."""
    error = request.GET.get('error')
    if error:
        return redirect(f'{settings.FRONTEND_URL}/settings?calendar_error=denied')

    code = request.GET.get('code')
    state = request.GET.get('state')

    if not code:
        return HttpResponseBadRequest('Missing authorization code')

    # Verify state
    stored_state = request.session.get('google_oauth_state')
    if state != stored_state:
        return redirect(f'{settings.FRONTEND_URL}/settings?calendar_error=invalid_state')

    try:
        service = GoogleCalendarService()
        tokens = service.exchange_code_for_tokens(code)

        user = request.user
        user.google_access_token = tokens['access_token']

        # Only overwrite the refresh token if Google sent a new one.
        # Otherwise, keep the old one (if we have it).
        if tokens.get('refresh_token'):
            user.google_refresh_token = tokens['refresh_token']

        user.google_token_expiry = tokens['expiry']
        user.save()

        del request.session['google_oauth_state']

        return redirect(f'{settings.FRONTEND_URL}/settings?calendar_connected=1')
    except Exception as e:
        return redirect(f'{settings.FRONTEND_URL}/settings?calendar_error=exchange_failed')