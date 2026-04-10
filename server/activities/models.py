"""
apps/activities/models.py
==========================
Activity/Audit log model to track all user actions across the application.

This model records every significant action users perform, including:
- Creating resources (products, users, etc.)
- Updating resources
- Deleting resources
- Viewing sensitive information
- Administrative actions

Index strategy:
  - user + created_at: composite (activity feed — newest first)
  - action_type: indexed (filter by action type)
  - content_type + object_id: composite (track changes to specific object)
  - created_at: indexed (time-based queries)
"""

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class Activity(TimeStampedModel):
    """
    Records user activities across all apps.
    Uses GenericForeignKey to link to any model in the system.
    """

    class ActionType(models.TextChoices):
        # Generic actions
        CREATE = "create", _("Created")
        UPDATE = "update", _("Updated")
        DELETE = "delete", _("Deleted")
        VIEW = "view", _("Viewed")
        RESTORE = "restore", _("Restored")

        # User-specific actions
        LOGIN = "login", _("Logged In")
        LOGOUT = "logout", _("Logged Out")
        PASSWORD_CHANGED = "password_changed", _("Changed Password")
        PROFILE_UPDATED = "profile_updated", _("Updated Profile")

        # Product actions
        PRODUCT_UPLOADED = "product_uploaded", _("Uploaded Product")
        PRODUCT_APPROVED = "product_approved", _("Approved Product")
        PRODUCT_REJECTED = "product_rejected", _("Rejected Product")
        STOCK_UPDATED = "stock_updated", _("Updated Stock")

        # Sales actions
        ORDER_CREATED = "order_created", _("Created Order")
        ORDER_CONFIRMED = "order_confirmed", _("Confirmed Order")
        ORDER_SHIPPED = "order_shipped", _("Shipped Order")
        ORDER_DELIVERED = "order_delivered", _("Delivered Order")
        ORDER_CANCELLED = "order_cancelled", _("Cancelled Order")
        REFUND_REQUESTED = "refund_requested", _("Requested Refund")
        REFUND_APPROVED = "refund_approved", _("Approved Refund")

        # Subscription actions
        SUBSCRIPTION_CREATED = "subscription_created", _("Created Subscription")
        SUBSCRIPTION_UPGRADED = "subscription_upgraded", _("Upgraded Subscription")
        SUBSCRIPTION_DOWNGRADED = "subscription_downgraded", _("Downgraded Subscription")
        SUBSCRIPTION_CANCELLED = "subscription_cancelled", _("Cancelled Subscription")
        SUBSCRIPTION_RENEWED = "subscription_renewed", _("Renewed Subscription")

        # Payment actions
        PAYMENT_PROCESSED = "payment_processed", _("Processed Payment")
        PAYMENT_FAILED = "payment_failed", _("Failed Payment")
        PAYMENT_REFUNDED = "payment_refunded", _("Refunded Payment")

        # Admin actions
        USER_APPROVED = "user_approved", _("Approved User")
        USER_REJECTED = "user_rejected", _("Rejected User")
        USER_SUSPENDED = "user_suspended", _("Suspended User")
        USER_UNSUSPENDED = "user_unsuspended", _("Unsuspended User")

        # Analytics
        REPORT_GENERATED = "report_generated", _("Generated Report")
        EXPORT_CREATED = "export_created", _("Created Export")

    # User who performed the action
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activities",
        db_index=True,
    )

    # Type of action performed
    action_type = models.CharField(
        max_length=50,
        choices=ActionType.choices,
        db_index=True,
    )

    # Description of what was done
    description = models.TextField(
        blank=True,
        help_text="Human-readable description of the activity",
    )

    # Generic relation to the affected object
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    object_id = models.CharField(max_length=255, null=True, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")

    # IP address and user agent for security audit
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    # Additional metadata (stored as JSON)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional data related to the activity",
    )

    class Meta:
        db_table = "activity_log"
        verbose_name = _("Activity")
        verbose_name_plural = _("Activities")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["action_type"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} - {self.get_action_type_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
