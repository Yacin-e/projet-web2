from django.contrib import admin
from django.urls import include, path
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.auth_views import LogoutView
from core.views import (
    DashboardView,
    EventViewSet,
    MeView,
    ParticipantViewSet,
    RegistrationViewSet,
)

router = routers.DefaultRouter()
router.register(r"events", EventViewSet, basename="event")
router.register(r"participants", ParticipantViewSet, basename="participant")
router.register(r"registrations", RegistrationViewSet, basename="registration")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/logout/", LogoutView.as_view(), name="logout"),
    path("api/me/", MeView.as_view(), name="me"),
    path("api/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("api/", include(router.urls)),
]

