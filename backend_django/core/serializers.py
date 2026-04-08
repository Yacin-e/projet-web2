from django.utils import timezone
from rest_framework import serializers

from core.models import Event, Participant, Registration


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = ["id", "first_name", "last_name", "email", "phone", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["id", "title", "description", "start_at", "end_at", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        start_at = attrs.get("start_at", getattr(self.instance, "start_at", None))
        end_at = attrs.get("end_at", getattr(self.instance, "end_at", None))
        if start_at and end_at and end_at <= start_at:
            raise serializers.ValidationError({"end_at": "end_at must be after start_at."})
        if start_at and start_at < timezone.now() - timezone.timedelta(days=365 * 50):
            raise serializers.ValidationError({"start_at": "start_at looks too far in the past."})
        return attrs


class RegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = ["id", "event", "participant", "registered_at"]
        read_only_fields = ["id", "registered_at"]

    def validate(self, attrs):
        event = attrs.get("event", getattr(self.instance, "event", None))
        participant = attrs.get("participant", getattr(self.instance, "participant", None))
        if event and participant:
            exists = Registration.objects.filter(event=event, participant=participant)
            if self.instance:
                exists = exists.exclude(pk=self.instance.pk)
            if exists.exists():
                raise serializers.ValidationError("This participant is already registered for this event.")
        return attrs


class EventDetailsSerializer(EventSerializer):
    participants = serializers.SerializerMethodField()

    class Meta(EventSerializer.Meta):
        fields = EventSerializer.Meta.fields + ["participants"]

    def get_participants(self, obj):
        qs = Participant.objects.filter(registrations__event=obj).distinct()
        return ParticipantSerializer(qs, many=True).data

