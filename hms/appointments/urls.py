from django.urls import path

from . import views



urlpatterns = [
    path('book/<int:slot_id>/',    views.BookAppointmentView.as_view(), name='book'),
    path('mine/', views.MyAppointmentsView.as_view(), name='mine'),
    path('<int:appointment_id>/patient/', views.AppointmentPatientDetailView.as_view(), name='patient-detail'),
    path('<int:pk>/', views.AppointmentDetailView.as_view(), name='detail'),
    path('<int:appointment_id>/cancel/', views.CancelAppointmentView.as_view(), name='cancel'),
]
