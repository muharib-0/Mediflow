from django.urls import path

from . import api_views


urlpatterns = [
    path('', api_views.DoctorListView.as_view(), name='doctor-list'),
    path('dashboard/', api_views.DoctorDashboardView.as_view(), name='doctor-dashboard'),
    path('availability/', api_views.PublicAvailabilityListView.as_view(), name='availability-list'),
    path('me/profile/', api_views.MyDoctorProfileView.as_view(), name='my-doctor-profile'),
    path('me/availability/', api_views.MyAvailabilityListCreateView.as_view(), name='my-availability-list'),
    path('me/availability/<int:pk>/', api_views.MyAvailabilityDetailView.as_view(), name='my-availability-detail'),
    path('<int:pk>/', api_views.DoctorDetailView.as_view(), name='doctor-detail'),
]
