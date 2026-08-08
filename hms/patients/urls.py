from django.urls import path

from . import api_views


urlpatterns = [
    path('dashboard/', api_views.PatientDashboardView.as_view(), name='patient-dashboard'),
    path('me/profile/', api_views.MyPatientProfileView.as_view(), name='my-patient-profile'),
]
