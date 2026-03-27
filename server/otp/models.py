"""
apps/otp/models.py
==================
OTP (One-Time Password) storage.
One table handles all OTP use cases across the platform:
  - Email verification
  - Password reset
  - Sensitive action confirmation (delete account, change email)

Design decisions:
  - purpose field scopes each OTP to exactly one use case
    so the same email cannot reuse a password-reset OTP
    for email verification.
  - is_used flag prevents replay attacks without deleting the row,
    preserving an audit trail.
  - expires_at is set to now + 10 minutes on creation.

Index strategy:
  - user + purpose: composite index — the most common lookup
    is "give me the latest unused OTP for this user for this purpose"
  - expires_at: indexed for the cleanup Celery task that purges
    expired OTPs from the table daily.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


def _default_expiry():
    expiry_minutes = getattr(settings, "OTP_EXPIRY_MINUTES", 10)
    return timezone.now() + timezone.timedelta(minutes=expiry_minutes)


class OTP(TimeStampedModel):

    class Purpose(models.TextChoices):
        EMAIL_VERIFICATION = "email_verification", _("Email Verification")
        PASSWORD_RESET     = "password_reset",     _("Password Reset")
        CHANGE_EMAIL       = "change_email",        _("Change Email")
        DELETE_ACCOUNT     = "delete_account",      _("Delete Account")
        SENSITIVE_ACTION   = "sensitive_action",    _("Sensitive Action")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="otps",
        db_index=True,
    )
    purpose = models.CharField(
        max_length=30,
        choices=Purpose.choices,
        db_index=True,
    )
    code = models.CharField(
        max_length=6,
        help_text=_("6-digit numeric code."),
    )
    expires_at = models.DateTimeField(
        default=_default_expiry,
        db_index=True,
    )
    is_used = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table            = "otp"
        verbose_name        = _("OTP")
        verbose_name_plural = _("OTPs")
        ordering            = ["-created_at"]
        indexes = [
            # Primary lookup: latest unused OTP for a user + purpose
            models.Index(
                fields=["user", "purpose", "is_used"],
                name="idx_otp_user_purpose_used",
            ),
            # Cleanup task: find all expired OTPs
            models.Index(
                fields=["expires_at"],
                name="idx_otp_expires_at",
            ),
        ]

    def __str__(self) -> str:
        return f"OTP({self.purpose}) — {self.user.email}"

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    @property
    def is_valid(self) -> bool:
        return not self.is_used and not self.is_expired