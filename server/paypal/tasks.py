# apps/paypal/tasks.py
"""
Celery tasks for the PayPal app.

Mirrors the structure of subscriptions/tasks.py but scoped to
PayPal-specific email notifications. No imports from subscriptions/tasks.py
to avoid circular dependencies.

Tasks:
  send_paypal_payment_confirmation_email — after one-time capture succeeds
  send_paypal_plan_change_email          — after upgrade / scheduled downgrade
  sync_paypal_subscription_status        — daily sync of PayPal sub status
"""

import logging

from celery import shared_task
from celery.utils.log import get_task_logger
from django.contrib.auth import get_user_model
from django.utils import timezone

logger = get_task_logger(__name__)
User   = get_user_model()


def _get_first_name(user) -> str:
    try:
        name = user.vendor_profile.first_name
        if name:
            return name
    except AttributeError:
        pass
    return user.email.split("@")[0]


# ─────────────────────────────────────────────────────────────────────────────
# Payment confirmation email
# ─────────────────────────────────────────────────────────────────────────────

@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 10,
    name                = "paypal.send_paypal_payment_confirmation_email",
)
def send_paypal_payment_confirmation_email(self, user_id: str):
    """
    Sends payment confirmation email after a successful PayPal capture.
    Triggered by PayPalOrderViewSet.capture_order_action.
    """
    logger.info(
        "send_paypal_payment_confirmation_email — START | user_id=%s", user_id
    )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(
            "send_paypal_payment_confirmation_email — user not found: %s", user_id
        )
        return

    from subscriptions.models import VendorSubscription
    subscription = (
        VendorSubscription.objects
        .select_related("plan")
        .filter(
            vendor = user,
            status = VendorSubscription.Status.ACTIVE,
        )
        .order_by("-created_at")
        .first()
    )

    if not subscription:
        logger.error(
            "send_paypal_payment_confirmation_email — no active subscription | user=%s",
            user_id,
        )
        return

    from django.conf import settings
    dashboard_url = (
        f"{getattr(settings, 'FRONTEND_BASE_URL', 'https://stocksense.app')}"
        f"/dashboard"
    )

    try:
        from emails.service import EmailService
        EmailService.send(
            to       = user.email,
            template = "paypal/payment_confirmation",
            context  = {
                "first_name":        _get_first_name(user),
                "plan_name":         subscription.plan.get_name_display(),
                "billing_cycle":     subscription.billing_cycle,
                "amount_paid":       str(subscription.amount_paid),
                "currency":          subscription.currency,
                "next_billing_date": subscription.current_period_end.strftime("%d %b %Y"),
                "dashboard_url":     dashboard_url,
                "payment_method":    "PayPal",
            },
            subject = (
                f"Payment confirmed — "
                f"{subscription.plan.get_name_display()} is active"
            ),
        )
        logger.info(
            "send_paypal_payment_confirmation_email — sent | to=%s", user.email
        )
    except Exception as exc:
        logger.warning(
            "send_paypal_payment_confirmation_email — failed | to=%s | error=%s",
            user.email, str(exc),
        )
        raise self.retry(exc=exc)


# ─────────────────────────────────────────────────────────────────────────────
# Plan change email
# ─────────────────────────────────────────────────────────────────────────────

@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 10,
    name                = "paypal.send_paypal_plan_change_email",
)
def send_paypal_plan_change_email(self, user_id: str, direction: str, plan_name: str):
    """
    Sends plan change confirmation email for PayPal-based upgrades/downgrades.

    Args:
        user_id:   UUID of the vendor.
        direction: "upgraded" or "downgraded".
        plan_name: Name key of the new plan.
    """
    logger.info(
        "send_paypal_plan_change_email — START | user_id=%s | direction=%s | plan=%s",
        user_id, direction, plan_name,
    )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(
            "send_paypal_plan_change_email — user not found: %s", user_id
        )
        return

    from subscriptions.models import SubscriptionPlan
    try:
        plan = SubscriptionPlan.objects.get(name=plan_name)
    except SubscriptionPlan.DoesNotExist:
        logger.error(
            "send_paypal_plan_change_email — plan not found: %s", plan_name
        )
        return

    from django.conf import settings
    subscription_url = (
        f"{getattr(settings, 'FRONTEND_BASE_URL', 'https://stocksense.app')}"
        f"/settings/subscription"
    )

    if direction == "upgraded":
        subject  = f"You are now on the {plan.get_name_display()} plan"
        template = "paypal/plan_upgraded"
    else:
        subject  = "Your plan change is scheduled"
        template = "paypal/plan_downgraded"

    try:
        from emails.service import EmailService
        EmailService.send(
            to       = user.email,
            template = template,
            context  = {
                "first_name":       _get_first_name(user),
                "plan_name":        plan.get_name_display(),
                "direction":        direction,
                "subscription_url": subscription_url,
                "payment_method":   "PayPal",
            },
            subject = subject,
        )
        logger.info(
            "send_paypal_plan_change_email — sent | to=%s", user.email
        )
    except Exception as exc:
        logger.warning(
            "send_paypal_plan_change_email — failed | to=%s | error=%s",
            user.email, str(exc),
        )
        raise self.retry(exc=exc)


# ─────────────────────────────────────────────────────────────────────────────
# Daily PayPal subscription status sync
# ─────────────────────────────────────────────────────────────────────────────

@shared_task(name="paypal.sync_paypal_subscription_status")
def sync_paypal_subscription_status():
    """
    Celery Beat daily task.
    Fetches the live status of all non-cancelled PayPal subscriptions
    from the PayPal API and syncs them locally.

    This catches edge cases where webhooks were missed (e.g. PayPal
    retried and our server was down).

    Schedule example in settings.py:
        CELERY_BEAT_SCHEDULE = {
            ...
            "sync-paypal-subs": {
                "task":     "paypal.sync_paypal_subscription_status",
                "schedule": crontab(hour=2, minute=0),  # 02:00 daily
            },
        }
    """
    from .models import PayPalSubscription
    from .client import get_paypal_subscription
    from subscriptions.models import VendorSubscription

    active_subs = PayPalSubscription.objects.exclude(
        status__in=[
            PayPalSubscription.SubStatus.CANCELLED,
            PayPalSubscription.SubStatus.EXPIRED,
        ]
    ).select_related("vendor_subscription")

    logger.info(
        "sync_paypal_subscription_status — checking %d subscriptions",
        active_subs.count(),
    )

    for paypal_sub in active_subs:
        try:
            remote = get_paypal_subscription(paypal_sub.paypal_sub_id)
            remote_status = remote.get("status", "")

            status_map = {
                "APPROVAL_PENDING": PayPalSubscription.SubStatus.APPROVAL_PENDING,
                "APPROVED":         PayPalSubscription.SubStatus.APPROVED,
                "ACTIVE":           PayPalSubscription.SubStatus.ACTIVE,
                "SUSPENDED":        PayPalSubscription.SubStatus.SUSPENDED,
                "CANCELLED":        PayPalSubscription.SubStatus.CANCELLED,
                "EXPIRED":          PayPalSubscription.SubStatus.EXPIRED,
            }

            new_status = status_map.get(remote_status)
            if new_status and new_status != paypal_sub.status:
                logger.info(
                    "sync — status changed | sub_id=%s | %s → %s",
                    paypal_sub.paypal_sub_id, paypal_sub.status, new_status,
                )
                paypal_sub.status = new_status
                paypal_sub.save(update_fields=["status"])

                # Sync to VendorSubscription if cancelled or expired
                vendor_sub = paypal_sub.vendor_subscription
                if vendor_sub and new_status in (
                    PayPalSubscription.SubStatus.CANCELLED,
                    PayPalSubscription.SubStatus.EXPIRED,
                ):
                    vendor_sub.status = VendorSubscription.Status.EXPIRED
                    vendor_sub.save(update_fields=["status"])

        except Exception as exc:
            logger.warning(
                "sync — failed for sub_id=%s | error=%s",
                paypal_sub.paypal_sub_id, exc,
            )
            continue

    logger.info("sync_paypal_subscription_status — DONE")