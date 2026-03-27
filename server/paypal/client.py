"""
apps/paypal/client.py
======================
Thin wrapper around the PayPal REST API (v2).
Uses only the standard `requests` library — no deprecated SDK.

Covers:
  - OAuth2 token management (cached in memory, refreshed on expiry)
  - Orders API  : create, capture
  - Subscriptions API: create, get, cancel
  - Webhook verification

Settings required in settings.py / env:
  PAYPAL_CLIENT_ID     — app client ID
  PAYPAL_CLIENT_SECRET — app secret
  PAYPAL_MODE          — "sandbox" | "live"  (default: "sandbox")
"""

import logging
import time
from decimal import Decimal
from typing import Any

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Base URL
# ─────────────────────────────────────────────────────────────────────────────

def _base_url() -> str:
    mode = getattr(settings, "PAYPAL_MODE", "sandbox").lower()
    if mode == "live":
        return "https://api-m.paypal.com"
    return "https://api-m.sandbox.paypal.com"


# ─────────────────────────────────────────────────────────────────────────────
# Token cache — module-level so one token is shared across requests
# ─────────────────────────────────────────────────────────────────────────────

_token_cache: dict[str, Any] = {
    "access_token": None,
    "expires_at":   0,
}


def _get_access_token() -> str:
    """
    Returns a valid OAuth2 bearer token, refreshing if expired.
    Token is cached in the module-level _token_cache dict.
    """
    now = time.time()
    if _token_cache["access_token"] and now < _token_cache["expires_at"] - 30:
        return _token_cache["access_token"]

    url = f"{_base_url()}/v1/oauth2/token"
    resp = requests.post(
        url,
        auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET),
        data={"grant_type": "client_credentials"},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()

    _token_cache["access_token"] = data["access_token"]
    _token_cache["expires_at"]   = now + data.get("expires_in", 3600)

    logger.debug("PayPal token refreshed.")
    return _token_cache["access_token"]


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {_get_access_token()}",
        "Content-Type":  "application/json",
        "Prefer":        "return=representation",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Orders API
# ─────────────────────────────────────────────────────────────────────────────

def create_order(
    amount: Decimal,
    currency: str,
    reference_id: str,
    description: str = "",
    return_url: str  = "",
    cancel_url: str  = "",
) -> dict:
    """
    Creates a PayPal Order (CAPTURE intent).

    Returns the full PayPal order object.
    The `id` field is what the frontend uses to render the PayPal button
    and what the backend receives on capture.

    Args:
        amount:       Charge amount (e.g. Decimal("5000.00")).
        currency:     ISO 4217 code (e.g. "NGN", "USD").
        reference_id: Your internal reference (vendor_id or subscription_id).
        description:  Short description shown on the PayPal checkout page.
        return_url:   Redirect URL after approval (required for redirect flow).
        cancel_url:   Redirect URL if buyer cancels.
    """
    payload: dict = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": reference_id,
                "description":  description,
                "amount": {
                    "currency_code": currency,
                    "value":         str(amount),
                },
            }
        ],
    }

    if return_url or cancel_url:
        payload["application_context"] = {
            "return_url": return_url,
            "cancel_url": cancel_url,
        }

    url  = f"{_base_url()}/v2/checkout/orders"
    resp = requests.post(url, json=payload, headers=_headers(), timeout=15)

    if not resp.ok:
        logger.error(
            "PayPal create_order failed | status=%s | body=%s",
            resp.status_code,
            resp.text,
        )
        resp.raise_for_status()

    return resp.json()


def capture_order(paypal_order_id: str) -> dict:
    """
    Captures an approved PayPal order.
    Call this after the buyer approves the order on the frontend.

    Returns the full capture response — check
    response["status"] == "COMPLETED" for success.
    """
    url  = f"{_base_url()}/v2/checkout/orders/{paypal_order_id}/capture"
    resp = requests.post(url, json={}, headers=_headers(), timeout=15)

    if not resp.ok:
        logger.error(
            "PayPal capture_order failed | order_id=%s | status=%s | body=%s",
            paypal_order_id,
            resp.status_code,
            resp.text,
        )
        resp.raise_for_status()

    return resp.json()


def get_order(paypal_order_id: str) -> dict:
    """
    Retrieves a PayPal order by ID.
    Useful for double-checking status before activating a subscription.
    """
    url  = f"{_base_url()}/v2/checkout/orders/{paypal_order_id}"
    resp = requests.get(url, headers=_headers(), timeout=10)
    resp.raise_for_status()
    return resp.json()


# ─────────────────────────────────────────────────────────────────────────────
# Subscriptions API
# ─────────────────────────────────────────────────────────────────────────────

def create_paypal_subscription(
    plan_id: str,
    subscriber_email: str,
    subscriber_name: str,
    custom_id: str = "",
    return_url: str = "",
    cancel_url: str = "",
) -> dict:
    """
    Creates a PayPal Billing Subscription against a pre-created PayPal Plan.

    Args:
        plan_id:          PayPal Billing Plan ID (e.g. "P-XXXXXXXXXXXXXXXX").
                          Create billing plans once via the PayPal dashboard
                          or the /v1/billing/plans API and store the IDs in
                          your SubscriptionPlan model or settings.
        subscriber_email: Buyer's email.
        subscriber_name:  Buyer's full name.
        custom_id:        Your internal reference (vendor_id).
        return_url:       Redirect after approval.
        cancel_url:       Redirect on cancel.

    Returns the PayPal subscription object.
    The `id` field is the PayPal subscription ID (I-XXXXXXXXX).
    The `links` list contains the approval URL to redirect the buyer to.
    """
    payload: dict = {
        "plan_id":    plan_id,
        "custom_id":  custom_id,
        "subscriber": {
            "name":          {"given_name": subscriber_name},
            "email_address": subscriber_email,
        },
        "application_context": {
            "brand_name":          "StockSense",
            "locale":              "en-US",
            "shipping_preference": "NO_SHIPPING",
            "user_action":         "SUBSCRIBE_NOW",
            "payment_method": {
                "payer_selected":  "PAYPAL",
                "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED",
            },
            "return_url": return_url,
            "cancel_url": cancel_url,
        },
    }

    url  = f"{_base_url()}/v1/billing/subscriptions"
    resp = requests.post(url, json=payload, headers=_headers(), timeout=15)

    if not resp.ok:
        logger.error(
            "PayPal create_subscription failed | plan_id=%s | status=%s | body=%s",
            plan_id,
            resp.status_code,
            resp.text,
        )
        resp.raise_for_status()

    return resp.json()


def get_paypal_subscription(paypal_sub_id: str) -> dict:
    """
    Retrieves the current state of a PayPal Billing Subscription.
    Use this in webhooks to sync status changes.
    """
    url  = f"{_base_url()}/v1/billing/subscriptions/{paypal_sub_id}"
    resp = requests.get(url, headers=_headers(), timeout=10)
    resp.raise_for_status()
    return resp.json()


def cancel_paypal_subscription(paypal_sub_id: str, reason: str = "Cancelled by user") -> None:
    """
    Cancels a PayPal Billing Subscription immediately.
    PayPal returns 204 No Content on success.
    """
    url     = f"{_base_url()}/v1/billing/subscriptions/{paypal_sub_id}/cancel"
    payload = {"reason": reason}
    resp    = requests.post(url, json=payload, headers=_headers(), timeout=10)

    if resp.status_code not in (200, 204):
        logger.error(
            "PayPal cancel_subscription failed | sub_id=%s | status=%s | body=%s",
            paypal_sub_id,
            resp.status_code,
            resp.text,
        )
        resp.raise_for_status()


# ─────────────────────────────────────────────────────────────────────────────
# Webhook signature verification
# ─────────────────────────────────────────────────────────────────────────────

def verify_webhook_signature(
    transmission_id: str,
    timestamp: str,
    webhook_id: str,
    event_body: str,
    cert_url: str,
    actual_signature: str,
    auth_algo: str,
) -> bool:
    """
    Verifies a PayPal webhook signature via the PayPal API.

    All values come from the inbound webhook HTTP headers:
      PAYPAL-TRANSMISSION-ID    → transmission_id
      PAYPAL-TRANSMISSION-TIME  → timestamp
      PAYPAL-CERT-URL           → cert_url
      PAYPAL-TRANSMISSION-SIG   → actual_signature
      PAYPAL-AUTH-ALGO          → auth_algo

    webhook_id comes from your PayPal app webhook configuration
    (stored in settings.PAYPAL_WEBHOOK_ID).

    Returns True if verified, False otherwise.
    """
    url     = f"{_base_url()}/v1/notifications/verify-webhook-signature"
    payload = {
        "transmission_id":   transmission_id,
        "transmission_time": timestamp,
        "cert_url":          cert_url,
        "auth_algo":         auth_algo,
        "transmission_sig":  actual_signature,
        "webhook_id":        webhook_id,
        "webhook_event":     event_body,
    }

    try:
        resp = requests.post(url, json=payload, headers=_headers(), timeout=10)
        if not resp.ok:
            logger.warning(
                "PayPal webhook verification API error | status=%s | body=%s",
                resp.status_code,
                resp.text,
            )
            return False

        return resp.json().get("verification_status") == "SUCCESS"

    except Exception as exc:
        logger.error("PayPal webhook verification exception: %s", exc)
        return False