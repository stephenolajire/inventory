# vendors/tasks.py

import logging

from celery import shared_task
from celery.utils.log import get_task_logger
from django.contrib.auth import get_user_model

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


@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 10,
    name                = "vendors.send_approval_email",
)
def send_approval_email(self, user_id: str, scanner_serial: str):
    """
    Sends the approval confirmation email to the vendor
    after admin approves their application.
    Queued after transaction.atomic() commits.
    """

    logger.info(
        "send_approval_email — START | user_id=%s | scanner=%s",
        user_id,
        scanner_serial,
    )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error("send_approval_email — user not found: %s", user_id)
        return

    # ── Load subscription plan name ──
    from subscriptions.models import VendorSubscription
    subscription = (
        VendorSubscription.objects
        .select_related("plan")
        .filter(vendor=user)
        .order_by("-created_at")
        .first()
    )
    plan_name = (
        subscription.plan.get_name_display()
        if subscription else "Free"
    )

    from django.conf import settings
    login_url = f"{getattr(settings, 'FRONTEND_BASE_URL', 'https://stocksense.app')}/login"

    try:
        from emails.service import EmailService
        EmailService.send(
            to       = user.email,
            template = "vendors/approval",
            context  = {
                "first_name":     _get_first_name(user),
                "scanner_serial": scanner_serial,
                "plan_name":      plan_name,
                "login_url":      login_url,
            },
            subject = "Your StockSense account is approved",
        )
        logger.info(
            "send_approval_email — sent | to=%s", user.email
        )

    except Exception as exc:
        logger.warning(
            "send_approval_email — failed | to=%s | error=%s | retrying...",
            user.email,
            str(exc),
        )
        raise self.retry(exc=exc)


@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 10,
    name                = "vendors.send_rejection_email",
)
def send_rejection_email(self, user_id: str, reason: str):
    """
    Sends the rejection email to the vendor
    after admin rejects their application.
    """

    logger.info("send_rejection_email — START | user_id=%s", user_id)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error("send_rejection_email — user not found: %s", user_id)
        return

    try:
        from emails.service import EmailService
        EmailService.send(
            to       = user.email,
            template = "vendors/rejection",
            context  = {
                "first_name": _get_first_name(user),
                "reason":     reason,
            },
            subject = "Update on your StockSense application",
        )
        logger.info(
            "send_rejection_email — sent | to=%s", user.email
        )

    except Exception as exc:
        logger.warning(
            "send_rejection_email — failed | to=%s | error=%s | retrying...",
            user.email,
            str(exc),
        )
        raise self.retry(exc=exc)