"""API views for Google Calendar integration."""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class CalendarStatusView(APIView):
    """GET /api/calendar/status/ -> { "connected": true|false }"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'connected': request.user.has_google_calendar_connected})
