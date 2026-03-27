# apps/paypal/urls.py
"""
URL configuration for the PayPal app.

Mount this in your root urls.py:
    path("api/paypal/", include("paypal.urls")),

Endpoints produced:
  POST  /api/paypal/orders/create/          — create PayPal order (activation step 1)
  POST  /api/paypal/orders/capture/         — capture after buyer approval (step 2)
  POST  /api/paypal/orders/upgrade/         — upgrade order (step=create|capture)
  GET   /api/paypal/orders/                 — list vendor's order history

  POST  /api/paypal/subscriptions/create/   — create recurring PayPal subscription
  POST  /api/paypal/subscriptions/cancel/   — cancel recurring subscription (OTP)
  GET   /api/paypal/subscriptions/me/       — vendor's active PayPal subscription

  POST  /api/paypal/webhook/                — PayPal webhook receiver (AllowAny)
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    PayPalOrderViewSet,
    PayPalSubscriptionViewSet,
    PayPalWebhookViewSet,
)

router = DefaultRouter()

router.register(
    prefix   = "orders",
    viewset  = PayPalOrderViewSet,
    basename = "paypal-orders",
)

router.register(
    prefix   = "subscriptions",
    viewset  = PayPalSubscriptionViewSet,
    basename = "paypal-subscriptions",
)

router.register(
    prefix   = "webhook",
    viewset  = PayPalWebhookViewSet,
    basename = "paypal-webhook",
)

urlpatterns = [
    path("", include(router.urls)),
]