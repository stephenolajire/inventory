# subscriptions/tasks.py

import logging

from celery import shared_task
from celery.utils.log import get_task_logger
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction

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

def _period_end_from_cycle(billing_cycle: str) -> timezone.datetime:
    """
    Returns the subscription period end datetime based on billing cycle.
    Monthly = 30 days from now.
    Yearly  = 365 days from now.
    Defined here independently from views.py so tasks never
    import from views — that would create a circular import.
    """
    from subscriptions.models import VendorSubscription
    if billing_cycle == VendorSubscription.BillingCycle.YEARLY:
        return timezone.now() + timezone.timedelta(days=365)
    return timezone.now() + timezone.timedelta(days=30)


@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 10,
    name                = "subscriptions.send_payment_confirmation_email",
)
def send_payment_confirmation_email(self, user_id: str):
    """
    Sends payment confirmation email after a successful subscription payment.
    """
    logger.info("send_payment_confirmation_email — START | user_id=%s", user_id)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error("send_payment_confirmation_email — user not found: %s", user_id)
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
            "send_payment_confirmation_email — no active subscription | user=%s",
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
            template = "subscriptions/payment_confirmation",
            context  = {
                "first_name":      _get_first_name(user),
                "plan_name":       subscription.plan.get_name_display(),
                "billing_cycle":   subscription.billing_cycle,
                "amount_paid":     str(subscription.amount_paid),
                "currency":        subscription.currency,
                "next_billing_date": subscription.current_period_end.strftime("%d %b %Y"),
                "dashboard_url":   dashboard_url,
            },
            subject = f"Payment confirmed — {subscription.plan.get_name_display()} is active",
        )
        logger.info(
            "send_payment_confirmation_email — sent | to=%s", user.email
        )
    except Exception as exc:
        logger.warning(
            "send_payment_confirmation_email — failed | to=%s | error=%s",
            user.email,
            str(exc),
        )
        raise self.retry(exc=exc)


@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 10,
    name                = "subscriptions.send_plan_change_email",
)
def send_plan_change_email(self, user_id: str, direction: str, plan_name: str):
    """
    Sends plan change confirmation email for upgrades and downgrades.

    Args:
        user_id:   UUID of the vendor.
        direction: "upgraded" or "downgraded".
        plan_name: The name of the new plan.
    """
    logger.info(
        "send_plan_change_email — START | user_id=%s | direction=%s | plan=%s",
        user_id, direction, plan_name,
    )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error("send_plan_change_email — user not found: %s", user_id)
        return

    from subscriptions.models import SubscriptionPlan
    try:
        plan = SubscriptionPlan.objects.get(name=plan_name)
    except SubscriptionPlan.DoesNotExist:
        logger.error("send_plan_change_email — plan not found: %s", plan_name)
        return

    from django.conf import settings
    subscription_url = (
        f"{getattr(settings, 'FRONTEND_BASE_URL', 'https://stocksense.app')}"
        f"/settings/subscription"
    )

    if direction == "upgraded":
        subject  = f"You are now on the {plan.get_name_display()} plan"
        template = "subscriptions/plan_upgraded"
    else:
        subject  = "Your plan change is scheduled"
        template = "subscriptions/plan_downgraded"

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
            },
            subject = subject,
        )
        logger.info("send_plan_change_email — sent | to=%s", user.email)
    except Exception as exc:
        logger.warning(
            "send_plan_change_email — failed | to=%s | error=%s",
            user.email,
            str(exc),
        )
        raise self.retry(exc=exc)


@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 10,
    name                = "subscriptions.send_renewal_reminder",
)
def send_renewal_reminder(self, subscription_id: str):
    """
    Sends a renewal reminder email when subscription expires in 7 days.
    Triggered by the daily Celery Beat check.
    """
    logger.info(
        "send_renewal_reminder — START | subscription_id=%s", subscription_id
    )

    from subscriptions.models import VendorSubscription
    try:
        subscription = VendorSubscription.objects.select_related(
            "vendor", "plan"
        ).get(id=subscription_id)
    except VendorSubscription.DoesNotExist:
        logger.error(
            "send_renewal_reminder — subscription not found: %s",
            subscription_id,
        )
        return

    user         = subscription.vendor
    days_remaining = (subscription.current_period_end.date() - timezone.now().date()).days

    from django.conf import settings
    subscription_url = (
        f"{getattr(settings, 'FRONTEND_BASE_URL', 'https://stocksense.app')}"
        f"/settings/subscription"
    )

    try:
        from emails.service import EmailService
        EmailService.send(
            to       = user.email,
            template = "subscriptions/renewal_reminder",
            context  = {
                "first_name":      _get_first_name(user),
                "plan_name":       subscription.plan.get_name_display(),
                "days_remaining":  days_remaining,
                "renewal_date":    subscription.current_period_end.strftime("%d %b %Y"),
                "subscription_url": subscription_url,
            },
            subject = (
                f"Your {subscription.plan.get_name_display()} plan "
                f"renews in {days_remaining} days"
            ),
        )
        logger.info("send_renewal_reminder — sent | to=%s", user.email)
    except Exception as exc:
        logger.warning(
            "send_renewal_reminder — failed | to=%s | error=%s",
            user.email,
            str(exc),
        )
        raise self.retry(exc=exc)


@shared_task(name="subscriptions.handle_subscription_expiry")
def handle_subscription_expiry(subscription_id: str):
    """
    Handles a subscription that has passed its period end date.
    Called by the daily Celery Beat check.
    Downgrades vendor to Free plan limits if not renewed.
    """
    logger.info(
        "handle_subscription_expiry — START | subscription_id=%s",
        subscription_id,
    )

    from subscriptions.models import VendorSubscription, SubscriptionPlan
    try:
        subscription = VendorSubscription.objects.select_related(
            "vendor", "plan"
        ).get(id=subscription_id)
    except VendorSubscription.DoesNotExist:
        logger.error(
            "handle_subscription_expiry — not found: %s", subscription_id
        )
        return

    if subscription.plan.name == SubscriptionPlan.Name.FREE:
        return  # Free plans never expire

    # ── Update status to expired ──
    subscription.status = VendorSubscription.Status.EXPIRED
    subscription.save(update_fields=["status"])

    vendor = subscription.vendor

    # ── Hide products exceeding free plan limit ──
    from products.models import Product
    free_plan = SubscriptionPlan.objects.filter(
        name=SubscriptionPlan.Name.FREE, is_active=True
    ).first()

    free_limit = free_plan.product_limit if free_plan else 20

    active_products = Product.objects.filter(
        vendor    = vendor,
        is_active = True,
    ).order_by("-created_at")

    if active_products.count() > free_limit:
        excess_ids = list(
            active_products.values_list("id", flat=True)[free_limit:]
        )
        Product.objects.filter(id__in=excess_ids).update(is_active=False)

        logger.info(
            "handle_subscription_expiry — hidden %d excess products | vendor=%s",
            len(excess_ids),
            vendor.email,
        )

    from notifications.models import Notification
    Notification.objects.create(
        recipient         = vendor,
        notification_type = Notification.NotificationType.SUBSCRIPTION_EXPIRED,
        title             = "Your subscription has expired",
        message           = (
            "Your subscription has expired. You are now on the Free plan. "
            "Some products may have been hidden. "
            "Upgrade to restore full access."
        ),
        channel    = Notification.Channel.BOTH,
        action_url = "/settings/subscription",
    )

    logger.info(
        "handle_subscription_expiry — DONE | vendor=%s", vendor.email
    )


@shared_task(name="subscriptions.apply_scheduled_downgrade")
def apply_scheduled_downgrade(pending_change_id: str):
    """
    Applies a scheduled downgrade when its effective_at date arrives.
    Called by the daily Celery Beat check.
    """
    logger.info(
        "apply_scheduled_downgrade — START | pending_change_id=%s",
        pending_change_id,
    )

    from subscriptions.models import PendingPlanChange, VendorSubscription
    try:
        pending = PendingPlanChange.objects.select_related(
            "vendor", "new_plan"
        ).get(id=pending_change_id)
    except PendingPlanChange.DoesNotExist:
        logger.error(
            "apply_scheduled_downgrade — not found: %s", pending_change_id
        )
        return

    if pending.change_status != PendingPlanChange.ChangeStatus.SCHEDULED:
        logger.info(
            "apply_scheduled_downgrade — already applied or cancelled: %s",
            pending_change_id,
        )
        return

    vendor = pending.vendor

    # ── Get current active subscription ──
    subscription = VendorSubscription.objects.filter(
        vendor = vendor,
        status = VendorSubscription.Status.ACTIVE,
    ).order_by("-created_at").first()

    if not subscription:
        logger.error(
            "apply_scheduled_downgrade — no active subscription | vendor=%s",
            vendor.email,
        )
        return

    new_plan      = pending.new_plan
    billing_cycle = pending.new_billing_cycle or subscription.billing_cycle

    from products.models import Product

    with transaction.atomic():

        # ── Hide excess products if new plan has lower limit ──
        if new_plan and new_plan.product_limit > 0:
            active_products = Product.objects.filter(
                vendor    = vendor,
                is_active = True,
            ).order_by("-created_at")

            if active_products.count() > new_plan.product_limit:
                excess_ids = list(
                    active_products.values_list(
                        "id", flat=True
                    )[new_plan.product_limit:]
                )
                Product.objects.filter(id__in=excess_ids).update(is_active=False)

                logger.info(
                    "apply_scheduled_downgrade — hidden %d products | vendor=%s",
                    len(excess_ids),
                    vendor.email,
                )

        # ── Update subscription ──
        if new_plan:
            subscription.plan = new_plan
        subscription.billing_cycle        = billing_cycle
        subscription.current_period_start = timezone.now()
        subscription.current_period_end   = _period_end_from_cycle(billing_cycle)
        subscription.save(update_fields=[
            "plan", "billing_cycle",
            "current_period_start", "current_period_end",
        ])

        # ── Mark pending change as applied ──
        pending.change_status = PendingPlanChange.ChangeStatus.APPLIED
        pending.save(update_fields=["change_status"])

    from notifications.models import Notification
    Notification.objects.create(
        recipient         = vendor,
        notification_type = Notification.NotificationType.PLAN_DOWNGRADE_SCHEDULED,
        title             = "Your plan has been updated",
        message           = (
            f"Your plan has changed to "
            f"{new_plan.get_name_display() if new_plan else 'Free'}. "
            f"Some features may no longer be available."
        ),
        channel    = Notification.Channel.BOTH,
        action_url = "/settings/subscription",
    )

    logger.info(
        "apply_scheduled_downgrade — DONE | vendor=%s | new_plan=%s",
        vendor.email,
        new_plan.name if new_plan else "free",
    )