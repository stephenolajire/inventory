"""
apps/activities/admin.py
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Activity


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    """Admin interface for Activity logs."""

    list_display = [
        "formatted_user",
        "action_type_display",
        "description_short",
        "content_type_display",
        "created_at_formatted",
    ]
    list_filter = [
        "action_type",
        "created_at",
        "user",
    ]
    search_fields = [
        "user__email",
        "user__first_name",
        "user__last_name",
        "description",
    ]
    readonly_fields = [
        "id",
        "user",
        "action_type",
        "description",
        "content_type",
        "object_id",
        "ip_address",
        "user_agent",
        "metadata",
        "created_at",
        "updated_at",
    ]
    fieldsets = (
        (
            "Activity Information",
            {
                "fields": (
                    "id",
                    "user",
                    "action_type",
                    "description",
                )
            },
        ),
        (
            "Related Object",
            {
                "fields": (
                    "content_type",
                    "object_id",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Request Details",
            {
                "fields": (
                    "ip_address",
                    "user_agent",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Metadata",
            {
                "fields": ("metadata",),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    def has_add_permission(self, request):
        """Prevent manual addition through admin."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of activities."""
        return False

    def has_change_permission(self, request, obj=None):
        """Prevent editing of activities."""
        return False

    def formatted_user(self, obj):
        """Display user email with link."""
        return format_html(
            '<a href="{}">{}</a>',
            reverse("admin:auth_user_change", args=[obj.user.id]),
            obj.user.email,
        )

    formatted_user.short_description = "User"

    def action_type_display(self, obj):
        """Display action type with color coding."""
        colors = {
            "create": "#28a745",
            "update": "#ffc107",
            "delete": "#dc3545",
            "view": "#17a2b8",
            "login": "#007bff",
        }
        action_prefix = obj.action_type.split("_")[0]
        color = colors.get(action_prefix, "#6c757d")

        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_action_type_display(),
        )

    action_type_display.short_description = "Action"

    def description_short(self, obj):
        """Display truncated description."""
        if not obj.description:
            return "-"
        return obj.description[:50] + "..." if len(obj.description) > 50 else obj.description

    description_short.short_description = "Description"

    def content_type_display(self, obj):
        """Display content type."""
        if obj.content_type:
            return obj.content_type.model.capitalize()
        return "-"

    content_type_display.short_description = "Object Type"

    def created_at_formatted(self, obj):
        """Display formatted creation time."""
        return obj.created_at.strftime("%Y-%m-%d %H:%M:%S")

    created_at_formatted.short_description = "Created At"
