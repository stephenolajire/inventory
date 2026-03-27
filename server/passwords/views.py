# apps/passwords/views.py

import hashlib
import logging
import secrets

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from .models import PasswordResetToken
from .serializers import (
    ForgotPasswordSerializer,
    ResetPasswordViaTokenSerializer,
    ResetPasswordViaOTPSerializer,
)

logger = logging.getLogger(__name__)
User   = get_user_model()


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


# ─────────────────────────────────────────────────────────────────────────────
# Forgot Password — request a reset link
# ─────────────────────────────────────────────────────────────────────────────

class ForgotPasswordView(APIView):
    """
    POST /api/auth/password/forgot/

    Accepts an email address and sends a password reset link if an
    account exists for that email.

    Always returns 200 regardless of whether the email is registered
    to prevent user enumeration.

    Flow:
      1. Validate email via ForgotPasswordSerializer.
      2. Look up user silently — return 200 if not found.
      3. Invalidate all existing unused tokens for this user.
      4. Generate a new raw token, hash it, persist the hash.
      5. Queue Celery task to send the reset email.
      6. Return 200 immediately — client does not wait for the email.
    """

    permission_classes = [AllowAny]
    serializer_class   = ForgotPasswordSerializer

    @extend_schema(
        summary="Request a password reset link via email",
        request=ForgotPasswordSerializer,
        responses={
            200: {"description": "Reset email sent if account exists."},
        },
    )
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        # Silent 200 if user not found — prevents enumeration
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            logger.info(
                "ForgotPasswordView — no active account for %s (silent)", email
            )
            return Response(
                {
                    "success": True,
                    "message": (
                        "If an account exists for that email, a password "
                        "reset link has been sent."
                    ),
                },
                status=status.HTTP_200_OK,
            )

        # ── Rate limit: one request per 2 minutes ──
        cooldown_seconds = 120
        latest = (
            PasswordResetToken.objects
            .filter(user=user)
            .order_by("-created_at")
            .first()
        )
        if latest:
            elapsed = (timezone.now() - latest.created_at).total_seconds()
            if elapsed < cooldown_seconds:
                wait = int(cooldown_seconds - elapsed)
                return Response(
                    {
                        "success":     False,
                        "message": (
                            f"Please wait {wait} seconds before requesting "
                            "another reset link."
                        ),
                        "code":        "rate_limited",
                        "retry_after": wait,
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        # ── Invalidate previous unused tokens ──
        PasswordResetToken.objects.filter(
            user    = user,
            is_used = False,
        ).update(is_used=True)

        # ── Generate and persist new token ──
        raw_token  = secrets.token_urlsafe(48)
        token_hash = _hash_token(raw_token)

        PasswordResetToken.objects.create(
            user       = user,
            token_hash = token_hash,
        )

        # ── Queue email task after DB write ──
        from passwords.tasks import send_password_reset_email
        send_password_reset_email.delay(str(user.id), raw_token)

        logger.info(
            "ForgotPasswordView — reset email queued | user=%s", user.email
        )

        return Response(
            {
                "success": True,
                "message": (
                    "If an account exists for that email, a password "
                    "reset link has been sent."
                ),
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Reset Password via Token (link-based)
# ─────────────────────────────────────────────────────────────────────────────

class ResetPasswordViaTokenView(APIView):
    """
    POST /api/auth/password/reset/token/

    Resets the user's password using the token from the email link.

    Flow:
      1. Validate input via ResetPasswordViaTokenSerializer
         (token, new_password, confirm_password — passwords must match
         and pass Django's validators).
      2. Hash the raw token and look it up.
      3. Verify the token is unused and not expired.
      4. Set the new password and mark the token as used in one
         atomic block.
      5. Return 200 — client should redirect to login.
    """

    permission_classes = [AllowAny]
    serializer_class   = ResetPasswordViaTokenSerializer

    @extend_schema(
        summary="Reset password using the token from the email link",
        request=ResetPasswordViaTokenSerializer,
        responses={
            200: {"description": "Password reset successfully."},
            400: {"description": "Token invalid/expired or passwords do not match."},
        },
    )
    def post(self, request):
        serializer = ResetPasswordViaTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        raw_token    = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]
        token_hash   = _hash_token(raw_token)

        # ── Look up token ──
        try:
            token = PasswordResetToken.objects.select_related("user").get(
                token_hash=token_hash
            )
        except PasswordResetToken.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "This reset link is invalid.",
                    "code":    "invalid_token",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Validate token state ──
        if token.is_used:
            return Response(
                {
                    "success": False,
                    "message": (
                        "This reset link has already been used. "
                        "Please request a new one."
                    ),
                    "code": "token_already_used",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if token.is_expired:
            return Response(
                {
                    "success": False,
                    "message": (
                        "This reset link has expired. "
                        "Please request a new one."
                    ),
                    "code": "token_expired",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Commit password change atomically ──
        with transaction.atomic():
            token.is_used = True
            token.save(update_fields=["is_used"])

            user = token.user
            user.set_password(new_password)
            user.save(update_fields=["password"])

        logger.info(
            "ResetPasswordViaTokenView — password reset | user=%s",
            token.user.email,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Your password has been reset successfully. "
                    "Please log in with your new password."
                ),
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Reset Password via OTP (code-based)
# ─────────────────────────────────────────────────────────────────────────────

class ResetPasswordViaOTPView(APIView):
    """
    POST /api/auth/password/reset/otp/

    Alternative reset flow for clients that prefer a 6-digit code
    over a link (e.g. mobile apps).

    The OTP must have been requested via:
      POST /api/otp/request/  { "purpose": "password_reset" }

    Flow:
      1. Validate input via ResetPasswordViaOTPSerializer
         (email, otp_code, new_password, confirm_password).
      2. Look up the user by email.
      3. Find the most recent valid OTP for this user with
         purpose = password_reset.
      4. Verify the submitted code matches.
      5. Mark OTP as used, set new password — atomically.
      6. Return 200.
    """

    permission_classes = [AllowAny]
    serializer_class   = ResetPasswordViaOTPSerializer

    @extend_schema(
        summary="Reset password using a 6-digit OTP code",
        request=ResetPasswordViaOTPSerializer,
        responses={
            200: {"description": "Password reset successfully."},
            400: {"description": "OTP invalid/expired or passwords do not match."},
        },
    )
    def post(self, request):
        serializer = ResetPasswordViaOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email        = serializer.validated_data["email"]
        otp_code     = serializer.validated_data["otp_code"]
        new_password = serializer.validated_data["new_password"]

        # ── Look up user ──
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # Vague message — don't confirm whether email exists
            return Response(
                {
                    "success": False,
                    "message": "Invalid email or OTP code.",
                    "code":    "invalid_credentials",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Look up OTP ──
        from otp.models import OTP

        otp = (
            OTP.objects
            .filter(
                user           = user,
                purpose        = OTP.Purpose.PASSWORD_RESET,
                is_used        = False,
                expires_at__gt = timezone.now(),
            )
            .order_by("-created_at")
            .first()
        )

        # Validate existence and code match via is_valid property
        if not otp or otp.code != otp_code or not otp.is_valid:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or expired OTP. Please request a new one.",
                    "code":    "invalid_otp",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Commit atomically ──
        with transaction.atomic():
            otp.is_used = True
            otp.save(update_fields=["is_used"])

            user.set_password(new_password)
            user.save(update_fields=["password"])

        logger.info(
            "ResetPasswordViaOTPView — password reset | user=%s", user.email
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Your password has been reset successfully. "
                    "Please log in with your new password."
                ),
            },
            status=status.HTTP_200_OK,
        )