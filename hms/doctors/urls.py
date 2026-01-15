"""
URL configuration for doctors app.
"""
from django.urls import path
from . import views

app_name = 'doctors'

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
    path('profile/setup/', views.profile_setup, name='profile_setup'),
    path('availability/', views.availability_list, name='availability_list'),
    path('availability/add/', views.add_availability, name='add_availability'),
    path('availability/bulk-add/', views.bulk_add_availability, name='bulk_add_availability'),
    path('availability/<int:slot_id>/delete/', views.delete_availability, name='delete_availability'),
    path('appointments/', views.my_appointments, name='my_appointments'),
]
