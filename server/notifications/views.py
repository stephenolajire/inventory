# notifications/views.py

import logging

from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework import status, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsAdmin

from .models import Notification
from .serializers import (
    NotificationListSerializer,
    NotificationDetailSerializer,
    UnreadCountSerializer,
    AdminBroadcastSerializer,
)

logger = logging.getLogger(__name__)
User   = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# Vendor Notification ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    """
    Notification feed for the authenticated user.

    GET    /api/notifications/                    — list all notifications
    GET    /api/notifications/{id}/               — single notification detail
    PATCH  /api/notifications/{id}/read/          — mark single as read
    POST   /api/notifications/read-all/           — mark all as read
    DELETE /api/notifications/{id}/               — delete a notification
    DELETE /api/notifications/clear/              — delete all notifications
    GET    /api/notifications/unread-count/       — unread badge count
    GET    /api/notifications/preferences/        — get notification preferences
    """

    permission_classes = [IsAuthenticated]
    serializer_class   = NotificationListSerializer

    def get_queryset(self):
        qs = (
            Notification.objects
            .filter(recipient=self.request.user)
            .order_by("-created_at")
        )

        notification_type = self.request.query_params.get("type")
        is_read           = self.request.query_params.get("is_read")

        if notification_type:
            qs = qs.filter(notification_type=notification_type)

        if is_read is not None:
            if is_read.lower() in ["true", "1"]:
                qs = qs.filter(is_read=True)
            elif is_read.lower() in ["false", "0"]:
                qs = qs.filter(is_read=False)

        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return NotificationDetailSerializer
        return NotificationListSerializer

    # ── List ──

    @extend_schema(
        summary="List all notifications for the authenticated user",
        parameters=[
            OpenApiParameter(
                "type",
                description="Filter by notification type",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                "is_read",
                description="Filter by read status: true or false",
                required=False,
                type=str,
            ),
        ],
        responses={200: NotificationListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = NotificationListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = NotificationListSerializer(qs, many=True)
        return Response(
            {
                "success": True,
                "count":   qs.count(),
                "data":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Retrieve single ──

    @extend_schema(
        summary="Get single notification detail",
        responses={200: NotificationDetailSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        notification = self.get_object()

        # ── Auto-mark as read when opened ──
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=["is_read", "read_at"])

        serializer = NotificationDetailSerializer(notification)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Mark single as read ──

    @extend_schema(
        summary="Mark a single notification as read",
        responses={200: NotificationDetailSerializer},
    )
    @action(detail=True, methods=["patch"], url_path="read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()

        if notification.is_read:
            return Response(
                {
                    "success": True,
                    "message": "Notification is already marked as read.",
                    "data":    NotificationDetailSerializer(notification).data,
                },
                status=status.HTTP_200_OK,
            )

        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["is_read", "read_at"])

        logger.info(
            "NotificationViewSet.mark_read — marked | id=%s | user=%s",
            notification.id,
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": "Notification marked as read.",
                "data":    NotificationDetailSerializer(notification).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Mark all as read ──

    @extend_schema(
        summary="Mark all notifications as read",
        responses={200: {"description": "All notifications marked as read."}},
    )
    @action(detail=False, methods=["post"], url_path="read-all")
    def mark_all_read(self, request):
        updated = Notification.objects.filter(
            recipient = request.user,
            is_read   = False,
        ).update(
            is_read = True,
            read_at = timezone.now(),
        )

        logger.info(
            "NotificationViewSet.mark_all_read — marked %d | user=%s",
            updated,
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": f"{updated} notification(s) marked as read.",
                "updated": updated,
            },
            status=status.HTTP_200_OK,
        )

    # ── Delete single ──

    @extend_schema(summary="Delete a single notification")
    def destroy(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.delete()

        return Response(
            {"success": True, "message": "Notification deleted."},
            status=status.HTTP_200_OK,
        )

    # ── Clear all ──

    @extend_schema(
        summary="Delete all notifications for the authenticated user",
        responses={200: {"description": "All notifications deleted."}},
    )
    @action(detail=False, methods=["delete"], url_path="clear")
    def clear_all(self, request):
        deleted_count, _ = Notification.objects.filter(
            recipient=request.user
        ).delete()

        logger.info(
            "NotificationViewSet.clear_all — deleted %d | user=%s",
            deleted_count,
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": f"{deleted_count} notification(s) deleted.",
                "deleted": deleted_count,
            },
            status=status.HTTP_200_OK,
        )

    # ── Unread count ──

    @extend_schema(
        summary="Get unread notification count for the bell badge",
        responses={200: UnreadCountSerializer},
    )
    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = Notification.objects.filter(
            recipient = request.user,
            is_read   = False,
        ).count()

        serializer = UnreadCountSerializer({"unread_count": count})
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Notification preferences ──

    @extend_schema(
        summary="Get notification type counts and preferences overview",
        responses={200: {"description": "Notification preferences overview."}},
    )
    @action(detail=False, methods=["get"], url_path="preferences")
    def preferences(self, request):
        """
        Returns a summary of unread counts per notification type.
        The frontend uses this to show per-category badge counts
        on the notification settings page.
        """
        from django.db.models import Count

        type_counts = (
            Notification.objects
            .filter(
                recipient = request.user,
                is_read   = False,
            )
            .values("notification_type")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        total_unread = Notification.objects.filter(
            recipient = request.user,
            is_read   = False,
        ).count()

        total_all = Notification.objects.filter(
            recipient=request.user
        ).count()

        return Response(
            {
                "success": True,
                "data": {
                    "total_unread": total_unread,
                    "total_all":    total_all,
                    "by_type": [
                        {
                            "type":  r["notification_type"],
                            "count": r["count"],
                        }
                        for r in type_counts
                    ],
                },
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Admin Notification ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class AdminNotificationViewSet(GenericViewSet):
    """
    Admin notification management.

    POST  /api/notifications/admin/broadcast/         — broadcast to all vendors
    POST  /api/notifications/admin/broadcast/{id}/    — send to a specific vendor
    GET   /api/notifications/admin/stats/             — platform notification stats
    DELETE /api/notifications/admin/cleanup/          — delete old read notifications
    """

    permission_classes = [IsAdmin]

    # ── Broadcast to all vendors ──

    @extend_schema(
        summary="Broadcast a notification to all vendors or a specific vendor",
        request=AdminBroadcastSerializer,
        responses={201: {"description": "Notification sent."}},
    )
    @action(detail=False, methods=["post"], url_path="broadcast")
    def broadcast(self, request):
        serializer = AdminBroadcastSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        title      = serializer.validated_data["title"]
        message    = serializer.validated_data["message"]
        channel    = serializer.validated_data["channel"]
        vendor_id  = serializer.validated_data.get("vendor_id")
        action_url = serializer.validated_data.get("action_url", "")

        if vendor_id:
            # ── Single vendor ──
            try:
                vendor = User.objects.get(id=vendor_id, role="vendor")
            except User.DoesNotExist:
                return Response(
                    {"success": False, "message": "Vendor not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            Notification.objects.create(
                recipient         = vendor,
                notification_type = Notification.NotificationType.SYSTEM,
                title             = title,
                message           = message,
                channel           = channel,
                action_url        = action_url,
            )

            # ── Queue email if channel includes email ──
            if channel in [
                Notification.Channel.EMAIL,
                Notification.Channel.BOTH,
            ]:
                from notifications.tasks import send_notification_email
                send_notification_email.delay(
                    str(vendor.id),
                    title,
                    message,
                )

            logger.info(
                "AdminNotificationViewSet.broadcast — sent to vendor=%s | admin=%s",
                vendor.email,
                request.user.email,
            )

            return Response(
                {
                    "success": True,
                    "message": f"Notification sent to {vendor.email}.",
                    "sent_to": 1,
                },
                status=status.HTTP_201_CREATED,
            )

        # ── All approved vendors ──
        vendors = User.objects.filter(
            role   = "vendor",
            status = "approved",
        )

        if not vendors.exists():
            return Response(
                {
                    "success": False,
                    "message": "No approved vendors found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        notifications = [
            Notification(
                recipient         = vendor,
                notification_type = Notification.NotificationType.SYSTEM,
                title             = title,
                message           = message,
                channel           = channel,
                action_url        = action_url,
            )
            for vendor in vendors
        ]
        Notification.objects.bulk_create(notifications)

        # ── Queue emails if channel includes email ──
        if channel in [
            Notification.Channel.EMAIL,
            Notification.Channel.BOTH,
        ]:
            from notifications.tasks import send_bulk_notification_email
            recipient_list = [
                {
                    "to":      vendor.email,
                    "context": {
                        "first_name": vendor.email.split("@")[0],
                        "title":      title,
                        "message":    message,
                    },
                }
                for vendor in vendors
            ]
            send_bulk_notification_email.delay(recipient_list)

        sent_to = vendors.count()

        logger.info(
            "AdminNotificationViewSet.broadcast — sent to %d vendors | admin=%s",
            sent_to,
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": f"Notification broadcast to {sent_to} vendor(s).",
                "sent_to": sent_to,
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Platform stats ──

    @extend_schema(
        summary="Platform notification statistics (admin only)",
        responses={200: {"description": "Notification stats."}},
    )
    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        from django.db.models import Count

        total       = Notification.objects.count()
        total_unread = Notification.objects.filter(is_read=False).count()
        total_read   = Notification.objects.filter(is_read=True).count()

        by_type = (
            Notification.objects
            .values("notification_type")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        by_channel = (
            Notification.objects
            .values("channel")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        email_sent   = Notification.objects.filter(email_sent=True).count()
        email_unsent = Notification.objects.filter(
            channel__in = [
                Notification.Channel.EMAIL,
                Notification.Channel.BOTH,
            ],
            email_sent = False,
        ).count()

        return Response(
            {
                "success": True,
                "data": {
                    "total":         total,
                    "total_unread":  total_unread,
                    "total_read":    total_read,
                    "email_sent":    email_sent,
                    "email_pending": email_unsent,
                    "by_type": [
                        {"type": r["notification_type"], "count": r["count"]}
                        for r in by_type
                    ],
                    "by_channel": [
                        {"channel": r["channel"], "count": r["count"]}
                        for r in by_channel
                    ],
                },
            },
            status=status.HTTP_200_OK,
        )

    # ── Cleanup old notifications ──

    @extend_schema(
        summary="Delete old read notifications (admin only)",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "days_old": {
                        "type":        "integer",
                        "description": "Delete read notifications older than this many days (default 90)",
                    }
                },
            }
        },
        responses={200: {"description": "Cleanup result."}},
    )
    @action(detail=False, methods=["delete"], url_path="cleanup")
    def cleanup(self, request):
        days_old = int(request.data.get("days_old", 90))

        if days_old < 30:
            return Response(
                {
                    "success": False,
                    "message": "Minimum cleanup threshold is 30 days.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cutoff = timezone.now() - timezone.timedelta(days=days_old)

        deleted_count, _ = Notification.objects.filter(
            is_read    = True,
            created_at__lt = cutoff,
        ).delete()

        logger.info(
            "AdminNotificationViewSet.cleanup — deleted %d notifications "
            "older than %d days | admin=%s",
            deleted_count,
            days_old,
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": (
                    f"Deleted {deleted_count} read notification(s) "
                    f"older than {days_old} days."
                ),
                "deleted": deleted_count,
            },
            status=status.HTTP_200_OK,
        )