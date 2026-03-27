# apps/otp/urls.py

from django.urls import path

from .views import (
    OTPRequestView,
    OTPVerifyView,
    OTPResendView,
    AuthenticatedOTPRequestView,
)

urlpatterns = [

    # ── Public (no auth required) ──
    # Used for: email verification at registration, password reset
    path(
        "request/",
        OTPRequestView.as_view(),
        name="otp-request",
    ),
    path(
        "verify/",
        OTPVerifyView.as_view(),
        name="otp-verify",
    ),
    path(
        "resend/",
        OTPResendView.as_view(),
        name="otp-resend",
    ),

    # ── Authenticated (JWT required) ──
    # Used for: delete account, change email, sensitive actions
    path(
        "request/authenticated/",
        AuthenticatedOTPRequestView.as_view(),
        name="otp-request-authenticated",
    ),

]