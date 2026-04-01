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

from subscriptions.utils import period_end_from_cycle as _period_end_from_cycle


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

    # ── Update status to expired and stamp cancelled_at so the renewal
    #    query (cancelled_at__isnull=True) never picks this sub up again ──
    subscription.status       = VendorSubscription.Status.EXPIRED
    subscription.cancelled_at = timezone.now()
    subscription.save(update_fields=["status", "cancelled_at"])

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

        # ── Update plan and billing cycle only.
        #    Do NOT reset period dates here — this task applies when the
        #    period has already ended and process_subscription_renewal has
        #    NOT run (e.g. no payment method). The renewal task owns period
        #    extension + charging. We just swap the plan label so the next
        #    renewal charges the correct (lower) amount. ──
        if new_plan:
            subscription.plan = new_plan
        subscription.billing_cycle = billing_cycle
        subscription.save(update_fields=["plan", "billing_cycle"])

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


@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 300,  # retry every 5 min on failure
    name                = "subscriptions.process_subscription_renewal",
)
def process_subscription_renewal(self, subscription_id: str):
    """
    Charges the vendor's saved payment method to renew their subscription
    for another billing cycle. Called by Celery Beat daily check when
    current_period_end has passed and the subscription is still active
    (not cancelled, not already expired).

    Flow:
        1. Load subscription — verify it's renewable
        2. Check for a pending downgrade — apply it instead of renewing same plan
        3. Charge saved stripe_customer_id + stripe_payment_method_id
        4. On success — extend period, create PaymentRecord, notify vendor
        5. On failure — mark past_due, notify vendor, stop retrying after max_retries
    """
    import stripe
    from decimal import Decimal
    from django.conf import settings as django_settings
    from django.db import transaction
    from django.utils import timezone
    from subscriptions.models import (
        VendorSubscription,
        SubscriptionPlan,
        PendingPlanChange,
        PaymentRecord,
    )
    from notifications.models import Notification

    logger.info(
        "process_subscription_renewal — START | subscription_id=%s",
        subscription_id,
    )

    try:
        subscription = VendorSubscription.objects.select_related(
            "vendor", "plan"
        ).get(id=subscription_id)
    except VendorSubscription.DoesNotExist:
        logger.error(
            "process_subscription_renewal — not found: %s", subscription_id
        )
        return

    vendor = subscription.vendor

    # ── Only renew active or past_due subscriptions ──
    if subscription.status not in [
        VendorSubscription.Status.ACTIVE,
        VendorSubscription.Status.PAST_DUE,
    ]:
        logger.info(
            "process_subscription_renewal — skipping status=%s | vendor=%s",
            subscription.status, vendor.email,
        )
        return

    # ── Skip subscriptions marked for cancellation ──
    if subscription.cancelled_at is not None:
        logger.info(
            "process_subscription_renewal — skipping cancelled sub | vendor=%s",
            vendor.email,
        )
        return

    # ── Free plan: just extend period, no charge ──
    if subscription.plan.name == SubscriptionPlan.Name.FREE:
        subscription.current_period_start = timezone.now()
        subscription.current_period_end   = timezone.now() + timezone.timedelta(days=3650)
        subscription.save(update_fields=["current_period_start", "current_period_end"])
        logger.info(
            "process_subscription_renewal — free plan extended | vendor=%s",
            vendor.email,
        )
        return

    # ── No saved payment method — mark past_due and bail ──
    if not subscription.stripe_customer_id or not subscription.stripe_payment_method_id:
        logger.warning(
            "process_subscription_renewal — no payment method saved | vendor=%s",
            vendor.email,
        )
        subscription.status = VendorSubscription.Status.PAST_DUE
        subscription.save(update_fields=["status"])

        Notification.objects.create(
            recipient         = vendor,
            notification_type = Notification.NotificationType.SUBSCRIPTION_EXPIRED,
            title             = "Renewal failed — no payment method",
            message           = (
                "We could not renew your subscription because no payment method "
                "is saved. Please log in and reactivate your plan."
            ),
            channel    = Notification.Channel.BOTH,
            action_url = "/settings/subscription/activate",
        )
        return

    # ── Check for a pending downgrade due now ──
    # If vendor scheduled a downgrade, apply it on renewal instead of same plan
    pending_downgrade = PendingPlanChange.objects.filter(
        vendor        = vendor,
        change_type   = PendingPlanChange.ChangeType.DOWNGRADE,
        change_status = PendingPlanChange.ChangeStatus.SCHEDULED,
        effective_at__lte = timezone.now(),
    ).select_related("new_plan").first()

    if pending_downgrade and pending_downgrade.new_plan:
        renew_plan          = pending_downgrade.new_plan
        renew_billing_cycle = pending_downgrade.new_billing_cycle or subscription.billing_cycle
    else:
        renew_plan          = subscription.plan
        renew_billing_cycle = subscription.billing_cycle

    # ── Determine renewal amount ──
    amount_decimal = (
        renew_plan.yearly_price_gbp
        if renew_billing_cycle == VendorSubscription.BillingCycle.YEARLY
        else renew_plan.monthly_price_gbp
    )
    amount_pence = int(amount_decimal * 100)

    # ── Charge saved payment method ──
    stripe.api_key = django_settings.STRIPE_SECRET_KEY

    try:
        intent = stripe.PaymentIntent.create(
            amount         = amount_pence,
            currency       = subscription.currency.lower(),
            customer       = subscription.stripe_customer_id,
            payment_method = subscription.stripe_payment_method_id,
            confirm        = True,
            automatic_payment_methods={
                "enabled":         True,
                "allow_redirects": "never",
            },
            metadata={
                "vendor_id":       str(vendor.id),
                "plan":            renew_plan.name,
                "billing_cycle":   renew_billing_cycle,
                "type":            "renewal",
                "subscription_id": str(subscription.id),
            },
        )

        if intent.status != "succeeded":
            raise Exception(f"PaymentIntent status: {intent.status}")

    except stripe.error.CardError as exc:
        logger.warning(
            "process_subscription_renewal — card error | vendor=%s | error=%s",
            vendor.email, str(exc),
        )
        # Mark past_due — vendor needs to update payment method
        subscription.status = VendorSubscription.Status.PAST_DUE
        subscription.save(update_fields=["status"])

        Notification.objects.create(
            recipient         = vendor,
            notification_type = Notification.NotificationType.SUBSCRIPTION_EXPIRED,
            title             = "Renewal payment failed",
            message           = (
                f"We couldn't charge your card for the "
                f"{subscription.plan.get_name_display()} renewal. "
                f"Please update your payment method to avoid losing access."
            ),
            channel    = Notification.Channel.BOTH,
            action_url = "/settings/subscription/activate",
        )
        return  # Don't retry card errors — card is genuinely declined

    except Exception as exc:
        logger.exception(
            "process_subscription_renewal — charge failed | vendor=%s | error=%s",
            vendor.email, str(exc),
        )
        raise self.retry(exc=exc)  # Retry up to max_retries for transient errors

    # ── Payment succeeded — update subscription atomically ──
    with transaction.atomic():
        subscription.plan                    = renew_plan
        subscription.billing_cycle           = renew_billing_cycle
        subscription.status                  = VendorSubscription.Status.ACTIVE
        subscription.stripe_last_intent_id   = intent.id
        subscription.amount_paid             = amount_decimal
        subscription.current_period_start    = timezone.now()
        subscription.current_period_end      = _period_end_from_cycle(renew_billing_cycle)
        subscription.save(update_fields=[
            "plan",
            "billing_cycle",
            "status",
            "stripe_last_intent_id",
            "amount_paid",
            "current_period_start",
            "current_period_end",
        ])

        PaymentRecord.objects.create(
            subscription     = subscription,
            vendor           = vendor,
            plan             = renew_plan,
            payment_type     = PaymentRecord.PaymentType.RENEWAL,
            amount           = amount_decimal,
            currency         = subscription.currency,
            stripe_intent_id = intent.id,
            billing_cycle    = renew_billing_cycle,
        )
        if pending_downgrade:
            pending_downgrade.change_status = PendingPlanChange.ChangeStatus.APPLIED
            pending_downgrade.save(update_fields=["change_status"])

    logger.info(
        "process_subscription_renewal — SUCCESS | vendor=%s | plan=%s | amount=£%s",
        vendor.email, renew_plan.name, amount_decimal,
    )

    Notification.objects.create(
        recipient         = vendor,
        notification_type = Notification.NotificationType.SUBSCRIPTION_ACTIVATED,
        title             = f"{renew_plan.get_name_display()} plan renewed",
        message           = (
            f"Your {renew_plan.get_name_display()} plan has been renewed. "
            f"Next billing date: "
            f"{subscription.current_period_end.strftime('%d %b %Y')}."
        ),
        channel    = Notification.Channel.BOTH,
        action_url = "/settings/subscription",
    )

    send_payment_confirmation_email.delay(str(vendor.id))


@shared_task(name="subscriptions.daily_subscription_check")
def daily_subscription_check():
    """
    Celery Beat entry point — runs once a day.
    Fans out to per-subscription tasks so each one is isolated
    and retried independently without blocking the others.

    Handles:
      1. Renewal reminders  — 7 days before expiry
      2. Auto-renewal       — period has ended, subscription still active
      3. Expiry             — period ended and not renewed after grace period
      4. Scheduled changes  — pending downgrades/cancellations due today
    """
    from subscriptions.models import VendorSubscription, PendingPlanChange

    now   = timezone.now()
    today = now.date()

    # ── 1. Renewal reminders (7 days out) ──
    reminder_date = today + timezone.timedelta(days=7)
    reminders = VendorSubscription.objects.filter(
        status               = VendorSubscription.Status.ACTIVE,
        current_period_end__date = reminder_date,
    ).exclude(plan__name="free")

    for sub in reminders:
        send_renewal_reminder.delay(str(sub.id))
        logger.info(
            "daily_subscription_check — reminder queued | vendor=%s",
            sub.vendor.email,
        )

    # ── 2. Auto-renewal — period ended today or yesterday (1-day grace) ──
    renewal_window_start = now - timezone.timedelta(days=1)
    due_renewals = VendorSubscription.objects.filter(
        status__in           = [
            VendorSubscription.Status.ACTIVE,
            VendorSubscription.Status.PAST_DUE,
        ],
        current_period_end__lte = now,
        current_period_end__gte = renewal_window_start,
        cancelled_at__isnull    = True,  # not cancelled — should renew
    ).exclude(plan__name="free")

    for sub in due_renewals:
        process_subscription_renewal.delay(str(sub.id))
        logger.info(
            "daily_subscription_check — renewal queued | vendor=%s",
            sub.vendor.email,
        )

    # ── 3. Expiry — period ended more than 1 day ago, still not renewed ──
    expired_cutoff = now - timezone.timedelta(days=1)
    expired = VendorSubscription.objects.filter(
        status               = VendorSubscription.Status.ACTIVE,
        current_period_end__lt = expired_cutoff,
    ).exclude(plan__name="free")

    for sub in expired:
        handle_subscription_expiry.delay(str(sub.id))
        logger.info(
            "daily_subscription_check — expiry queued | vendor=%s",
            sub.vendor.email,
        )

    # ── 4. Scheduled cancellations due today ──
    due_cancellations = PendingPlanChange.objects.filter(
        change_type   = PendingPlanChange.ChangeType.CANCELLATION,
        change_status = PendingPlanChange.ChangeStatus.SCHEDULED,
        effective_at__lte = now,
    )

    for change in due_cancellations:
        apply_cancellation.delay(str(change.id))  # isolated + retryable

    # ── 5. Scheduled downgrades due today ──
    due_downgrades = PendingPlanChange.objects.filter(
        change_type   = PendingPlanChange.ChangeType.DOWNGRADE,
        change_status = PendingPlanChange.ChangeStatus.SCHEDULED,
        effective_at__lte = now,
    )

    for change in due_downgrades:
        # Only apply standalone — renewals with pending downgrades
        # are handled inside process_subscription_renewal
        sub = VendorSubscription.objects.filter(
            vendor = change.vendor,
            status = VendorSubscription.Status.ACTIVE,
        ).first()
        if sub and sub.current_period_end > now:
            # Period hasn't ended yet — renewal task will handle it
            continue
        apply_scheduled_downgrade.delay(str(change.id))

    logger.info(
        "daily_subscription_check — DONE | reminders=%d | renewals=%d | "
        "expired=%d | cancellations=%d | downgrades=%d",
        reminders.count(),
        due_renewals.count(),
        expired.count(),
        due_cancellations.count(),
        due_downgrades.count(),
    )


@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 60,
    name                = "subscriptions.apply_cancellation",
)
def apply_cancellation(self, pending_change_id: str):
    """
    Finalises a scheduled cancellation — marks subscription as cancelled.
    Runs as an isolated Celery task so a single failure doesn't block
    other cancellations and retries are handled automatically.
    """
    from subscriptions.models import VendorSubscription, PendingPlanChange
    from notifications.models import Notification

    logger.info(
        "apply_cancellation — START | pending_change_id=%s", pending_change_id
    )

    try:
        change = PendingPlanChange.objects.select_related("vendor").get(
            id=pending_change_id
        )
    except PendingPlanChange.DoesNotExist:
        logger.error(
            "apply_cancellation — not found: %s", pending_change_id
        )
        return

    if change.change_status != PendingPlanChange.ChangeStatus.SCHEDULED:
        logger.info(
            "apply_cancellation — already applied or cancelled: %s",
            pending_change_id,
        )
        return

    try:
        sub = VendorSubscription.objects.select_related("vendor", "plan").filter(
            vendor=change.vendor,
        ).exclude(
            status=VendorSubscription.Status.CANCELLED,
        ).order_by("-created_at").first()

        if not sub:
            logger.warning(
                "apply_cancellation — no active sub found | vendor=%s",
                change.vendor.email,
            )
            return

        with transaction.atomic():
            sub.status = VendorSubscription.Status.CANCELLED
            sub.save(update_fields=["status"])

            change.change_status = PendingPlanChange.ChangeStatus.APPLIED
            change.save(update_fields=["change_status"])

        Notification.objects.create(
            recipient         = change.vendor,
            notification_type = Notification.NotificationType.SUBSCRIPTION_CANCELLED,
            title             = "Subscription ended",
            message           = (
                f"Your {sub.plan.get_name_display()} plan has ended. "
                "You can resubscribe any time."
            ),
            channel    = Notification.Channel.BOTH,
            action_url = "/settings/subscription",
        )

        logger.info(
            "apply_cancellation — DONE | vendor=%s", change.vendor.email
        )

    except Exception as exc:
        logger.exception(
            "apply_cancellation — failed | vendor=%s | error=%s",
            change.vendor.email, str(exc),
        )
        raise self.retry(exc=exc)