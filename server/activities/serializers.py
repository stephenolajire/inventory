"""
apps/activities/serializers.py
"""

from rest_framework import serializers
from .models import Activity


class ActivityListSerializer(serializers.ModelSerializer):
    """Serializer for listing activities."""

    user_email = serializers.CharField(source="user.email", read_only=True)
    user_id = serializers.CharField(source="user.id", read_only=True)
    action_display = serializers.CharField(
        source="get_action_type_display", read_only=True
    )
    content_type_name = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = [
            "id",
            "user_id",
            "user_email",
            "action_type",
            "action_display",
            "description",
            "content_type_name",
            "object_id",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields

    def get_content_type_name(self, obj):
        """Get the model name of the related object."""
        if obj.content_type:
            return obj.content_type.model
        return None


class ActivityDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for activity with all information."""

    user_email = serializers.CharField(source="user.email", read_only=True)
    user_id = serializers.CharField(source="user.id", read_only=True)
    action_display = serializers.CharField(
        source="get_action_type_display", read_only=True
    )
    content_type_name = serializers.SerializerMethodField()
    content_type_id = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = [
            "id",
            "user_id",
            "user_email",
            "action_type",
            "action_display",
            "description",
            "content_type_id",
            "content_type_name",
            "object_id",
            "ip_address",
            "user_agent",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_content_type_name(self, obj):
        """Get the model name of the related object."""
        if obj.content_type:
            return obj.content_type.model
        return None

    def get_content_type_id(self, obj):
        """Get the content type ID."""
        if obj.content_type:
            return obj.content_type.id
        return None
