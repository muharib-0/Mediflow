"""
URL configuration for appointments app.
"""
from django.urls import path
from . import views

app_name = 'appointments'

urlpatterns = [
    path('book/<int:slot_id>/', views.book_appointment, name='book_appointment'),
    path('<int:appointment_id>/', views.appointment_detail, name='appointment_detail'),
    path('<int:appointment_id>/cancel/', views.cancel_appointment, name='cancel_appointment'),
]
