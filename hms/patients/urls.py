"""
URL configuration for patients app.
"""
from django.urls import path
from . import views

app_name = 'patients'

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
    path('profile/setup/', views.profile_setup, name='profile_setup'),
    path('doctors/', views.browse_doctors, name='browse_doctors'),
    path('doctors/<int:doctor_id>/', views.doctor_detail, name='doctor_detail'),
    path('appointments/', views.my_appointments, name='my_appointments'),
]
