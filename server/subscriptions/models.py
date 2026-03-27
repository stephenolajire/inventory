"""
apps/subscriptions/models.py
=============================
Three models:

  SubscriptionPlan   — platform-wide plan definitions managed by admin.
                       Stored in DB so limits and prices can be updated
                       without a code deploy.

  VendorSubscription — one active subscription record per vendor.
                       History is preserved — old records are never
                       deleted, only superseded when a vendor changes plan.

  PendingPlanChange  — scheduled downgrades and cycle changes that
                       take effect at the end of the current period.

Index strategy:
  VendorSubscription:
    - vendor + status: composite (dashboard: find active plan for vendor)
    - status + current_period_end: composite (Celery Beat renewal check)
    - stripe_sub_id: db_index (Stripe webhook lookup)

  PendingPlanChange:
    - vendor + status: composite (check if vendor has a pending change)
    - effective_at: db_index (Celery Beat: find changes due today)
"""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class SubscriptionPlan(TimeStampedModel):

    class Name(models.TextChoices):
        FREE       = "free",       _("Free")
        BASIC      = "basic",      _("Basic")
        PRO        = "pro",        _("Pro")
        ENTERPRISE = "enterprise", _("Enterprise")

    name = models.CharField(
        max_length=20,
        choices=Name.choices,
        unique=True,
        db_index=True,
    )
    product_limit     = models.PositiveIntegerField(
        help_text=_("Max active products. 0 = unlimited."),
    )
    monthly_price_ngn = models.DecimalField(max_digits=10, decimal_places=2)
    yearly_price_ngn  = models.DecimalField(max_digits=10, decimal_places=2)
    has_analytics     = models.BooleanField(default=False)
    has_reports       = models.BooleanField(default=False)
    has_multi_branch  = models.BooleanField(default=False)
    is_active         = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table            = "subscription_plan"
        verbose_name        = _("Subscription Plan")
        verbose_name_plural = _("Subscription Plans")
        ordering            = ["monthly_price_ngn"]

    def __str__(self) -> str:
        return self.get_name_display()


class VendorSubscription(TimeStampedModel):

    class BillingCycle(models.TextChoices):
        MONTHLY = "monthly", _("Monthly")
        YEARLY  = "yearly",  _("Yearly")

    class Currency(models.TextChoices):
        NGN = "NGN", _("Nigerian Naira")
        USD = "USD", _("US Dollar")
        GBP = "GBP", _("British Pound")

    class Status(models.TextChoices):
        PENDING_APPROVAL = "pending_approval", _("Pending Admin Approval")
        PENDING_PAYMENT  = "pending_payment",  _("Pending Payment")
        ACTIVE           = "active",           _("Active")
        PAST_DUE         = "past_due",         _("Past Due")
        EXPIRED          = "expired",          _("Expired")
        CANCELLED        = "cancelled",        _("Cancelled")

    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
        db_index=True,
        limit_choices_to={"role": "vendor"},
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="subscriptions",
    )
    billing_cycle = models.CharField(
        max_length=10,
        choices=BillingCycle.choices,
        default=BillingCycle.MONTHLY,
    )
    currency = models.CharField(
        max_length=3,
        choices=Currency.choices,
        default=Currency.NGN,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING_APPROVAL,
        db_index=True,
    )
    amount_paid = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    stripe_sub_id = models.CharField(
        max_length=255,
        blank=True,
        db_index=True,
        help_text=_("Stripe subscription ID for recurring billing."),
    )
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end   = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table            = "vendor_subscription"
        verbose_name        = _("Vendor Subscription")
        verbose_name_plural = _("Vendor Subscriptions")
        ordering            = ["-created_at"]
        indexes = [
            models.Index(
                fields=["vendor", "status"],
                name="idx_sub_vendor_status",
            ),
            models.Index(
                fields=["status", "current_period_end"],
                name="idx_sub_status_period_end",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.vendor.email} — {self.plan.name} ({self.status})"


class PendingPlanChange(TimeStampedModel):

    class ChangeType(models.TextChoices):
        DOWNGRADE    = "downgrade",    _("Downgrade")
        CYCLE_CHANGE = "cycle_change", _("Billing Cycle Change")
        CANCELLATION = "cancellation", _("Cancellation")

    class ChangeStatus(models.TextChoices):
        SCHEDULED = "scheduled", _("Scheduled")
        APPLIED   = "applied",   _("Applied")
        CANCELLED = "cancelled", _("Cancelled")

    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pending_plan_changes",
        db_index=True,
    )
    new_plan = models.ForeignKey(
        SubscriptionPlan,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="pending_changes",
    )
    new_billing_cycle = models.CharField(
        max_length=10,
        choices=VendorSubscription.BillingCycle.choices,
        blank=True,
    )
    change_type = models.CharField(
        max_length=20,
        choices=ChangeType.choices,
    )
    change_status = models.CharField(
        max_length=15,
        choices=ChangeStatus.choices,
        default=ChangeStatus.SCHEDULED,
        db_index=True,
    )
    effective_at = models.DateTimeField(db_index=True)

    class Meta:
        db_table            = "pending_plan_change"
        verbose_name        = _("Pending Plan Change")
        verbose_name_plural = _("Pending Plan Changes")
        indexes = [
            models.Index(
                fields=["change_status", "effective_at"],
                name="idx_pending_change_status_date",
            ),
            models.Index(
                fields=["vendor", "change_status"],
                name="idx_pending_change_vendor",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.vendor.email} — {self.change_type} "
            f"@ {self.effective_at:%Y-%m-%d}"
        )


# apps/subscriptions/models.py  — add below PendingPlanChange

class PaymentRecord(TimeStampedModel):
    """
    Immutable log of every successful charge against a subscription.
    Never updated — one row per payment event.
    """

    class PaymentType(models.TextChoices):
        INITIAL  = "initial",  _("Initial Activation")
        RENEWAL  = "renewal",  _("Renewal")
        UPGRADE  = "upgrade",  _("Plan Upgrade (Prorated)")

    subscription = models.ForeignKey(
        VendorSubscription,
        on_delete=models.CASCADE,
        related_name="payment_records",
    )
    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payment_records",
        db_index=True,
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="payment_records",
        db_index=True,
    )
    payment_type   = models.CharField(max_length=20, choices=PaymentType.choices)
    amount         = models.DecimalField(max_digits=12, decimal_places=2)
    currency       = models.CharField(max_length=3, default="NGN")
    stripe_intent_id = models.CharField(max_length=255, blank=True, db_index=True)
    billing_cycle  = models.CharField(
        max_length=10,
        choices=VendorSubscription.BillingCycle.choices,
        default=VendorSubscription.BillingCycle.MONTHLY,
    )

    class Meta:
        db_table            = "subscription_payment_record"
        verbose_name        = _("Payment Record")
        verbose_name_plural = _("Payment Records")
        ordering            = ["-created_at"]
        indexes = [
            models.Index(fields=["plan", "created_at"],   name="idx_pr_plan_date"),
            models.Index(fields=["vendor", "created_at"], name="idx_pr_vendor_date"),
        ]

    def __str__(self) -> str:
        return (
            f"{self.vendor.email} — {self.plan.name} "
            f"₦{self.amount} ({self.payment_type})"
        )