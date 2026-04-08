from django.db.models import Count
from django.utils.dateparse import parse_datetime
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Event, Participant, Registration, UserRole
from core.permissions import IsEditorOrAdminOrReadOnly
from core.serializers import (
    EventDetailsSerializer,
    EventSerializer,
    ParticipantSerializer,
    RegistrationSerializer,
)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsEditorOrAdminOrReadOnly]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return EventDetailsSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        qs = super().get_queryset()

        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)

        date_from = self.request.query_params.get("date_from")
        if date_from:
            dt = parse_datetime(date_from)
            if dt:
                qs = qs.filter(start_at__gte=dt)

        date_to = self.request.query_params.get("date_to")
        if date_to:
            dt = parse_datetime(date_to)
            if dt:
                qs = qs.filter(start_at__lte=dt)

        return qs


class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer
    permission_classes = [IsEditorOrAdminOrReadOnly]


class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.select_related("event", "participant").all()
    serializer_class = RegistrationSerializer
    permission_classes = [IsEditorOrAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        event_id = self.request.query_params.get("event")
        participant_id = self.request.query_params.get("participant")
        if event_id:
            qs = qs.filter(event_id=event_id)
        if participant_id:
            qs = qs.filter(participant_id=participant_id)
        return qs


class DashboardView(APIView):
    def get(self, request):
        events = Event.objects.count()
        participants = Participant.objects.count()
        registrations = Registration.objects.count()

        by_status = (
            Event.objects.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )

        return Response(
            {
                "events": events,
                "participants": participants,
                "registrations": registrations,
                "events_by_status": list(by_status),
            }
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = getattr(getattr(user, "profile", None), "role", None) or (
            UserRole.ADMIN if getattr(user, "is_superuser", False) else UserRole.VIEWER
        )
        return Response(
            {
                "username": user.username,
                "is_superuser": bool(getattr(user, "is_superuser", False)),
                "role": role,
            }
        )

