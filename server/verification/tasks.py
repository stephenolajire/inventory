# apps/verification/tasks.py

import hashlib
import secrets

from celery import shared_task
from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

logger = get_task_logger(__name__)
User   = get_user_model()


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


# ─────────────────────────────────────────────────────────────────────────────
# Send verification email
# ─────────────────────────────────────────────────────────────────────────────

@shared_task(
    bind              = True,
    max_retries       = 3,
    default_retry_delay = 10,
    name              = "verification.send_verification_email",
)
def send_verification_email(self, user_id: str, raw_token: str):
    """
    Sends the email verification link to the vendor's email address.

    Called immediately after registration.
    Runs in the background — the registration API response is already
    returned to the client before this task executes.

    Retries up to 3 times with a 10-second gap on any failure.
    If all retries are exhausted, the vendor can request a new link
    from the resend endpoint.

    Args:
        user_id:   UUID string of the newly registered User.
        raw_token: The unhashed verification token to embed in the URL.
                   This is the only place the raw token exists outside
                   of the email link itself.
    """

    logger.info("send_verification_email — user_id=%s", user_id)

    # ── Load user ──
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(
            "send_verification_email — user not found: %s", user_id
        )
        return

    # ── Guard: already verified — no need to send ──
    if user.email_verified:
        logger.info(
            "send_verification_email — already verified, skipping: %s",
            user.email,
        )
        return

    # ── Build the verification URL ──
    frontend_base = getattr(settings, "FRONTEND_BASE_URL", "https://stocksense.app")
    verify_url    = f"{frontend_base}/verify-email?token={raw_token}"

    # ── Render and send the email ──
    try:
        from emails.service import EmailService
        EmailService.send(
            to       = user.email,
            template = "verification/verify_email",
            context  = {
                "first_name":  _get_first_name(user),
                "verify_url":  verify_url,
                "expiry_hours": getattr(settings, "VERIFICATION_TOKEN_EXPIRY_HOURS", 24),
            },
            subject  = "Verify your StockSense account",
        )
        logger.info(
            "send_verification_email — sent to %s", user.email
        )
    except Exception as exc:
        logger.warning(
            "send_verification_email — failed for %s: %s. Retrying...",
            user.email,
            str(exc),
        )
        raise self.retry(exc=exc)


# ─────────────────────────────────────────────────────────────────────────────
# Resend verification email
# ─────────────────────────────────────────────────────────────────────────────

@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 10,
    name                = "verification.resend_verification_email",
)
def resend_verification_email(self, user_id: str):
    """
    Generates a fresh verification token and sends a new email.

    Called by the resend endpoint after rate-limit checks pass.
    Invalidates all previous unused tokens for this user before
    creating a new one to prevent multiple valid links in circulation.

    Args:
        user_id: UUID string of the User requesting a new link.
    """

    logger.info("resend_verification_email — user_id=%s", user_id)

    # ── Load user ──
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(
            "resend_verification_email — user not found: %s", user_id
        )
        return

    # ── Guard: already verified ──
    if user.email_verified:
        logger.info(
            "resend_verification_email — already verified, skipping: %s",
            user.email,
        )
        return

    # ── Invalidate all existing unused tokens ──
    from verification.models import EmailVerificationToken
    EmailVerificationToken.objects.filter(
        user    = user,
        is_used = False,
    ).update(is_used=True)

    # ── Generate a fresh token ──
    raw_token  = secrets.token_urlsafe(48)
    token_hash = _hash_token(raw_token)

    EmailVerificationToken.objects.create(
        user       = user,
        token_hash = token_hash,
    )

    # ── Build the verification URL ──
    frontend_base = getattr(settings, "FRONTEND_BASE_URL", "https://stocksense.app")
    verify_url    = f"{frontend_base}/verify-email?token={raw_token}"

    # ── Send the email ──
    try:
        from emails.service import EmailService
        EmailService.send(
            to       = user.email,
            template = "verification/verify_email",
            context  = {
                "first_name":  _get_first_name(user),
                "verify_url":  verify_url,
                "expiry_hours": getattr(settings, "VERIFICATION_TOKEN_EXPIRY_HOURS", 24),
            },
            subject  = "Verify your StockSense account — new link",
        )
        logger.info(
            "resend_verification_email — sent to %s", user.email
        )
    except Exception as exc:
        logger.warning(
            "resend_verification_email — failed for %s: %s. Retrying...",
            user.email,
            str(exc),
        )
        raise self.retry(exc=exc)


# ─────────────────────────────────────────────────────────────────────────────
# Notify admin of new vendor application
# ─────────────────────────────────────────────────────────────────────────────

@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 10,
    name                = "verification.notify_admin_new_vendor",
)
def notify_admin_new_vendor(self, user_id: str):
    """
    Creates in-app notifications and sends emails to all admin users
    when a vendor verifies their email and enters pending_approval.

    Args:
        user_id: UUID string of the newly verified vendor User.
    """

    logger.info("notify_admin_new_vendor — user_id=%s", user_id)

    # ── Load vendor ──
    try:
        vendor = User.objects.select_related("vendor_profile").get(id=user_id)
    except User.DoesNotExist:
        logger.error(
            "notify_admin_new_vendor — vendor not found: %s", user_id
        )
        return

    # ── Load the vendor's selected plan ──
    from subscriptions.models import VendorSubscription
    subscription = (
        VendorSubscription.objects
        .select_related("plan")
        .filter(vendor=vendor)
        .order_by("-created_at")
        .first()
    )
    plan_name = subscription.plan.get_name_display() if subscription else "Unknown"

    # ── Load all admin users ──
    admins = User.objects.filter(
        role      = User.Role.ADMIN,
        is_active = True,
    )

    if not admins.exists():
        logger.warning(
            "notify_admin_new_vendor — no active admin users found"
        )
        return

    # ── Create in-app notifications for all admins ──
    from notifications.models import Notification

    notifications = [
        Notification(
            recipient         = admin,
            notification_type = Notification.NotificationType.NEW_VENDOR,
            title             = f"New vendor application — {vendor.email}",
            message           = (
                f"A new vendor has registered and verified their email. "
                f"Selected plan: {plan_name}. "
                f"Review and approve or reject their application."
            ),
            channel    = Notification.Channel.BOTH,
            action_url = f"/admin/vendors/pending/{vendor.id}",
            related_object_type = "User",
            related_object_id   = vendor.id,
        )
        for admin in admins
    ]
    Notification.objects.bulk_create(notifications)

    # ── Send email to each admin ──
    try:
        from emails.service import EmailService

        business_name = ""
        if hasattr(vendor, "vendor_profile"):
            business_name = vendor.vendor_profile.business_name

        for admin in admins:
            EmailService.send(
                to       = admin.email,
                template = "verification/admin_new_vendor",
                context  = {
                    "admin_name":    _get_first_name(admin),
                    "vendor_email":  vendor.email,
                    "business_name": business_name or "Not yet set",
                    "plan_name":     plan_name,
                    "review_url":    (
                        f"{getattr(settings, 'FRONTEND_BASE_URL', 'https://stocksense.app')}"
                        f"/admin/vendors/pending/{vendor.id}"
                    ),
                },
                subject = f"New vendor application: {vendor.email}",
            )

        logger.info(
            "notify_admin_new_vendor — notified %d admin(s) about %s",
            admins.count(),
            vendor.email,
        )

    except Exception as exc:
        logger.warning(
            "notify_admin_new_vendor — email failed: %s. Retrying...",
            str(exc),
        )
        raise self.retry(exc=exc)


# ─────────────────────────────────────────────────────────────────────────────
# Cleanup expired tokens (scheduled — runs nightly via Celery Beat)
# ─────────────────────────────────────────────────────────────────────────────

@shared_task(name="verification.cleanup_expired_tokens")
def cleanup_expired_tokens():
    """
    Deletes email verification tokens that have expired and been used,
    or expired and are older than 7 days.

    Scheduled to run nightly via Celery Beat.
    Keeps the table lean — tokens that have already done their job
    do not need to live in the database indefinitely.

    Does NOT delete unexpired unused tokens — those are still valid
    links waiting to be clicked.
    """

    from verification.models import EmailVerificationToken

    cutoff = timezone.now() - timezone.timedelta(days=7)

    deleted_used, _ = EmailVerificationToken.objects.filter(
        is_used    = True,
        expires_at__lt = timezone.now(),
    ).delete()

    deleted_old, _ = EmailVerificationToken.objects.filter(
        is_used    = False,
        expires_at__lt = cutoff,
    ).delete()

    total = deleted_used + deleted_old

    logger.info(
        "cleanup_expired_tokens — deleted %d used + %d stale = %d total",
        deleted_used,
        deleted_old,
        total,
    )

    return {"deleted": total}


# ─────────────────────────────────────────────────────────────────────────────
# Private helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_first_name(user) -> str:
    """
    Returns the vendor's first name from their profile if available,
    otherwise falls back to the part of their email before the @.
    Used in email greetings to avoid impersonal "Hello ," lines.
    """
    try:
        name = user.vendor_profile.first_name
        if name:
            return name
    except AttributeError:
        pass
    return user.email.split("@")[0]