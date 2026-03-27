# apps/notifications/admin.py

from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = [
        "title", "get_recipient_email",
        "notification_type", "channel",
        "is_read", "email_sent", "created_at",
    ]
    list_filter   = [
        "notification_type", "channel",
        "is_read", "email_sent",
    ]
    search_fields = ["recipient__email", "title", "message"]
    ordering      = ["-created_at"]
    date_hierarchy = "created_at"
    readonly_fields = [
        "id", "recipient", "notification_type",
        "title", "message", "channel",
        "is_read", "read_at",
        "email_sent", "email_sent_at",
        "related_object_type", "related_object_id",
        "action_url", "created_at", "updated_at",
    ]

    def get_recipient_email(self, obj):
        return obj.recipient.email
    get_recipient_email.short_description = "Recipient"
    get_recipient_email.admin_order_field = "recipient__email"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False