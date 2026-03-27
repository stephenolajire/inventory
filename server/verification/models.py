"""
apps/verification/models.py
============================
Email verification token storage.
Separate from PasswordResetToken because the purpose,
expiry rules and downstream actions differ significantly.

Design decisions:
  - token_hash is stored instead of the raw token (same pattern
    as PasswordResetToken) — the raw token only exists in the
    email link.
  - One active token per user — requesting a new one invalidates
    the previous one.
  - expires_at defaults to 24 hours (configurable via settings).

Index strategy:
  - token_hash: unique + db_index (lookup by URL token)
  - user + is_used: composite (find active token for a user)
  - expires_at: indexed for daily cleanup task
"""

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


def _default_expiry():
    hours = getattr(settings, "VERIFICATION_TOKEN_EXPIRY_HOURS", 24)
    return timezone.now() + timezone.timedelta(hours=hours)


class EmailVerificationToken(TimeStampedModel):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verification_tokens",
        db_index=True,
    )
    token_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text=_("SHA-256 hash of the raw verification token."),
    )
    expires_at = models.DateTimeField(
        default=_default_expiry,
        db_index=True,
    )
    is_used = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table            = "email_verification_token"
        verbose_name        = _("Email Verification Token")
        verbose_name_plural = _("Email Verification Tokens")
        ordering            = ["-created_at"]
        indexes = [
            models.Index(
                fields=["user", "is_used"],
                name="idx_email_ver_user_used",
            ),
            models.Index(
                fields=["expires_at"],
                name="idx_email_ver_expires",
            ),
        ]

    def __str__(self) -> str:
        return f"EmailVerificationToken — {self.user.email}"

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    @property
    def is_valid(self) -> bool:
        return not self.is_used and not self.is_expired