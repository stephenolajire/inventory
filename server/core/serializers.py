"""
apps/core/serializers.py
========================
Shared serializer mixins and base classes used across every app.
"""

from rest_framework import serializers


class TimestampMixin(serializers.Serializer):
    """
    Adds read-only created_at and updated_at to any serializer
    that needs to expose timestamps on a response.
    """

    created_at = serializers.DateTimeField(read_only=True)
    updated_at  = serializers.DateTimeField(read_only=True)


class UUIDPrimaryKeyMixin(serializers.Serializer):
    """
    Exposes the UUID primary key as a read-only field.
    Keeps id consistent across all response shapes.
    """

    id = serializers.UUIDField(read_only=True)