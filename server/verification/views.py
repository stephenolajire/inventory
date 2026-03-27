# apps/verification/views.py

import hashlib
import logging

from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from .models import EmailVerificationToken
from .serializers import (
    VerifyEmailSerializer,
    ResendVerificationSerializer,
    VerificationStatusSerializer,
)

logger = logging.getLogger(__name__)
User   = get_user_model()


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


# ─────────────────────────────────────────────────────────────────────────────
# Verify Email
# ─────────────────────────────────────────────────────────────────────────────

class VerifyEmailView(APIView):
    """
    POST /api/auth/verify/email/

    Verifies a vendor's email address using the token sent during
    registration.

    Flow:
      1. Validate input via VerifyEmailSerializer.
      2. Look up the token by its SHA-256 hash.
      3. Check it is unused and not expired.
      4. Mark the token as used.
      5. Mark the user as email_verified and advance status to
         pending_approval.
      6. Queue a Celery task to notify admins of the new application.
      7. Return 200 — the vendor can now wait for admin approval.
    """

    permission_classes = [AllowAny]
    serializer_class   = VerifyEmailSerializer

    @extend_schema(
        summary="Verify email address using token from the verification link",
        request=VerifyEmailSerializer,
        responses={
            200: {"description": "Email verified successfully."},
            400: {"description": "Token is invalid, expired, or already used."},
        },
    )
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        raw_token  = serializer.validated_data["token"]
        token_hash = _hash_token(raw_token)

        # ── Look up token ──
        try:
            token = EmailVerificationToken.objects.select_related("user").get(
                token_hash=token_hash
            )
        except EmailVerificationToken.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "This verification link is invalid.",
                    "code":    "invalid_token",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Validate ──
        if token.is_used:
            return Response(
                {
                    "success": False,
                    "message": (
                        "This verification link has already been used. "
                        "Please log in or request a new link."
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
                        "This verification link has expired. "
                        "Please request a new one."
                    ),
                    "code": "token_expired",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = token.user

        # ── Guard: already verified (idempotent) ──
        if user.email_verified:
            return Response(
                {
                    "success": True,
                    "message": "Your email is already verified. Please log in.",
                },
                status=status.HTTP_200_OK,
            )

        # ── Commit verification ──
        token.is_used = True
        token.save(update_fields=["is_used"])

        user.email_verified    = True
        user.email_verified_at = timezone.now()
        user.status            = User.Status.PENDING_APPROVAL
        user.save(update_fields=["email_verified", "email_verified_at", "status"])

        logger.info(
            "VerifyEmailView — email verified | user=%s | status=pending_approval",
            user.email,
        )

        # ── Notify admins after DB write ──
        from verification.tasks import notify_admin_new_vendor
        notify_admin_new_vendor.delay(str(user.id))

        return Response(
            {
                "success": True,
                "message": (
                    "Your email has been verified. Your application is now "
                    "under review — we will notify you once approved."
                ),
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Resend Verification Email
# ─────────────────────────────────────────────────────────────────────────────

class ResendVerificationEmailView(APIView):
    """
    POST /api/auth/verify/resend/

    Allows an unverified vendor to request a fresh verification link.

    Rate limiting: one resend per 2 minutes, enforced by checking the
    created_at timestamp of the most recent token for this user.

    The actual email is sent by the resend_verification_email Celery
    task so this endpoint returns immediately without waiting for the
    email to dispatch.
    """

    permission_classes = [AllowAny]
    serializer_class   = ResendVerificationSerializer

    @extend_schema(
        summary="Resend the email verification link",
        request=ResendVerificationSerializer,
        responses={
            200: {"description": "Verification email sent (or silently skipped if already verified)."},
            429: {"description": "Rate limit — please wait before requesting another link."},
        },
    )
    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        # ── Look up user — always return 200 to avoid email enumeration ──
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.info(
                "ResendVerificationEmailView — no account for %s (silent)", email
            )
            return Response(
                {
                    "success": True,
                    "message": (
                        "If an unverified account exists for that email, "
                        "a new verification link has been sent."
                    ),
                },
                status=status.HTTP_200_OK,
            )

        # ── Already verified — nothing to do ──
        if user.email_verified:
            return Response(
                {
                    "success": True,
                    "message": "This email is already verified. Please log in.",
                },
                status=status.HTTP_200_OK,
            )

        # ── Rate limit: one email per 2 minutes ──
        cooldown_seconds = 120
        latest_token = (
            EmailVerificationToken.objects
            .filter(user=user)
            .order_by("-created_at")
            .first()
        )

        if latest_token:
            elapsed = (timezone.now() - latest_token.created_at).total_seconds()
            if elapsed < cooldown_seconds:
                wait = int(cooldown_seconds - elapsed)
                return Response(
                    {
                        "success":     False,
                        "message": (
                            f"Please wait {wait} seconds before requesting "
                            "another verification link."
                        ),
                        "code":        "rate_limited",
                        "retry_after": wait,
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        # ── Queue the resend task ──
        from verification.tasks import resend_verification_email
        resend_verification_email.delay(str(user.id))

        logger.info(
            "ResendVerificationEmailView — resend queued | user=%s", user.email
        )

        return Response(
            {
                "success": True,
                "message": (
                    "A new verification link has been sent to your email. "
                    "Please check your inbox."
                ),
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Check Verification Status
# ─────────────────────────────────────────────────────────────────────────────

class VerificationStatusView(APIView):
    """
    GET /api/auth/verify/status/

    Returns the current email verification status for the authenticated
    user. Useful for polling on the frontend "waiting for verification"
    screen.
    """

    permission_classes = [IsAuthenticated]
    serializer_class   = VerificationStatusSerializer

    @extend_schema(
        summary="Check the verification status of the current user",
        responses={200: VerificationStatusSerializer},
    )
    def get(self, request):
        serializer = VerificationStatusSerializer(request.user)
        return Response(
            {
                "success": True,
                "data":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )