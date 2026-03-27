"""
apps/notifications/serializers.py
===================================
Notifications are created by the system and Celery tasks.
The only write operations from the client are mark-as-read and delete.
"""

from rest_framework import serializers

from .models import Notification


class NotificationListSerializer(serializers.ModelSerializer):
    """
    Used in: GET /api/notifications/
    One row per notification in the feed dropdown.
    """

    class Meta:
        model  = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "is_read",
            "action_url",
            "created_at",
        ]


class NotificationDetailSerializer(serializers.ModelSerializer):
    """
    Used in: GET /api/notifications/{id}/
    """

    class Meta:
        model  = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "channel",
            "is_read",
            "read_at",
            "related_object_type",
            "related_object_id",
            "action_url",
            "created_at",
        ]


class UnreadCountSerializer(serializers.Serializer):
    """
    Used in: GET /api/notifications/unread-count/
    Single integer for the notification bell badge.
    """

    unread_count = serializers.IntegerField(read_only=True)


class AdminBroadcastSerializer(serializers.Serializer):
    """
    Used in: POST /api/admin/notifications/broadcast/
    Omit vendor_id to broadcast to all vendors.
    """

    title      = serializers.CharField(max_length=255)
    message    = serializers.CharField()
    channel    = serializers.ChoiceField(
        choices=Notification.Channel.choices,
        default=Notification.Channel.IN_APP,
    )
    vendor_id  = serializers.UUIDField(
        required=False,
        allow_null=True,
    )
    action_url = serializers.CharField(
        max_length=255,
        required=False,
        default="",
    )