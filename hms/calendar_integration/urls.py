"""
URL configuration for calendar_integration app.
"""
from django.urls import path
from . import views

app_name = 'calendar'

urlpatterns = [
    path('connect/', views.connect_google_calendar, name='connect'),
    path('oauth2callback/', views.oauth2_callback, name='oauth2callback'),
    path('disconnect/', views.disconnect_google_calendar, name='disconnect'),
]
