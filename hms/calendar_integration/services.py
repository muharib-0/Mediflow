"""
Google Calendar API integration service.
"""
import os
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


class GoogleCalendarService:
    """Service class for Google Calendar API operations."""
    
    SCOPES = ['https://www.googleapis.com/auth/calendar.events']
    
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
    
    def get_authorization_url(self, state=None):
        """Get the OAuth2 authorization URL."""
        flow = Flow.from_client_config(
            {
                'web': {
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri': 'https://oauth2.googleapis.com/token',
                    'redirect_uris': [self.redirect_uri],
                }
            },
            scopes=self.SCOPES,
            redirect_uri=self.redirect_uri
        )
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=state
        )
        
        return authorization_url, state
    
    def exchange_code_for_tokens(self, code):
        """Exchange authorization code for access and refresh tokens."""
        flow = Flow.from_client_config(
            {
                'web': {
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri': 'https://oauth2.googleapis.com/token',
                    'redirect_uris': [self.redirect_uri],
                }
            },
            scopes=self.SCOPES,
            redirect_uri=self.redirect_uri
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        return {
            'access_token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'expiry': credentials.expiry,
        }
    
    def get_credentials(self, user):
        """Get valid credentials for a user."""
        if not user.google_refresh_token:
            return None
        
        credentials = Credentials(
            token=user.google_access_token,
            refresh_token=user.google_refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=self.client_id,
            client_secret=self.client_secret,
        )
        
        # Check if token needs refresh
        if user.google_token_expiry and timezone.now() >= user.google_token_expiry:
            try:
                credentials.refresh(Request())
                # Update user tokens
                user.google_access_token = credentials.token
                user.google_token_expiry = credentials.expiry
                user.save(update_fields=['google_access_token', 'google_token_expiry'])
            except Exception as e:
                print(f"Error refreshing token: {e}")
                return None
        
        return credentials
    
    def create_appointment_event(self, appointment, for_doctor=True):
        """Create a calendar event for an appointment."""
        if for_doctor:
            user = appointment.doctor
            title = f"Appointment with {appointment.patient.get_full_name()}"
            attendee_email = appointment.patient.email
        else:
            user = appointment.patient
            title = f"Appointment with Dr. {appointment.doctor.get_full_name()}"
            attendee_email = appointment.doctor.email
        
        credentials = self.get_credentials(user)
        if not credentials:
            return None
        
        try:
            service = build('calendar', 'v3', credentials=credentials)
            
            # Create event datetime
            start_datetime = datetime.combine(
                appointment.date,
                appointment.start_time
            )
            end_datetime = datetime.combine(
                appointment.date,
                appointment.end_time
            )
            
            # Make timezone aware
            tz = timezone.get_current_timezone()
            start_datetime = timezone.make_aware(start_datetime, tz)
            end_datetime = timezone.make_aware(end_datetime, tz)
            
            event = {
                'summary': title,
                'description': f"""
Hospital Management System - Appointment

{"Patient" if for_doctor else "Doctor"}: {appointment.patient.get_full_name() if for_doctor else "Dr. " + appointment.doctor.get_full_name()}
Reason: {appointment.reason or 'General Consultation'}

This event was automatically created by HMS.
                """.strip(),
                'start': {
                    'dateTime': start_datetime.isoformat(),
                    'timeZone': str(tz),
                },
                'end': {
                    'dateTime': end_datetime.isoformat(),
                    'timeZone': str(tz),
                },
                'attendees': [
                    {'email': attendee_email},
                ],
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                        {'method': 'popup', 'minutes': 30},  # 30 minutes before
                    ],
                },
            }
            
            created_event = service.events().insert(
                calendarId='primary',
                body=event,
                sendUpdates='all'
            ).execute()
            
            return created_event
        
        except HttpError as e:
            print(f"Google Calendar API error: {e}")
            return None
        except Exception as e:
            print(f"Error creating calendar event: {e}")
            return None
    
    def delete_event(self, user, event_id):
        """Delete a calendar event."""
        credentials = self.get_credentials(user)
        if not credentials or not event_id:
            return False
        
        try:
            service = build('calendar', 'v3', credentials=credentials)
            service.events().delete(
                calendarId='primary',
                eventId=event_id,
                sendUpdates='all'
            ).execute()
            return True
        except HttpError as e:
            print(f"Error deleting event: {e}")
            return False
