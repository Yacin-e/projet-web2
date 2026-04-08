from django.contrib import admin

from core.models import Event, Participant, Registration, UserProfile


class RegistrationInline(admin.TabularInline):
    model = Registration
    extra = 0
    autocomplete_fields = ["participant"]


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ["title", "start_at", "end_at", "status", "updated_at"]
    list_filter = ["status"]
    search_fields = ["title", "description"]
    inlines = [RegistrationInline]


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ["last_name", "first_name", "email", "updated_at"]
    search_fields = ["first_name", "last_name", "email"]


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ["event", "participant", "registered_at"]
    search_fields = ["event__title", "participant__email"]
    autocomplete_fields = ["event", "participant"]


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "role"]
    list_filter = ["role"]
    search_fields = ["user__username", "user__email"]

