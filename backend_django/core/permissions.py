from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsEditorOrAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return False

        role = getattr(getattr(user, "profile", None), "role", None)
        return role in ("admin", "editor") or user.is_superuser

