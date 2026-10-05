"""
academic_calendar_views.py — Academic Calendar endpoints.

Admin (POST/PUT/PATCH/DELETE + GET):
  GET    /api/academic-calendar/                       — list all calendars
  POST   /api/academic-calendar/                       — create calendar
  GET    /api/academic-calendar/<id>/                  — retrieve calendar with events
  PUT    /api/academic-calendar/<id>/                  — full update
  PATCH  /api/academic-calendar/<id>/                  — partial update
  DELETE /api/academic-calendar/<id>/                  — delete (cascades events)
  POST   /api/academic-calendar/<id>/events/           — add event

Teacher / Student (GET only):
  GET    /api/academic-calendar/                       — list all calendars
  GET    /api/academic-calendar/<id>/                  — retrieve calendar with events
  GET    /api/academic-calendar/upcoming/              — next N upcoming events

Note: Teacher/Student POST/PUT/PATCH/DELETE → 403 Forbidden.
"""

from datetime import date
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import AcademicCalendar, AcademicEvent
from .serializers import (
    AcademicCalendarSerializer,
    AcademicCalendarListSerializer,
    AcademicEventSerializer,
)
from .admin_views import get_user_from_request, get_role


def _auth(request):
    user = get_user_from_request(request)
    if not user:
        return None, Response(
            {'msg': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return user, None


def _is_admin(user):
    if not user:
        return False
    if user.is_staff or user.is_superuser:
        return True
    return get_role(user) == 'admin'


# ─── List + Create ────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def calendar_list_create(request):
    """GET for everyone logged in; POST only for admins."""
    user, err = _auth(request)
    if err:
        return err

    if request.method == 'GET':
        qs = AcademicCalendar.objects.all().order_by('-academic_year', 'semester')
        # Optional filters
        year = request.query_params.get('academic_year')
        semester = request.query_params.get('semester')
        status_param = request.query_params.get('status')
        if year:
            qs = qs.filter(academic_year=year)
        if semester:
            qs = qs.filter(semester=semester)
        if status_param:
            qs = qs.filter(status=status_param)
        return Response(AcademicCalendarListSerializer(qs, many=True).data)

    # POST — admin only
    if not _is_admin(user):
        return Response(
            {'msg': 'Only admins can create academic calendars.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = AcademicCalendarSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(created_by=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Retrieve / Update / Delete ───────────────────────────────────────────────

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
def calendar_detail(request, calendar_id):
    user, err = _auth(request)
    if err:
        return err

    calendar = get_object_or_404(AcademicCalendar, id=calendar_id)

    if request.method == 'GET':
        return Response(AcademicCalendarSerializer(calendar).data)

    # All write ops — admin only
    if not _is_admin(user):
        return Response(
            {'msg': 'Only admins can modify academic calendars.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == 'PUT':
        serializer = AcademicCalendarSerializer(calendar, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'PATCH':
        serializer = AcademicCalendarSerializer(calendar, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        calendar.delete()  # events cascade-delete via on_delete=CASCADE
        return Response(
            {'msg': 'Calendar deleted'},
            status=status.HTTP_204_NO_CONTENT,
        )


# ─── Events (nested under calendar) ───────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def calendar_events(request, calendar_id):
    """
    GET  — list all events for a calendar (any logged-in user).
    POST — create an event (admin only).
    """
    user, err = _auth(request)
    if err:
        return err

    calendar = get_object_or_404(AcademicCalendar, id=calendar_id)

    if request.method == 'GET':
        events = calendar.events.all().order_by('date', 'start_time')
        return Response(AcademicEventSerializer(events, many=True).data)

    # POST — admin only
    if not _is_admin(user):
        return Response(
            {'msg': 'Only admins can create events.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Force the calendar FK to match the URL
    payload = request.data.copy()
    payload['calendar'] = calendar.id

    serializer = AcademicEventSerializer(data=payload)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
def calendar_event_detail(request, calendar_id, event_id):
    """
    GET    — retrieve a single event (any logged-in user).
    PUT/PATCH/DELETE — admin only.
    """
    user, err = _auth(request)
    if err:
        return err

    event = get_object_or_404(AcademicEvent, id=event_id, calendar_id=calendar_id)

    if request.method == 'GET':
        return Response(AcademicEventSerializer(event).data)

    # All write ops — admin only
    if not _is_admin(user):
        return Response(
            {'msg': 'Only admins can modify events.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == 'PUT':
        payload = request.data.copy()
        payload['calendar'] = calendar_id
        serializer = AcademicEventSerializer(event, data=payload)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'PATCH':
        payload = request.data.copy()
        payload['calendar'] = calendar_id
        serializer = AcademicEventSerializer(event, data=payload, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE
    event.delete()
    return Response({'msg': 'Event deleted'}, status=status.HTTP_204_NO_CONTENT)


# ─── Upcoming Events ──────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def upcoming_events(request):
    """
    Return the next N upcoming events (default 5).
    Query params:
      - limit   (int, default 5)
      - days    (int, optional — restrict to next N days)
    """
    user, err = _auth(request)
    if err:
        return err

    try:
        limit = int(request.query_params.get('limit', 5))
    except ValueError:
        limit = 5
    limit = max(1, min(limit, 50))

    today = date.today()
    qs = AcademicEvent.objects.filter(date__gte=today).order_by('date', 'start_time')

    days_param = request.query_params.get('days')
    if days_param:
        try:
            days = int(days_param)
            from datetime import timedelta
            qs = qs.filter(date__lte=today + timedelta(days=days))
        except ValueError:
            pass

    events = qs[:limit]
    return Response(AcademicEventSerializer(events, many=True).data)