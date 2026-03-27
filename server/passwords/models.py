"""
apps/passwords/models.py
========================
Password reset token storage.
Separate from OTP — reset tokens are long random strings
sent as URL links, not 6-digit codes typed by the user.

Design decisions:
  - token is stored as a hash (SHA-256) so the raw token only
    ever exists in the email link. Database compromise does not
    expose usable tokens.
  - is_used + expires_at prevent replay attacks.
  - One active token per user at a time — when a new one is
    requested, previous tokens for that user are invalidated.

Index strategy:
  - token_hash: unique + db_index (primary lookup by URL token)
  - user + is_used: composite (find active token for a user)
  - expires_at: indexed for cleanup task
"""

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


def _default_expiry():
    hours = getattr(settings, "PASSWORD_RESET_TOKEN_EXPIRY_HOURS", 24)
    return timezone.now() + timezone.timedelta(hours=hours)


class PasswordResetToken(TimeStampedModel):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
        db_index=True,
    )
    # SHA-256 hash of the raw token — raw token only lives in the email link
    token_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
    )
    expires_at = models.DateTimeField(
        default=_default_expiry,
        db_index=True,
    )
    is_used = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table            = "password_reset_token"
        verbose_name        = _("Password Reset Token")
        verbose_name_plural = _("Password Reset Tokens")
        ordering            = ["-created_at"]
        indexes = [
            models.Index(
                fields=["user", "is_used"],
                name="idx_pwd_reset_user_used",
            ),
            models.Index(
                fields=["expires_at"],
                name="idx_pwd_reset_expires",
            ),
        ]

    def __str__(self) -> str:
        return f"PasswordResetToken — {self.user.email}"

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    @property
    def is_valid(self) -> bool:
        return not self.is_used and not self.is_expired