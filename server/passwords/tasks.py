# apps/passwords/tasks.py

from celery import shared_task
from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.auth import get_user_model

logger = get_task_logger(__name__)
User   = get_user_model()


@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 10,
    name                = "passwords.send_password_reset_email",
)
def send_password_reset_email(self, user_id: str, raw_token: str):
    """
    Sends the password reset link to the user's email address.

    Called by ForgotPasswordView after the token has been persisted.
    Runs in the background — the API response is already returned
    before this task executes.

    Args:
        user_id:   UUID string of the User requesting the reset.
        raw_token: The unhashed token to embed in the reset URL.
                   Only exists here and in the email link itself.
    """

    logger.info("send_password_reset_email — user_id=%s", user_id)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(
            "send_password_reset_email — user not found: %s", user_id
        )
        return

    frontend_base = getattr(settings, "FRONTEND_BASE_URL", "https://stocksense.app")
    reset_url     = f"{frontend_base}/reset-password?token={raw_token}"

    try:
        from emails.service import EmailService

        EmailService.send(
            to       = user.email,
            template = "passwords/reset_link",
            context  = {
                "first_name":    _get_first_name(user),
                "reset_url":     reset_url,
                "expiry_hours":  getattr(settings, "PASSWORD_RESET_TOKEN_EXPIRY_HOURS", 24),
            },
            subject  = "Reset your StockSense password",
        )
        logger.info(
            "send_password_reset_email — sent to %s", user.email
        )
    except Exception as exc:
        logger.warning(
            "send_password_reset_email — failed for %s: %s. Retrying...",
            user.email,
            str(exc),
        )
        raise self.retry(exc=exc)


def _get_first_name(user) -> str:
    try:
        name = user.vendor_profile.first_name
        if name:
            return name
    except AttributeError:
        pass
    return user.email.split("@")[0]