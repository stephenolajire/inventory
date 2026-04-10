"""
apps/activities/views.py
"""

import logging
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsAdmin
from .models import Activity
from .serializers import ActivityListSerializer, ActivityDetailSerializer

logger = logging.getLogger(__name__)


class ActivityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing activity logs.

    Provides endpoints to:
    - List all activities (paginated, filterable, searchable)
    - Retrieve a specific activity
    - Filter by user, action type, date range
    - Search by description
    """

    queryset = Activity.objects.select_related("user", "content_type")
    serializer_class = ActivityListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = [
        "user",
        "action_type",
        "content_type",
        "created_at",
    ]
    search_fields = [
        "description",
        "user__email",
        "user__first_name",
        "user__last_name",
    ]
    ordering_fields = ["-created_at", "user", "action_type"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Use detailed serializer for retrieve action."""
        if self.action == "retrieve":
            return ActivityDetailSerializer
        return ActivityListSerializer

    def get_queryset(self):
        """Filter activities based on user role."""
        user = self.request.user

        # Admins can see all activities
        if user.is_staff:
            return Activity.objects.select_related("user", "content_type")

        # Regular users can only see their own activities
        return Activity.objects.filter(user=user).select_related("user", "content_type")

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="user",
                description="Filter by user ID",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="action_type",
                description="Filter by action type",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="search",
                description="Search in description and user email",
                required=False,
                type=str,
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        """List activities with filters and search."""
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific activity."""
        instance = self.get_object()

        # Users can only view their own activities
        if not request.user.is_staff and instance.user != request.user:
            return Response(
                {"detail": "You do not have permission to view this activity."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated],
    )
    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def action_types(self, request):
        """List all available action types."""
        action_types = [
            {"value": choice[0], "display": choice[1]}
            for choice in Activity.ActionType.choices
        ]
        return Response(action_types)

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated],
    )
    def my_activities(self, request):
        """Get current user's activities."""
        activities = self.get_queryset().filter(user=request.user)
        page = self.paginate_queryset(activities)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(activities, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAdmin],
    )
    def user_activities(self, request):
        """
        Get activities for a specific user (admin only).
        Query param: user_id
        """
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response(
                {"detail": "user_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        activities = self.get_queryset().filter(user_id=user_id)
        page = self.paginate_queryset(activities)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(activities, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAdmin],
    )
    def by_action_type(self, request):
        """
        Get activities filtered by action type (admin only).
        Query param: action_type
        """
        action_type = request.query_params.get("action_type")
        if not action_type:
            return Response(
                {"detail": "action_type query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        activities = self.get_queryset().filter(action_type=action_type)
        page = self.paginate_queryset(activities)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(activities, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAdmin],
    )
    def statistics(self, request):
        """Get activity statistics (admin only)."""
        from django.db.models import Count
        from django.utils import timezone
        from datetime import timedelta

        # Activities in last 7 days
        last_7_days = timezone.now() - timedelta(days=7)
        activities_7d = Activity.objects.filter(created_at__gte=last_7_days).count()

        # Top action types
        top_actions = (
            Activity.objects.values("action_type")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        # Top users
        top_users = (
            Activity.objects.values("user__email")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        return Response(
            {
                "total_activities": Activity.objects.count(),
                "activities_last_7_days": activities_7d,
                "top_action_types": list(top_actions),
                "top_users": list(top_users),
            }
        )

    def destroy(self, request, *args, **kwargs):
        """Prevent deletion of activities (admin only)."""
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to delete activities."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(
            {"detail": "Activity logs cannot be deleted for audit purposes."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )
