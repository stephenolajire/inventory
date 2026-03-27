# notifications/tasks.py

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
    name                = "notifications.send_notification_email",
)
def send_notification_email(self, user_id: str, title: str, message: str):
    """
    Sends an email for a single notification.
    Called after broadcast to a specific vendor.
    """
    logger.info(
        "send_notification_email — START | user_id=%s", user_id
    )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(
            "send_notification_email — user not found: %s", user_id
        )
        return

    try:
        from emails.service import EmailService
        EmailService.send(
            to       = user.email,
            template = "notifications/system_notification",
            context  = {
                "first_name": _get_first_name(user),
                "title":      title,
                "message":    message,
            },
            subject = title,
        )
        logger.info(
            "send_notification_email — sent | to=%s", user.email
        )

        # ── Mark email as sent on the notification record ──
        from notifications.models import Notification
        Notification.objects.filter(
            recipient  = user,
            title      = title,
            email_sent = False,
        ).update(
            email_sent    = True,
            email_sent_at = __import__("django.utils.timezone", fromlist=["timezone"]).timezone.now(),
        )

    except Exception as exc:
        logger.warning(
            "send_notification_email — failed | to=%s | error=%s",
            user.email,
            str(exc),
        )
        raise self.retry(exc=exc)


@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 10,
    name                = "notifications.send_bulk_notification_email",
)
def send_bulk_notification_email(self, recipient_list: list):
    """
    Sends notification emails to multiple recipients.
    Called after a platform-wide admin broadcast.
    Uses send_bulk to reuse a single SMTP connection for the batch.
    """
    logger.info(
        "send_bulk_notification_email — START | count=%d",
        len(recipient_list),
    )

    try:
        from emails.service import EmailService
        result = EmailService.send_bulk(
            recipients = recipient_list,
            template   = "notifications/system_notification",
            subject    = recipient_list[0]["context"].get("title", "StockSense notification"),
        )
        logger.info(
            "send_bulk_notification_email — done | sent=%d failed=%d",
            result["sent"],
            result["failed"],
        )

    except Exception as exc:
        logger.warning(
            "send_bulk_notification_email — failed | error=%s", str(exc)
        )
        raise self.retry(exc=exc)


@shared_task(name="notifications.cleanup_old_notifications")
def cleanup_old_notifications(days_old: int = 90):
    """
    Deletes read notifications older than the given number of days.
    Scheduled to run monthly via Celery Beat.
    """
    from django.utils import timezone
    from notifications.models import Notification

    cutoff = timezone.now() - timezone.timedelta(days=days_old)

    deleted_count, _ = Notification.objects.filter(
        is_read        = True,
        created_at__lt = cutoff,
    ).delete()

    logger.info(
        "cleanup_old_notifications — deleted %d notifications older than %d days",
        deleted_count,
        days_old,
    )

    return {"deleted": deleted_count}