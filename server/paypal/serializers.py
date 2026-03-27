"""
apps/paypal/serializers.py
===========================
Serializers for the PayPal payment flow.

Write serializers (request bodies):
  CreateOrderSerializer       — POST /api/paypal/orders/create/
  CaptureOrderSerializer      — POST /api/paypal/orders/capture/
  CreateSubscriptionSerializer— POST /api/paypal/subscriptions/create/
  UpgradeOrderSerializer      — POST /api/paypal/orders/upgrade/

Read serializers (response bodies):
  PayPalOrderSerializer       — order detail / history
  PayPalSubscriptionSerializer— subscription detail
"""

from rest_framework import serializers

from subscriptions.models import SubscriptionPlan, VendorSubscription
from .models import PayPalOrder, PayPalSubscription


# ─────────────────────────────────────────────────────────────────────────────
# Write serializers
# ─────────────────────────────────────────────────────────────────────────────

class CreateOrderSerializer(serializers.Serializer):
    """
    POST /api/paypal/orders/create/

    Step 1 of the activation flow.
    Frontend sends plan + billing preferences.
    Backend creates a PayPal Order and returns the paypal_order_id
    for the frontend to open the PayPal checkout.
    """

    plan = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionPlan.objects.filter(is_active=True),
        help_text="SubscriptionPlan PK.",
    )
    billing_cycle = serializers.ChoiceField(
        choices=VendorSubscription.BillingCycle.choices,
        default=VendorSubscription.BillingCycle.MONTHLY,
    )
    currency = serializers.ChoiceField(
        choices=VendorSubscription.Currency.choices,
        default=VendorSubscription.Currency.NGN,
    )


class CaptureOrderSerializer(serializers.Serializer):
    """
    POST /api/paypal/orders/capture/

    Step 2 of the activation flow.
    Frontend sends back the paypal_order_id after buyer approval.
    Backend captures the payment and activates the subscription.
    """

    paypal_order_id = serializers.CharField(
        max_length=64,
        help_text="The PayPal Order ID returned in step 1.",
    )


class UpgradeOrderSerializer(serializers.Serializer):
    """
    POST /api/paypal/orders/upgrade/

    Two-step upgrade flow — same pattern as activation.
    Step 1: frontend POSTs new_plan to get a paypal_order_id.
    Step 2: frontend POSTs paypal_order_id to capture and swap plan.

    The `step` field controls which half of the flow is executed.
    """

    step = serializers.ChoiceField(
        choices=["create", "capture"],
        help_text='"create" to initiate, "capture" after buyer approval.',
    )
    new_plan = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionPlan.objects.filter(is_active=True),
        required=False,
        help_text="Required for step=create.",
    )
    billing_cycle = serializers.ChoiceField(
        choices=VendorSubscription.BillingCycle.choices,
        required=False,
    )
    paypal_order_id = serializers.CharField(
        max_length=64,
        required=False,
        help_text="Required for step=capture.",
    )

    def validate(self, data):
        step = data.get("step")
        if step == "create" and not data.get("new_plan"):
            raise serializers.ValidationError(
                {"new_plan": "new_plan is required for step=create."}
            )
        if step == "capture" and not data.get("paypal_order_id"):
            raise serializers.ValidationError(
                {"paypal_order_id": "paypal_order_id is required for step=capture."}
            )
        return data


class CreateSubscriptionSerializer(serializers.Serializer):
    """
    POST /api/paypal/subscriptions/create/

    Creates a recurring PayPal Billing Subscription.
    Returns the PayPal subscription ID and the approval URL
    the frontend must redirect to (or open in a popup).
    """

    plan = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionPlan.objects.filter(is_active=True),
    )
    billing_cycle = serializers.ChoiceField(
        choices=VendorSubscription.BillingCycle.choices,
        default=VendorSubscription.BillingCycle.MONTHLY,
    )
    currency = serializers.ChoiceField(
        choices=VendorSubscription.Currency.choices,
        default=VendorSubscription.Currency.NGN,
    )
    return_url = serializers.URLField(
        required=False,
        default="",
        help_text="Frontend URL PayPal redirects to after approval.",
    )
    cancel_url = serializers.URLField(
        required=False,
        default="",
        help_text="Frontend URL PayPal redirects to on cancel.",
    )


class CancelSubscriptionSerializer(serializers.Serializer):
    """
    POST /api/paypal/subscriptions/cancel/
    Requires OTP verification (mirrors the Stripe cancel flow).
    """

    otp_code = serializers.CharField(min_length=6, max_length=6)

    def validate_otp_code(self, value: str) -> str:
        if not value.isdigit():
            raise serializers.ValidationError("OTP must be 6 digits.")
        return value


# ─────────────────────────────────────────────────────────────────────────────
# Read serializers
# ─────────────────────────────────────────────────────────────────────────────

class PayPalOrderSerializer(serializers.ModelSerializer):
    """
    Read-only. Used in order history and debug endpoints.
    """

    class Meta:
        model  = PayPalOrder
        fields = [
            "id",
            "paypal_order_id",
            "intent",
            "amount",
            "currency",
            "status",
            "capture_id",
            "created_at",
        ]


class PayPalSubscriptionSerializer(serializers.ModelSerializer):
    """
    Read-only. Embedded in the vendor dashboard subscription detail
    when the vendor pays via PayPal recurring billing.
    """

    class Meta:
        model  = PayPalSubscription
        fields = [
            "id",
            "paypal_sub_id",
            "paypal_plan_id",
            "status",
            "next_billing_time",
            "last_payment_amount",
            "last_payment_time",
            "created_at",
        ]