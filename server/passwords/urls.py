# apps/passwords/urls.py

from django.urls import path

from .views import (
    ForgotPasswordView,
    ResetPasswordViaTokenView,
    ResetPasswordViaOTPView,
)

app_name = "passwords"

urlpatterns = [
    # POST /api/auth/password/forgot/
    # Accepts an email and sends a reset link if the account exists.
    # Always returns 200 to prevent email enumeration.
    path(
        "forgot/",
        ForgotPasswordView.as_view(),
        name="forgot-password",
    ),

    # POST /api/auth/password/reset/token/
    # Consumes the raw token from the email link and sets a new password.
    path(
        "reset/token/",
        ResetPasswordViaTokenView.as_view(),
        name="reset-password-token",
    ),

    # POST /api/auth/password/reset/otp/
    # Alternative reset flow using a 6-digit OTP (for mobile / no-link flows).
    # Requires an OTP to have been requested first via POST /api/otp/request/.
    path(
        "reset/otp/",
        ResetPasswordViaOTPView.as_view(),
        name="reset-password-otp",
    ),
]