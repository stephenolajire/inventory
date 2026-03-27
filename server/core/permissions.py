"""
apps/core/permissions.py
========================
Custom DRF permission classes used across all apps.
"""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allows access only to users with role = admin."""

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsVendor(BasePermission):
    """Allows access only to users with role = vendor."""

    message = "This endpoint is for vendors only."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "vendor"
        )


class IsApprovedVendor(BasePermission):
    """
    Allows access only to vendors whose account has been approved
    and whose subscription is active.
    """

    message = "Your account must be approved and subscription active."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role != "vendor":
            return False
        if request.user.status != "approved":
            return False
        return True


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission.
    Allows access if the requesting user owns the object
    or is an admin.
    """

    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        owner = getattr(obj, "vendor", None) or getattr(obj, "user", None)
        return owner == request.user