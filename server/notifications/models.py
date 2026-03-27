"""
apps/notifications/models.py
=============================
In-app notification feed for vendors and admins.

notification_type drives both the icon rendered on the frontend
and the email template used when channel includes email.

Index strategy:
  - recipient + is_read: composite (unread feed — hot path)
  - recipient + created_at: composite (feed sorted newest first)
  - notification_type + recipient: composite (filter by type)
  - related_object_type + related_object_id: composite
    (look up notifications for a specific object)
"""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class Notification(TimeStampedModel):

    class NotificationType(models.TextChoices):
        ACCOUNT_APPROVED         = "account_approved",         _("Account Approved")
        ACCOUNT_REJECTED         = "account_rejected",         _("Account Rejected")
        ACCOUNT_SUSPENDED        = "account_suspended",        _("Account Suspended")
        SUBSCRIPTION_ACTIVATED   = "subscription_activated",   _("Subscription Activated")
        SUBSCRIPTION_RENEWAL     = "subscription_renewal",     _("Subscription Renewal Reminder")
        SUBSCRIPTION_EXPIRED     = "subscription_expired",     _("Subscription Expired")
        SUBSCRIPTION_CANCELLED   = "subscription_cancelled",   _("Subscription Cancelled")
        PLAN_UPGRADED            = "plan_upgraded",            _("Plan Upgraded")
        PLAN_DOWNGRADE_SCHEDULED = "plan_downgrade_scheduled", _("Plan Downgrade Scheduled")
        PRODUCT_READY            = "product_ready",            _("Product Ready")
        PRODUCT_FAILED           = "product_failed",           _("Product Processing Failed")
        LOW_STOCK                = "low_stock",                _("Low Stock Alert")
        DAILY_SUMMARY            = "daily_summary",            _("Daily Sales Summary")
        NEW_VENDOR               = "new_vendor",               _("New Vendor Application")
        SYSTEM                   = "system",                   _("System Message")

    class Channel(models.TextChoices):
        IN_APP = "in_app", _("In-App Only")
        EMAIL  = "email",  _("Email Only")
        BOTH   = "both",   _("In-App and Email")

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        db_index=True,
    )
    notification_type = models.CharField(
        max_length=40,
        choices=NotificationType.choices,
        db_index=True,
    )
    title   = models.CharField(max_length=255)
    message = models.TextField()
    channel = models.CharField(
        max_length=10,
        choices=Channel.choices,
        default=Channel.IN_APP,
    )
    is_read       = models.BooleanField(default=False, db_index=True)
    read_at       = models.DateTimeField(null=True, blank=True)
    email_sent    = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)

    related_object_type = models.CharField(
        max_length=50, blank=True, db_index=True,
    )
    related_object_id = models.UUIDField(
        null=True, blank=True, db_index=True,
    )
    action_url = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table            = "notification"
        verbose_name        = _("Notification")
        verbose_name_plural = _("Notifications")
        ordering            = ["-created_at"]
        indexes = [
            models.Index(
                fields=["recipient", "is_read"],
                name="idx_notif_recipient_read",
            ),
            models.Index(
                fields=["recipient", "created_at"],
                name="idx_notif_recipient_created",
            ),
            models.Index(
                fields=["notification_type", "recipient"],
                name="idx_notif_type_recipient",
            ),
            models.Index(
                fields=["related_object_type", "related_object_id"],
                name="idx_notif_related_object",
            ),
        ]

    def __str__(self) -> str:
        state = "read" if self.is_read else "unread"
        return f"{self.notification_type} → {self.recipient.email} ({state})"