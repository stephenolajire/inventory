"""
apps/verification/serializers.py
=================================
Email verification serializers — all write-only input validators.
The API never returns a verification token in a response.
"""

from rest_framework import serializers


class VerifyEmailSerializer(serializers.Serializer):
    """
    Used in: POST /api/auth/verify/email/
    Client sends the raw token extracted from the link in the email.
    The view hashes it, looks it up and marks the user as verified.
    """

    token = serializers.CharField()


class ResendVerificationSerializer(serializers.Serializer):
    """
    Used in: POST /api/auth/verify/resend/
    Client sends their email to request a new verification link.
    Rate-limited at the view level.
    Returns 200 regardless of whether the email exists
    to prevent user enumeration.
    """

    email = serializers.EmailField()


class VerificationStatusSerializer(serializers.Serializer):
    """
    Used in: GET /api/auth/verify/status/
    Read-only response telling the frontend whether the
    currently authenticated user's email is verified.
    """

    email_verified    = serializers.BooleanField(read_only=True)
    email_verified_at = serializers.DateTimeField(
        read_only=True,
        allow_null=True,
    )