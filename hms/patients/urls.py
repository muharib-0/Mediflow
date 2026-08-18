from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PatientProfileViewSet,
    PatientDashboardView,
    HealthMetricViewSet,
    MedicationViewSet
)

# Create a router and register our ViewSets
router = DefaultRouter()
router.register(r'profile', PatientProfileViewSet, basename='patient-profile')
router.register(r'metrics', HealthMetricViewSet, basename='health-metrics')
router.register(r'medications', MedicationViewSet, basename='medications')

urlpatterns = [
    # 1. Authentication
    
    # 2. The single-fetch Dashboard endpoint
    path('dashboard/', PatientDashboardView.as_view(), name='api-dashboard'),
    
    # 3. Include the ViewSet routes automatically
    path('', include(router.urls)),
]