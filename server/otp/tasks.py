# apps/otp/tasks.py

import logging

from celery import shared_task
from celery.utils.log import get_task_logger
from django.contrib.auth import get_user_model

from .models import OTP

logger = get_task_logger(__name__)
User   = get_user_model()


def _purpose_label(purpose: str) -> str:
    """
    Returns a human-readable label for the OTP purpose
    used in email subjects and body copy.
    """
    labels = {
        OTP.Purpose.EMAIL_VERIFICATION: "email verification",
        OTP.Purpose.PASSWORD_RESET:     "password reset",
        OTP.Purpose.CHANGE_EMAIL:       "email change",
        OTP.Purpose.DELETE_ACCOUNT:     "account deletion",
        OTP.Purpose.SENSITIVE_ACTION:   "account action",
    }
    return labels.get(purpose, "verification")


def _purpose_instruction(purpose: str) -> str:
    """
    Returns the context-specific instruction shown in the OTP email
    body below the code — tells the user what the code is for.
    """
    instructions = {
        OTP.Purpose.EMAIL_VERIFICATION: (
            "Enter this code to verify your email address "
            "and complete your StockSense registration."
        ),
        OTP.Purpose.PASSWORD_RESET: (
            "Enter this code to verify your identity "
            "before resetting your password."
        ),
        OTP.Purpose.CHANGE_EMAIL: (
            "Enter this code to confirm that you want to "
            "change the email address on your account."
        ),
        OTP.Purpose.DELETE_ACCOUNT: (
            "Enter this code to confirm permanent deletion "
            "of your StockSense account. This cannot be undone."
        ),
        OTP.Purpose.SENSITIVE_ACTION: (
            "Enter this code to authorise the requested action "
            "on your StockSense account."
        ),
    }
    return instructions.get(
        purpose,
        "Enter this code to complete your requested action.",
    )


@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 10,
    name                = "otp.send_otp_email",
)
def send_otp_email(self, user_id: str, code: str, purpose: str):
    """
    Sends an OTP code to the user's email address.

    Called by OTPRequestView and OTPResendView after creating
    the OTP record. Runs in the background — the API response
    is already returned before this task executes.

    Args:
        user_id: UUID string of the target User.
        code:    The 6-digit OTP code to send.
        purpose: The OTP.Purpose value — determines email copy.
    """

    logger.info(
        "send_otp_email — START | user_id=%s | purpose=%s",
        user_id,
        purpose,
    )

    # ── Load user ──
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(
            "send_otp_email — user not found: %s", user_id
        )
        return

    # ── Build email context ──
    from django.conf import settings

    expiry_minutes = getattr(settings, "OTP_EXPIRY_MINUTES", 10)
    first_name     = _get_first_name(user)
    label          = _purpose_label(purpose)
    instruction    = _purpose_instruction(purpose)

    subject = f"Your StockSense {label} code"

    context = {
        "first_name":    first_name,
        "otp_code":      code,
        "expiry_minutes": expiry_minutes,
        "purpose_label":  label,
        "instruction":    instruction,
    }

    # ── Send ──
    try:
        from emails.service import EmailService
        EmailService.send(
            to       = user.email,
            template = "otp/otp_email",
            context  = context,
            subject  = subject,
        )
        logger.info(
            "send_otp_email — OK | to=%s | purpose=%s",
            user.email,
            purpose,
        )

    except Exception as exc:
        logger.warning(
            "send_otp_email — FAILED | to=%s | error=%s | retrying...",
            user.email,
            str(exc),
        )
        raise self.retry(exc=exc)


@shared_task(name="otp.cleanup_expired_otps")
def cleanup_expired_otps():
    """
    Deletes OTP records that have expired and been used,
    or expired and are older than 24 hours.

    Scheduled nightly via Celery Beat.
    Keeps the otp table lean.
    """

    from django.utils import timezone

    cutoff = timezone.now() - timezone.timedelta(hours=24)

    deleted_used, _ = OTP.objects.filter(
        is_used    = True,
        expires_at__lt = timezone.now(),
    ).delete()

    deleted_old, _ = OTP.objects.filter(
        is_used    = False,
        expires_at__lt = cutoff,
    ).delete()

    total = deleted_used + deleted_old

    logger.info(
        "cleanup_expired_otps — deleted %d used + %d stale = %d total",
        deleted_used,
        deleted_old,
        total,
    )

    return {"deleted": total}


# ─────────────────────────────────────────────────────────────────────────────
# Private helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_first_name(user) -> str:
    try:
        name = user.vendor_profile.first_name
        if name:
            return name
    except AttributeError:
        pass
    return user.email.split("@")[0]