"""
URL configuration for hms_project project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # calendar_integration stays template/redirect-based even after the
    # React migration — Google's OAuth flow needs a real browser redirect,
    # not a JWT fetch call.
    path('calendar/', include('calendar_integration.urls')),
    # JSON API for the React frontend
    path('api/accounts/', include('accounts.urls')),
    path('api/doctors/', include('doctors.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/calendar/', include('calendar_integration.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
