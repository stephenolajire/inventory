# apps/verification/urls.py

from django.urls import path

from .views import (
    VerifyEmailView,
    ResendVerificationEmailView,
    VerificationStatusView,
)

app_name = "verification"

urlpatterns = [
    # POST /api/auth/verify-email/
    # Consumes the token from the email link and marks the user verified.
    path(
        "",
        VerifyEmailView.as_view(),
        name="verify-email",
    ),

    # POST /api/auth/verify-email/resend/
    # Sends a fresh verification link (rate-limited to 1 per 2 minutes).
    path(
        "resend/",
        ResendVerificationEmailView.as_view(),
        name="resend-verification",
    ),

    # GET /api/auth/verify-email/status/
    # Returns email_verified + account_status for the authenticated user.
    path(
        "status/",
        VerificationStatusView.as_view(),
        name="verification-status",
    ),
]