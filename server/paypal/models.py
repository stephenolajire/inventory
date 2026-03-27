"""
apps/paypal/models.py
======================
Stores PayPal-specific payment records and subscription references.
Designed to live alongside the existing Stripe-based subscriptions app
without touching any of its models.

Models:
  PayPalOrder       — one-time payment record (plan activation, upgrade proration).
  PayPalSubscription — recurring PayPal subscription record linked to a vendor.
  PayPalWebhookEvent — idempotency log for incoming PayPal webhook events.

Index strategy:
  PayPalOrder:
    - vendor + status: composite (dashboard lookup)
    - paypal_order_id: db_index (capture & webhook lookup)

  PayPalSubscription:
    - vendor + status: composite (find active PayPal sub)
    - paypal_sub_id: db_index (webhook lookup)

  PayPalWebhookEvent:
    - event_id: unique (idempotency guard)
"""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class PayPalOrder(TimeStampedModel):
    """
    Represents a single PayPal Order used for:
      - First-time plan activation (paid plans)
      - Prorated upgrade charges

    Lifecycle:
      CREATED  → order created on PayPal, awaiting buyer approval
      APPROVED → buyer approved on PayPal JS SDK, awaiting backend capture
      COMPLETED → captured successfully, subscription activated
      FAILED   → capture failed
      VOIDED   → order cancelled before capture
    """

    class OrderStatus(models.TextChoices):
        CREATED   = "CREATED",   _("Created")
        APPROVED  = "APPROVED",  _("Approved")
        COMPLETED = "COMPLETED", _("Completed")
        FAILED    = "FAILED",    _("Failed")
        VOIDED    = "VOIDED",    _("Voided")

    class Intent(models.TextChoices):
        ACTIVATION = "activation", _("Plan Activation")
        UPGRADE    = "upgrade",    _("Plan Upgrade")

    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="paypal_orders",
        limit_choices_to={"role": "vendor"},
    )
    # FK to VendorSubscription — nullable because the subscription is
    # created/updated *after* a successful capture.
    vendor_subscription = models.ForeignKey(
        "subscriptions.VendorSubscription",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="paypal_orders",
    )
    paypal_order_id = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text=_("The id returned by PayPal Orders API on creation."),
    )
    intent = models.CharField(
        max_length=20,
        choices=Intent.choices,
        default=Intent.ACTIVATION,
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text=_("Amount in the order currency."),
    )
    currency = models.CharField(
        max_length=3,
        default="NGN",
        help_text=_("ISO 4217 currency code."),
    )
    status = models.CharField(
        max_length=15,
        choices=OrderStatus.choices,
        default=OrderStatus.CREATED,
        db_index=True,
    )
    capture_id = models.CharField(
        max_length=64,
        blank=True,
        help_text=_("PayPal capture ID returned after a successful capture."),
    )
    raw_response = models.JSONField(
        blank=True,
        null=True,
        help_text=_("Full PayPal API response stored for audit/debugging."),
    )

    class Meta:
        db_table            = "paypal_order"
        verbose_name        = _("PayPal Order")
        verbose_name_plural = _("PayPal Orders")
        ordering            = ["-created_at"]
        indexes = [
            models.Index(
                fields=["vendor", "status"],
                name="idx_paypal_order_vendor_status",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.vendor.email} — {self.paypal_order_id} ({self.status})"


class PayPalSubscription(TimeStampedModel):
    """
    Represents a PayPal Billing Subscription (recurring).
    Created when the vendor chooses a recurring PayPal plan instead of
    a one-time payment.

    Mirrors the lifecycle exposed by PayPal's Subscriptions API:
      APPROVAL_PENDING → APPROVED → ACTIVE → SUSPENDED → CANCELLED → EXPIRED
    """

    class SubStatus(models.TextChoices):
        APPROVAL_PENDING = "APPROVAL_PENDING", _("Approval Pending")
        APPROVED         = "APPROVED",         _("Approved")
        ACTIVE           = "ACTIVE",           _("Active")
        SUSPENDED        = "SUSPENDED",        _("Suspended")
        CANCELLED        = "CANCELLED",        _("Cancelled")
        EXPIRED          = "EXPIRED",          _("Expired")

    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="paypal_subscriptions",
        limit_choices_to={"role": "vendor"},
    )
    vendor_subscription = models.OneToOneField(
        "subscriptions.VendorSubscription",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="paypal_subscription",
    )
    paypal_sub_id = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text=_("PayPal subscription ID (e.g. I-XXXXXXXXX)."),
    )
    paypal_plan_id = models.CharField(
        max_length=64,
        blank=True,
        help_text=_("PayPal billing plan ID this subscription is linked to."),
    )
    status = models.CharField(
        max_length=20,
        choices=SubStatus.choices,
        default=SubStatus.APPROVAL_PENDING,
        db_index=True,
    )
    next_billing_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_("Next scheduled billing date from PayPal."),
    )
    last_payment_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    last_payment_time = models.DateTimeField(null=True, blank=True)
    raw_response = models.JSONField(
        blank=True,
        null=True,
        help_text=_("Latest PayPal subscription object for audit/debugging."),
    )

    class Meta:
        db_table            = "paypal_subscription"
        verbose_name        = _("PayPal Subscription")
        verbose_name_plural = _("PayPal Subscriptions")
        ordering            = ["-created_at"]
        indexes = [
            models.Index(
                fields=["vendor", "status"],
                name="idx_paypal_sub_vendor_status",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.vendor.email} — {self.paypal_sub_id} ({self.status})"


class PayPalWebhookEvent(TimeStampedModel):
    """
    Idempotency log for PayPal webhook events.
    Every inbound event is recorded here before processing.
    Duplicate event_ids are rejected (unique constraint).
    """

    class ProcessingStatus(models.TextChoices):
        RECEIVED  = "received",  _("Received")
        PROCESSED = "processed", _("Processed")
        IGNORED   = "ignored",   _("Ignored")
        FAILED    = "failed",    _("Failed")

    event_id = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text=_("PayPal webhook event ID — used for deduplication."),
    )
    event_type = models.CharField(
        max_length=64,
        help_text=_("e.g. PAYMENT.CAPTURE.COMPLETED"),
    )
    resource_type = models.CharField(
        max_length=64,
        blank=True,
        help_text=_("e.g. capture, subscription"),
    )
    resource_id = models.CharField(
        max_length=64,
        blank=True,
        help_text=_("ID of the PayPal resource involved."),
    )
    processing_status = models.CharField(
        max_length=15,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.RECEIVED,
        db_index=True,
    )
    payload = models.JSONField(
        help_text=_("Full webhook payload stored for audit/replay."),
    )
    failure_reason = models.TextField(
        blank=True,
        help_text=_("Error message if processing failed."),
    )

    class Meta:
        db_table            = "paypal_webhook_event"
        verbose_name        = _("PayPal Webhook Event")
        verbose_name_plural = _("PayPal Webhook Events")
        ordering            = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.event_type} — {self.event_id} ({self.processing_status})"