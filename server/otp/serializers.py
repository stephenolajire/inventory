"""
apps/otp/serializers.py
=======================
OTP serializers are all write-only input validators.
The API never returns an OTP code in a response.
"""

from rest_framework import serializers

from .models import OTP


class OTPRequestSerializer(serializers.Serializer):
    """
    Used in: POST /api/auth/otp/request/
    Client sends their email and the purpose they need an OTP for.
    The view generates and dispatches the OTP via Celery.
    """

    email   = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=OTP.Purpose.choices)


class OTPVerifySerializer(serializers.Serializer):
    """
    Used in: POST /api/auth/otp/verify/
    Client sends email, purpose and the code they received.
    The view validates the OTP and marks it used.
    """

    email   = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=OTP.Purpose.choices)
    code    = serializers.CharField(
        max_length=6,
        min_length=6,
    )

    def validate_code(self, value: str) -> str:
        if not value.isdigit():
            raise serializers.ValidationError(
                "OTP must be a 6-digit number."
            )
        return value


class OTPResendSerializer(serializers.Serializer):
    """
    Used in: POST /api/auth/otp/resend/
    Rate-limited at the view level — max 3 resends per hour.
    """

    email   = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=OTP.Purpose.choices)