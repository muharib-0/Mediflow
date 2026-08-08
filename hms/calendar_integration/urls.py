from django.urls import path

from .views import CalendarStatusView



urlpatterns = [
    path('status/', CalendarStatusView.as_view(), name='status'),
]
