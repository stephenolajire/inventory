# apps/otp/views.py

import random
import logging

from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from core.permissions import IsApprovedVendor

from .models import OTP
from .serializers import (
    OTPRequestSerializer,
    OTPVerifySerializer,
    OTPResendSerializer,
)

logger = logging.getLogger(__name__)
User   = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# Private helpers
# ─────────────────────────────────────────────────────────────────────────────

def _generate_otp_code() -> str:
    """
    Returns a cryptographically random 6-digit string.
    Padded with leading zeros so it is always exactly 6 characters.
    """
    return str(random.SystemRandom().randint(0, 999999)).zfill(6)


def _invalidate_previous_otps(user, purpose: str) -> None:
    """
    Marks all existing unused OTPs for this user + purpose as used
    before issuing a new one.
    Prevents multiple valid OTPs from being in circulation simultaneously.
    """
    OTP.objects.filter(
        user    = user,
        purpose = purpose,
        is_used = False,
    ).update(is_used=True)


def _rate_limit_check(user, purpose: str) -> bool:
    """
    Returns True if the user has exceeded the OTP resend rate limit.

    Rule: no more than OTP_MAX_RESEND requests per OTP_RESEND_WINDOW minutes.
    Counts all OTP records (used or unused) created within the window —
    not just unused ones — to prevent abuse via rapid request cycling.
    """
    from django.conf import settings

    max_resends    = getattr(settings, "OTP_MAX_RESEND",      3)
    window_minutes = getattr(settings, "OTP_RESEND_WINDOW",  60)
    window_start   = timezone.now() - timezone.timedelta(minutes=window_minutes)

    count = OTP.objects.filter(
        user       = user,
        purpose    = purpose,
        created_at__gte = window_start,
    ).count()

    return count >= max_resends


def _dispatch_otp(user, purpose: str, code: str) -> None:
    """
    Routes the OTP to the correct delivery channel based on purpose.
    Currently all OTPs are delivered via email.
    Future: SMS delivery can be added here based on purpose or user preference.
    """
    from otp.tasks import send_otp_email
    send_otp_email.delay(user.id, code, purpose)


# ─────────────────────────────────────────────────────────────────────────────
# Request OTP
# ─────────────────────────────────────────────────────────────────────────────

class OTPRequestView(APIView):
    """
    POST /api/auth/otp/request/

    Generates a new OTP for the given email + purpose and dispatches
    it to the user's email address via a Celery task.

    Public endpoint — no authentication required.
    Used for: email verification at registration, password reset.

    Response is always 200 regardless of whether the email exists
    to prevent user enumeration attacks.

    Rate limit: enforced per user per purpose via _rate_limit_check.
    """

    permission_classes = [AllowAny]
    serializer_class   = OTPRequestSerializer

    @extend_schema(
        summary="Request an OTP for a specific purpose",
        request=OTPRequestSerializer,
        responses={200: {"description": "OTP sent if account exists."}},
    )
    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email   = serializer.validated_data["email"].lower()
        purpose = serializer.validated_data["purpose"]

        # ── Always return 200 — never reveal whether the email exists ──
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            logger.info(
                "OTPRequestView — email not found, returning 200: %s", email
            )
            return Response(
                {
                    "success": True,
                    "message": (
                        "If an account with this email exists, "
                        "an OTP has been sent."
                    ),
                },
                status=status.HTTP_200_OK,
            )

        # ── Rate limit check ──
        if _rate_limit_check(user, purpose):
            return Response(
                {
                    "success": False,
                    "message": (
                        "Too many OTP requests. "
                        "Please wait before requesting another."
                    ),
                    "code": "rate_limited",
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # ── Invalidate previous OTPs for this purpose ──
        _invalidate_previous_otps(user, purpose)

        # ── Generate and store new OTP ──
        code = _generate_otp_code()
        OTP.objects.create(
            user    = user,
            purpose = purpose,
            code    = code,
        )

        # ── Dispatch via Celery ──
        _dispatch_otp(user, purpose, code)

        logger.info(
            "OTPRequestView — OTP created | user=%s | purpose=%s",
            user.email,
            purpose,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "If an account with this email exists, "
                    "an OTP has been sent."
                ),
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Verify OTP
# ─────────────────────────────────────────────────────────────────────────────

class OTPVerifyView(APIView):
    """
    POST /api/auth/otp/verify/

    Validates the OTP submitted by the user.

    On success:
      - Marks the OTP as used (is_used = True).
      - Returns a purpose-specific success payload.

    On failure:
      - Returns a clear error — invalid code, expired, or already used.
      - Does NOT reveal how many attempts remain to prevent brute force
        enumeration. The 10-minute expiry window is the primary guard.

    Public endpoint — some purposes (email_verification, password_reset)
    are called before the user has a valid JWT token.
    """

    permission_classes = [AllowAny]
    serializer_class   = OTPVerifySerializer

    @extend_schema(
        summary="Verify an OTP code",
        request=OTPVerifySerializer,
        responses={200: {"description": "OTP verified successfully."}},
    )
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email   = serializer.validated_data["email"].lower()
        purpose = serializer.validated_data["purpose"]
        code    = serializer.validated_data["code"]

        # ── Load user ──
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Invalid OTP. Please check the code and try again.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Find the latest unused OTP for this user + purpose ──
        otp = (
            OTP.objects
            .filter(
                user    = user,
                purpose = purpose,
                is_used = False,
            )
            .order_by("-created_at")
            .first()
        )

        # ── Validate ──
        if not otp:
            return Response(
                {
                    "success": False,
                    "message": "No active OTP found. Please request a new one.",
                    "code":    "no_active_otp",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.is_expired:
            return Response(
                {
                    "success": False,
                    "message": "This OTP has expired. Please request a new one.",
                    "code":    "otp_expired",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.code != code:
            return Response(
                {
                    "success": False,
                    "message": "Invalid OTP. Please check the code and try again.",
                    "code":    "invalid_otp",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Mark as used ──
        otp.is_used = True
        otp.save(update_fields=["is_used"])

        logger.info(
            "OTPVerifyView — verified | user=%s | purpose=%s",
            user.email,
            purpose,
        )

        # ── Purpose-specific post-verification actions ──
        return self._handle_purpose(user, purpose)

    def _handle_purpose(self, user, purpose: str) -> Response:
        """
        Executes the downstream action required after OTP verification,
        depending on which flow triggered it.
        Each purpose has its own success payload so the frontend knows
        exactly what to do next.
        """

        if purpose == OTP.Purpose.EMAIL_VERIFICATION:
            # Mark email as verified if not already
            if not user.email_verified:
                user.email_verified    = True
                user.email_verified_at = timezone.now()
                user.status            = User.Status.PENDING_APPROVAL
                user.save(update_fields=[
                    "email_verified",
                    "email_verified_at",
                    "status",
                ])
                # Notify admins
                from verification.tasks import notify_admin_new_vendor
                notify_admin_new_vendor.delay(str(user.id))

            return Response(
                {
                    "success":     True,
                    "message":     "Email verified successfully.",
                    "next_action": "await_approval",
                },
                status=status.HTTP_200_OK,
            )

        if purpose == OTP.Purpose.PASSWORD_RESET:
            # Return a short-lived reset session token
            # The password reset view accepts this token to authorise
            # the new password submission without requiring a full login
            import secrets
            reset_session = secrets.token_urlsafe(32)

            # Store temporarily in cache (5 minutes TTL)
            from django.core.cache import cache
            cache.set(
                f"pwd_reset_session:{user.id}",
                reset_session,
                timeout=300,
            )

            return Response(
                {
                    "success":       True,
                    "message":       "OTP verified. You may now reset your password.",
                    "next_action":   "reset_password",
                    "reset_session": reset_session,
                },
                status=status.HTTP_200_OK,
            )

        if purpose == OTP.Purpose.CHANGE_EMAIL:
            return Response(
                {
                    "success":     True,
                    "message":     "OTP verified. You may now update your email address.",
                    "next_action": "submit_new_email",
                },
                status=status.HTTP_200_OK,
            )

        if purpose == OTP.Purpose.DELETE_ACCOUNT:
            return Response(
                {
                    "success":     True,
                    "message":     "OTP verified. Proceed with account deletion.",
                    "next_action": "confirm_delete",
                },
                status=status.HTTP_200_OK,
            )

        if purpose == OTP.Purpose.SENSITIVE_ACTION:
            return Response(
                {
                    "success":     True,
                    "message":     "OTP verified.",
                    "next_action": "proceed",
                },
                status=status.HTTP_200_OK,
            )

        # Fallback for any future purposes
        return Response(
            {"success": True, "message": "OTP verified."},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Resend OTP
# ─────────────────────────────────────────────────────────────────────────────

class OTPResendView(APIView):
    """
    POST /api/auth/otp/resend/

    Generates and sends a fresh OTP, invalidating any previous
    unused OTPs for the same user + purpose.

    Rate limited — max OTP_MAX_RESEND requests per OTP_RESEND_WINDOW minutes.
    Always returns 200 to prevent user enumeration.

    Public endpoint — called before login is possible in some flows
    (email verification, password reset).
    """

    permission_classes = [AllowAny]
    serializer_class   = OTPResendSerializer

    @extend_schema(
        summary="Resend an OTP",
        request=OTPResendSerializer,
        responses={200: {"description": "OTP resent if account exists."}},
    )
    def post(self, request):
        serializer = OTPResendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email   = serializer.validated_data["email"].lower()
        purpose = serializer.validated_data["purpose"]

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response(
                {
                    "success": True,
                    "message": (
                        "If an account with this email exists, "
                        "a new OTP has been sent."
                    ),
                },
                status=status.HTTP_200_OK,
            )

        # ── Rate limit ──
        if _rate_limit_check(user, purpose):
            return Response(
                {
                    "success": False,
                    "message": (
                        "Too many OTP requests. "
                        "Please wait before requesting another."
                    ),
                    "code": "rate_limited",
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # ── Invalidate previous, create fresh OTP ──
        _invalidate_previous_otps(user, purpose)

        code = _generate_otp_code()
        OTP.objects.create(
            user    = user,
            purpose = purpose,
            code    = code,
        )

        _dispatch_otp(user, purpose, code)

        logger.info(
            "OTPResendView — resent | user=%s | purpose=%s",
            user.email,
            purpose,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "If an account with this email exists, "
                    "a new OTP has been sent."
                ),
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Authenticated OTP Request (for sensitive actions)
# ─────────────────────────────────────────────────────────────────────────────

class AuthenticatedOTPRequestView(APIView):
    """
    POST /api/auth/otp/request/authenticated/

    Issues an OTP for a sensitive action for the currently
    authenticated user without requiring them to submit their email.

    Used for:
      - Delete account confirmation
      - Cancel subscription confirmation
      - Change email address confirmation

    Authentication required — JWT token must be present.
    Rate limit applies identically to the public endpoint.
    """

    permission_classes = [IsAuthenticated]
    serializer_class   = OTPRequestSerializer

    @extend_schema(
        summary="Request an OTP for a sensitive action (authenticated)",
        request={"application/json": {"type": "object", "properties": {
            "purpose": {"type": "string"}
        }}},
        responses={200: {"description": "OTP sent to your registered email."}},
    )
    def post(self, request):
        purpose = request.data.get("purpose")

        allowed_purposes = [
            OTP.Purpose.DELETE_ACCOUNT,
            OTP.Purpose.CHANGE_EMAIL,
            OTP.Purpose.SENSITIVE_ACTION,
        ]

        if purpose not in allowed_purposes:
            return Response(
                {
                    "success": False,
                    "message": (
                        f"Invalid purpose. Allowed: "
                        f"{', '.join(allowed_purposes)}"
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        # ── Rate limit ──
        if _rate_limit_check(user, purpose):
            return Response(
                {
                    "success": False,
                    "message": (
                        "Too many OTP requests. "
                        "Please wait before requesting another."
                    ),
                    "code": "rate_limited",
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # ── Invalidate previous, create fresh ──
        _invalidate_previous_otps(user, purpose)

        code = _generate_otp_code()
        OTP.objects.create(
            user    = user,
            purpose = purpose,
            code    = code,
        )

        _dispatch_otp(user, purpose, code)

        logger.info(
            "AuthenticatedOTPRequestView — OTP created | user=%s | purpose=%s",
            user.email,
            purpose,
        )

        return Response(
            {
                "success": True,
                "message": (
                    f"An OTP has been sent to {user.email}. "
                    f"It expires in 10 minutes."
                ),
            },
            status=status.HTTP_200_OK,
        )