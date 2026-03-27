"""
apps/passwords/serializers.py
==============================
All password serializers are write-only.
No serializer in this module ever returns a password or token.
"""

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


class ForgotPasswordSerializer(serializers.Serializer):
    """
    Used in: POST /api/auth/password/forgot/
    Client sends their email. The view generates a reset token
    and dispatches the email link via Celery.
    Always returns 200 regardless of whether the email exists
    to prevent user enumeration.
    """

    email = serializers.EmailField()


class ResetPasswordViaTokenSerializer(serializers.Serializer):
    """
    Used in: POST /api/auth/password/reset/token/
    Client sends the raw token from the email link
    plus their new password.
    """

    token            = serializers.CharField()
    new_password     = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    def validate_new_password(self, value: str) -> str:
        validate_password(value)
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs


class ResetPasswordViaOTPSerializer(serializers.Serializer):
    """
    Used in: POST /api/auth/password/reset/otp/
    Alternative reset flow using a 6-digit OTP
    instead of a token link.
    """

    email            = serializers.EmailField()
    otp_code         = serializers.CharField(max_length=6, min_length=6)
    new_password     = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    def validate_otp_code(self, value: str) -> str:
        if not value.isdigit():
            raise serializers.ValidationError("OTP must be 6 digits.")
        return value

    def validate_new_password(self, value: str) -> str:
        validate_password(value)
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs