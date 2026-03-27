# apps/users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = [
        "email", "role", "status", "email_verified",
        "is_staff", "created_at",
    ]
    list_filter   = ["role", "status", "email_verified", "is_staff"]
    search_fields = ["email"]
    ordering      = ["-created_at"]
    readonly_fields = [
        "id", "created_at", "updated_at",
        "email_verified_at", "approved_at", "last_login",
    ]

    fieldsets = (
        (_("Identity"), {
            "fields": ("id", "email", "password"),
        }),
        (_("Role & Status"), {
            "fields": ("role", "status"),
        }),
        (_("Email Verification"), {
            "fields": ("email_verified", "email_verified_at"),
        }),
        (_("Admin Approval"), {
            "fields": ("approved_by", "approved_at"),
        }),
        (_("Permissions"), {
            "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
        }),
        (_("Timestamps"), {
            "fields": ("last_login", "created_at", "updated_at"),
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields":  ("email", "password1", "password2", "role"),
        }),
    )