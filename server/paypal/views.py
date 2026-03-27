"""
apps/paypal/views.py
=====================
PayPal payment flow — two-step (create → capture) pattern.

Endpoints:
  POST /api/paypal/orders/create/           — create a PayPal Order
  POST /api/paypal/orders/capture/          — capture after buyer approval
  POST /api/paypal/orders/upgrade/          — create or capture upgrade order
  POST /api/paypal/subscriptions/create/    — create a recurring PayPal sub
  POST /api/paypal/subscriptions/cancel/    — cancel recurring sub (OTP required)
  POST /api/paypal/webhook/                 — PayPal webhook receiver
  GET  /api/paypal/orders/                  — list vendor's PayPal orders
  GET  /api/paypal/subscriptions/me/        — vendor's active PayPal subscription

Design notes:
  - No Stripe imports — zero coupling to the Stripe subscriptions app.
  - VendorSubscription records are still created/updated here so the rest of
    the platform (product limits, notifications, etc.) keeps working unchanged.
  - Proration math is identical to the Stripe flow; only the payment call differs.
"""

import json
import logging
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from drf_spectacular.utils import extend_schema

from core.permissions import IsApprovedVendor
from notifications.models import Notification
from subscriptions.models import (
    SubscriptionPlan,
    VendorSubscription,
    PendingPlanChange,
)

from .client import (
    capture_order,
    create_order,
    create_paypal_subscription,
    cancel_paypal_subscription,
    get_order,
    get_paypal_subscription,
    verify_webhook_signature,
)
from .models import PayPalOrder, PayPalSubscription, PayPalWebhookEvent
from .serializers import (
    CancelSubscriptionSerializer,
    CaptureOrderSerializer,
    CreateOrderSerializer,
    CreateSubscriptionSerializer,
    PayPalOrderSerializer,
    PayPalSubscriptionSerializer,
    UpgradeOrderSerializer,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers (mirrors subscriptions/views.py helpers without importing from there)
# ─────────────────────────────────────────────────────────────────────────────

def _notify_vendor(vendor, notification_type, title, message, action_url=""):
    Notification.objects.create(
        recipient         = vendor,
        notification_type = notification_type,
        title             = title,
        message           = message,
        channel           = Notification.Channel.BOTH,
        action_url        = action_url,
    )


def _get_active_subscription(vendor):
    return (
        VendorSubscription.objects
        .select_related("plan")
        .filter(vendor=vendor)
        .exclude(status=VendorSubscription.Status.CANCELLED)
        .order_by("-created_at")
        .first()
    )


def _period_end_from_cycle(billing_cycle: str):
    if billing_cycle == VendorSubscription.BillingCycle.YEARLY:
        return timezone.now() + timezone.timedelta(days=365)
    return timezone.now() + timezone.timedelta(days=30)


def _calculate_prorated_amount(
    current_plan_price: Decimal,
    new_plan_price: Decimal,
    period_start,
    period_end,
) -> Decimal:
    today          = timezone.now().date()
    period_end_d   = period_end.date() if hasattr(period_end, "date") else period_end
    period_start_d = period_start.date() if hasattr(period_start, "date") else period_start

    total_days     = (period_end_d - period_start_d).days
    days_remaining = (period_end_d - today).days

    if total_days <= 0 or days_remaining <= 0:
        return new_plan_price

    unused_credit = (Decimal(days_remaining) / Decimal(total_days)) * current_plan_price
    charge_now    = new_plan_price - unused_credit
    return max(charge_now, Decimal("0.00"))


def _get_plan_price(plan: SubscriptionPlan, billing_cycle: str) -> Decimal:
    if billing_cycle == VendorSubscription.BillingCycle.YEARLY:
        return plan.yearly_price_ngn
    return plan.monthly_price_ngn


# ─────────────────────────────────────────────────────────────────────────────
# Order ViewSet — one-time payments (activation + upgrade)
# ─────────────────────────────────────────────────────────────────────────────

class PayPalOrderViewSet(GenericViewSet, mixins.ListModelMixin):
    """
    Handles one-time PayPal payments using the Orders API.

    Flow:
      1. Vendor calls POST /create/  → backend creates PayPal Order,
         returns paypal_order_id to frontend.
      2. Frontend opens PayPal checkout (JS SDK button or redirect).
         Buyer approves.
      3. Frontend calls POST /capture/ with paypal_order_id.
         Backend captures and activates/upgrades the subscription.
    """

    permission_classes = [IsAuthenticated, IsApprovedVendor]
    serializer_class   = PayPalOrderSerializer

    def get_queryset(self):
        return (
            PayPalOrder.objects
            .filter(vendor=self.request.user)
            .order_by("-created_at")
        )

    # ── List order history ──────────────────────────────────────────────────

    @extend_schema(
        summary="List PayPal order history for the authenticated vendor",
        responses={200: PayPalOrderSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    # ── Step 1: Create Order ─────────────────────────────────────────────────

    @extend_schema(
        summary="Create a PayPal Order for plan activation (step 1)",
        request=CreateOrderSerializer,
        responses={201: {"description": "Order created. Returns paypal_order_id."}},
    )
    @action(detail=False, methods=["post"], url_path="create")
    def create_order(self, request):
        vendor = request.user

        # Vendor must have a pending-payment subscription (set during registration)
        subscription = _get_active_subscription(vendor)
        if not subscription:
            return Response(
                {
                    "success": False,
                    "message": "No subscription found. Please register first.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if subscription.status != VendorSubscription.Status.PENDING_PAYMENT:
            return Response(
                {
                    "success": False,
                    "message": (
                        f"Payment is not required. "
                        f"Subscription status is '{subscription.status}'."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan          = serializer.validated_data["plan"]
        billing_cycle = serializer.validated_data["billing_cycle"]
        currency      = serializer.validated_data["currency"]
        amount        = _get_plan_price(plan, billing_cycle)

        # Free plan: activate directly, no PayPal needed
        if plan.name == SubscriptionPlan.Name.FREE:
            with transaction.atomic():
                subscription.status               = VendorSubscription.Status.ACTIVE
                subscription.current_period_start = timezone.now()
                subscription.current_period_end   = timezone.now() + timezone.timedelta(days=3650)
                subscription.save(update_fields=[
                    "status", "current_period_start", "current_period_end",
                ])

            _notify_vendor(
                vendor            = vendor,
                notification_type = Notification.NotificationType.SUBSCRIPTION_ACTIVATED,
                title             = "Free plan activated",
                message           = "Your Free plan is now active. Start selling!",
                action_url        = "/dashboard",
            )
            return Response(
                {
                    "success": True,
                    "message": "Free plan activated. No payment required.",
                },
                status=status.HTTP_200_OK,
            )

        # Paid plan: create PayPal Order
        try:
            order_data = create_order(
                amount       = amount,
                currency     = currency,
                reference_id = str(vendor.id),
                description  = f"StockSense {plan.get_name_display()} plan ({billing_cycle})",
            )
        except Exception as exc:
            logger.exception(
                "PayPalOrderViewSet.create_order — PayPal API error | vendor=%s | error=%s",
                vendor.email, exc,
            )
            return Response(
                {
                    "success": False,
                    "message": "Could not create PayPal order. Please try again.",
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        paypal_order_id = order_data["id"]

        # Record the pending order
        PayPalOrder.objects.create(
            vendor              = vendor,
            vendor_subscription = subscription,
            paypal_order_id     = paypal_order_id,
            intent              = PayPalOrder.Intent.ACTIVATION,
            amount              = amount,
            currency            = currency,
            status              = PayPalOrder.OrderStatus.CREATED,
            raw_response        = order_data,
        )

        # Stash billing choices on the subscription for the capture step
        subscription.billing_cycle = billing_cycle
        subscription.currency      = currency
        subscription.save(update_fields=["billing_cycle", "currency"])

        logger.info(
            "PayPalOrderViewSet.create_order — created | "
            "vendor=%s | order_id=%s | amount=%s %s",
            vendor.email, paypal_order_id, amount, currency,
        )

        return Response(
            {
                "success":        True,
                "paypal_order_id": paypal_order_id,
                "amount":         str(amount),
                "currency":       currency,
                "message":        (
                    "PayPal order created. Complete payment on the PayPal "
                    "checkout then call /capture/ with the order ID."
                ),
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Step 2: Capture Order ────────────────────────────────────────────────

    @extend_schema(
        summary="Capture an approved PayPal order and activate subscription (step 2)",
        request=CaptureOrderSerializer,
        responses={200: {"description": "Subscription activated."}},
    )
    @action(detail=False, methods=["post"], url_path="capture")
    def capture_order_action(self, request):
        vendor     = request.user
        serializer = CaptureOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        paypal_order_id = serializer.validated_data["paypal_order_id"]

        # Retrieve our local record
        try:
            paypal_order = PayPalOrder.objects.select_related(
                "vendor_subscription__plan"
            ).get(
                paypal_order_id = paypal_order_id,
                vendor          = vendor,
                intent          = PayPalOrder.Intent.ACTIVATION,
            )
        except PayPalOrder.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "PayPal order not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if paypal_order.status == PayPalOrder.OrderStatus.COMPLETED:
            return Response(
                {
                    "success": False,
                    "message": "This order has already been captured.",
                },
                status=status.HTTP_409_CONFLICT,
            )

        # Capture on PayPal
        try:
            capture_data = capture_order(paypal_order_id)
        except Exception as exc:
            logger.exception(
                "PayPalOrderViewSet.capture — PayPal capture error | "
                "vendor=%s | order_id=%s | error=%s",
                vendor.email, paypal_order_id, exc,
            )
            paypal_order.status = PayPalOrder.OrderStatus.FAILED
            paypal_order.save(update_fields=["status"])
            return Response(
                {
                    "success": False,
                    "message": "Payment capture failed. Please try again.",
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if capture_data.get("status") != "COMPLETED":
            paypal_order.status       = PayPalOrder.OrderStatus.FAILED
            paypal_order.raw_response = capture_data
            paypal_order.save(update_fields=["status", "raw_response"])
            return Response(
                {
                    "success": False,
                    "message": (
                        f"Payment not completed. "
                        f"PayPal status: {capture_data.get('status')}."
                    ),
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # Extract capture ID
        capture_id = ""
        try:
            purchase_units = capture_data.get("purchase_units", [])
            captures       = purchase_units[0].get("payments", {}).get("captures", [])
            capture_id     = captures[0].get("id", "") if captures else ""
        except (IndexError, KeyError):
            pass

        subscription = paypal_order.vendor_subscription

        with transaction.atomic():
            # Activate the VendorSubscription
            subscription.status               = VendorSubscription.Status.ACTIVE
            subscription.amount_paid          = paypal_order.amount
            subscription.stripe_sub_id        = ""          # not using Stripe
            subscription.current_period_start = timezone.now()
            subscription.current_period_end   = _period_end_from_cycle(
                subscription.billing_cycle
            )
            subscription.save(update_fields=[
                "status",
                "amount_paid",
                "stripe_sub_id",
                "current_period_start",
                "current_period_end",
            ])

            # Update order record
            paypal_order.status       = PayPalOrder.OrderStatus.COMPLETED
            paypal_order.capture_id   = capture_id
            paypal_order.raw_response = capture_data
            paypal_order.save(update_fields=["status", "capture_id", "raw_response"])

        _notify_vendor(
            vendor            = vendor,
            notification_type = Notification.NotificationType.SUBSCRIPTION_ACTIVATED,
            title             = f"{subscription.plan.get_name_display()} plan activated",
            message           = (
                f"Your {subscription.plan.get_name_display()} plan is now active. "
                f"Next billing: {subscription.current_period_end.strftime('%d %b %Y')}."
            ),
            action_url = "/dashboard",
        )

        from .tasks import send_paypal_payment_confirmation_email
        send_paypal_payment_confirmation_email.delay(str(vendor.id))

        logger.info(
            "PayPalOrderViewSet.capture — activated | vendor=%s | capture_id=%s",
            vendor.email, capture_id,
        )

        return Response(
            {
                "success":    True,
                "message":    f"{subscription.plan.get_name_display()} plan activated.",
                "capture_id": capture_id,
            },
            status=status.HTTP_200_OK,
        )

    # ── Upgrade (create + capture in one endpoint, step-driven) ─────────────

    @extend_schema(
        summary="Upgrade plan via PayPal (step=create or step=capture)",
        request=UpgradeOrderSerializer,
        responses={200: {"description": "Upgrade order created or captured."}},
    )
    @action(detail=False, methods=["post"], url_path="upgrade")
    def upgrade(self, request):
        vendor       = request.user
        subscription = _get_active_subscription(vendor)

        if not subscription or subscription.status != VendorSubscription.Status.ACTIVE:
            return Response(
                {
                    "success": False,
                    "message": "You need an active subscription to upgrade.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = UpgradeOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        step = serializer.validated_data["step"]

        # ── Step 1: create ──────────────────────────────────────────────────
        if step == "create":
            new_plan      = serializer.validated_data["new_plan"]
            billing_cycle = serializer.validated_data.get(
                "billing_cycle", subscription.billing_cycle
            )

            if new_plan.monthly_price_ngn <= subscription.plan.monthly_price_ngn:
                return Response(
                    {
                        "success": False,
                        "message": (
                            "Selected plan is not higher than your current plan. "
                            "Use the downgrade endpoint instead."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if new_plan == subscription.plan:
                return Response(
                    {"success": False, "message": "You are already on this plan."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            new_price = _get_plan_price(new_plan, billing_cycle)
            cur_price = _get_plan_price(subscription.plan, subscription.billing_cycle)

            charge_now = _calculate_prorated_amount(
                current_plan_price = cur_price,
                new_plan_price     = new_price,
                period_start       = subscription.current_period_start,
                period_end         = subscription.current_period_end,
            )

            logger.info(
                "PayPalOrderViewSet.upgrade create — prorated=₦%s | vendor=%s",
                charge_now, vendor.email,
            )

            if charge_now == Decimal("0.00"):
                # Nothing to charge — swap immediately
                return self._apply_upgrade(
                    vendor        = vendor,
                    subscription  = subscription,
                    new_plan      = new_plan,
                    billing_cycle = billing_cycle,
                    charge_now    = Decimal("0.00"),
                    capture_id    = "",
                )

            try:
                order_data = create_order(
                    amount       = charge_now,
                    currency     = subscription.currency,
                    reference_id = str(vendor.id),
                    description  = (
                        f"StockSense upgrade to "
                        f"{new_plan.get_name_display()} (prorated)"
                    ),
                )
            except Exception as exc:
                logger.exception(
                    "PayPalOrderViewSet.upgrade create — API error | vendor=%s | %s",
                    vendor.email, exc,
                )
                return Response(
                    {
                        "success": False,
                        "message": "Could not create PayPal order. Please try again.",
                    },
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            paypal_order_id = order_data["id"]

            PayPalOrder.objects.create(
                vendor              = vendor,
                vendor_subscription = subscription,
                paypal_order_id     = paypal_order_id,
                intent              = PayPalOrder.Intent.UPGRADE,
                amount              = charge_now,
                currency            = subscription.currency,
                status              = PayPalOrder.OrderStatus.CREATED,
                raw_response        = order_data,
            )

            # Stash intended new plan on the order via raw_response metadata
            # The capture step will look up the PayPalOrder to retrieve it.
            PayPalOrder.objects.filter(paypal_order_id=paypal_order_id).update(
                raw_response={
                    **order_data,
                    "_meta": {
                        "new_plan_id":   new_plan.id,
                        "billing_cycle": billing_cycle,
                    },
                }
            )

            return Response(
                {
                    "success":         True,
                    "paypal_order_id": paypal_order_id,
                    "charge_now":      str(charge_now),
                    "currency":        subscription.currency,
                    "message":         (
                        "Prorated order created. Complete payment then "
                        "call upgrade with step=capture."
                    ),
                },
                status=status.HTTP_201_CREATED,
            )

        # ── Step 2: capture ─────────────────────────────────────────────────
        paypal_order_id = serializer.validated_data.get("paypal_order_id")

        try:
            paypal_order = PayPalOrder.objects.get(
                paypal_order_id = paypal_order_id,
                vendor          = vendor,
                intent          = PayPalOrder.Intent.UPGRADE,
            )
        except PayPalOrder.DoesNotExist:
            return Response(
                {"success": False, "message": "Upgrade order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if paypal_order.status == PayPalOrder.OrderStatus.COMPLETED:
            return Response(
                {"success": False, "message": "Order already captured."},
                status=status.HTTP_409_CONFLICT,
            )

        try:
            capture_data = capture_order(paypal_order_id)
        except Exception as exc:
            logger.exception(
                "PayPalOrderViewSet.upgrade capture — error | vendor=%s | %s",
                vendor.email, exc,
            )
            paypal_order.status = PayPalOrder.OrderStatus.FAILED
            paypal_order.save(update_fields=["status"])
            return Response(
                {"success": False, "message": "Capture failed. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if capture_data.get("status") != "COMPLETED":
            paypal_order.status       = PayPalOrder.OrderStatus.FAILED
            paypal_order.raw_response = capture_data
            paypal_order.save(update_fields=["status", "raw_response"])
            return Response(
                {
                    "success": False,
                    "message": f"Payment not completed. Status: {capture_data.get('status')}.",
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        capture_id = ""
        try:
            purchase_units = capture_data.get("purchase_units", [])
            captures       = purchase_units[0].get("payments", {}).get("captures", [])
            capture_id     = captures[0].get("id", "") if captures else ""
        except (IndexError, KeyError):
            pass

        # Retrieve intended plan from the stored metadata
        meta          = (paypal_order.raw_response or {}).get("_meta", {})
        new_plan_id   = meta.get("new_plan_id")
        billing_cycle = meta.get("billing_cycle", subscription.billing_cycle)

        try:
            new_plan = SubscriptionPlan.objects.get(id=new_plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {"success": False, "message": "Target plan no longer exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        paypal_order.status       = PayPalOrder.OrderStatus.COMPLETED
        paypal_order.capture_id   = capture_id
        paypal_order.raw_response = capture_data
        paypal_order.save(update_fields=["status", "capture_id", "raw_response"])

        return self._apply_upgrade(
            vendor        = vendor,
            subscription  = subscription,
            new_plan      = new_plan,
            billing_cycle = billing_cycle,
            charge_now    = paypal_order.amount,
            capture_id    = capture_id,
        )

    def _apply_upgrade(
        self,
        vendor,
        subscription,
        new_plan,
        billing_cycle,
        charge_now,
        capture_id,
    ):
        """
        Swaps the VendorSubscription to the new plan after a successful
        PayPal capture (or when charge_now == 0).
        """
        with transaction.atomic():
            subscription.status       = VendorSubscription.Status.CANCELLED
            subscription.cancelled_at = timezone.now()
            subscription.save(update_fields=["status", "cancelled_at"])

            new_subscription = VendorSubscription.objects.create(
                vendor               = vendor,
                plan                 = new_plan,
                billing_cycle        = billing_cycle,
                currency             = subscription.currency,
                status               = VendorSubscription.Status.ACTIVE,
                amount_paid          = charge_now,
                current_period_start = timezone.now(),
                current_period_end   = _period_end_from_cycle(billing_cycle),
            )

        _notify_vendor(
            vendor            = vendor,
            notification_type = Notification.NotificationType.PLAN_UPGRADED,
            title             = f"Plan upgraded to {new_plan.get_name_display()}",
            message           = (
                f"You are now on the {new_plan.get_name_display()} plan. "
                "All features are available immediately."
            ),
            action_url = "/settings/subscription",
        )

        from .tasks import send_paypal_plan_change_email
        send_paypal_plan_change_email.delay(str(vendor.id), "upgraded", new_plan.name)

        logger.info(
            "PayPalOrderViewSet._apply_upgrade — done | vendor=%s | new_plan=%s",
            vendor.email, new_plan.name,
        )

        return Response(
            {
                "success":    True,
                "message":    (
                    f"Plan upgraded to {new_plan.get_name_display()}. "
                    f"Prorated charge: {subscription.currency} {charge_now}."
                ),
                "capture_id": capture_id,
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# PayPal Subscription ViewSet — recurring billing
# ─────────────────────────────────────────────────────────────────────────────

class PayPalSubscriptionViewSet(GenericViewSet):
    """
    Manages recurring PayPal Billing Subscriptions.

    Flow:
      1. POST /create/ → backend creates PayPal subscription, returns
         approval_url for the frontend to redirect / popup.
      2. Buyer approves on PayPal.
      3. PayPal calls your webhook (BILLING.SUBSCRIPTION.ACTIVATED).
         Backend activates the VendorSubscription.

    Cancellation:
      POST /cancel/ (OTP required) → backend cancels on PayPal,
      marks local subscription cancelled.
    """

    permission_classes = [IsAuthenticated, IsApprovedVendor]
    serializer_class   = PayPalSubscriptionSerializer

    # ── Active subscription ──────────────────────────────────────────────────

    @extend_schema(
        summary="Get vendor's active PayPal subscription",
        responses={200: PayPalSubscriptionSerializer},
    )
    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        paypal_sub = (
            PayPalSubscription.objects
            .filter(
                vendor = request.user,
                status = PayPalSubscription.SubStatus.ACTIVE,
            )
            .order_by("-created_at")
            .first()
        )

        if not paypal_sub:
            return Response(
                {"success": True, "data": None},
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "success": True,
                "data":    PayPalSubscriptionSerializer(paypal_sub).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Create recurring subscription ────────────────────────────────────────

    @extend_schema(
        summary="Create a recurring PayPal Billing Subscription",
        request=CreateSubscriptionSerializer,
        responses={201: {"description": "Subscription created. Returns approval_url."}},
    )
    @action(detail=False, methods=["post"], url_path="create")
    def create_subscription(self, request):
        vendor = request.user

        serializer = CreateSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan          = serializer.validated_data["plan"]
        billing_cycle = serializer.validated_data["billing_cycle"]
        currency      = serializer.validated_data["currency"]
        return_url    = serializer.validated_data.get("return_url", "")
        cancel_url    = serializer.validated_data.get("cancel_url", "")

        if plan.name == SubscriptionPlan.Name.FREE:
            return Response(
                {
                    "success": False,
                    "message": "Free plan does not require a PayPal subscription.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Map SubscriptionPlan → PayPal Billing Plan ID
        # Store these in settings or on the SubscriptionPlan model.
        paypal_plan_id_map = getattr(settings, "PAYPAL_BILLING_PLAN_IDS", {})
        key           = f"{plan.name}_{billing_cycle}"
        paypal_plan_id = paypal_plan_id_map.get(key, "")

        if not paypal_plan_id:
            logger.error(
                "PayPalSubscriptionViewSet.create — no PayPal plan ID for key=%s",
                key,
            )
            return Response(
                {
                    "success": False,
                    "message": (
                        f"PayPal billing plan not configured for "
                        f"{plan.get_name_display()} ({billing_cycle}). "
                        "Please contact support."
                    ),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        vendor_profile = getattr(vendor, "vendor_profile", None)
        subscriber_name = (
            vendor_profile.business_name if vendor_profile else vendor.email
        )

        try:
            sub_data = create_paypal_subscription(
                plan_id          = paypal_plan_id,
                subscriber_email = vendor.email,
                subscriber_name  = subscriber_name,
                custom_id        = str(vendor.id),
                return_url       = return_url,
                cancel_url       = cancel_url,
            )
        except Exception as exc:
            logger.exception(
                "PayPalSubscriptionViewSet.create — API error | vendor=%s | %s",
                vendor.email, exc,
            )
            return Response(
                {
                    "success": False,
                    "message": "Could not create PayPal subscription. Please try again.",
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        paypal_sub_id = sub_data["id"]

        # Extract approval URL
        approval_url = next(
            (
                link["href"]
                for link in sub_data.get("links", [])
                if link.get("rel") == "approve"
            ),
            "",
        )

        # Create or update our VendorSubscription (pending payment)
        vendor_sub = _get_active_subscription(vendor)
        if not vendor_sub:
            vendor_sub = VendorSubscription.objects.create(
                vendor        = vendor,
                plan          = plan,
                billing_cycle = billing_cycle,
                currency      = currency,
                status        = VendorSubscription.Status.PENDING_PAYMENT,
            )
        else:
            vendor_sub.plan          = plan
            vendor_sub.billing_cycle = billing_cycle
            vendor_sub.currency      = currency
            vendor_sub.status        = VendorSubscription.Status.PENDING_PAYMENT
            vendor_sub.save(update_fields=[
                "plan", "billing_cycle", "currency", "status"
            ])

        # Record the PayPal subscription
        PayPalSubscription.objects.create(
            vendor              = vendor,
            vendor_subscription = vendor_sub,
            paypal_sub_id       = paypal_sub_id,
            paypal_plan_id      = paypal_plan_id,
            status              = PayPalSubscription.SubStatus.APPROVAL_PENDING,
            raw_response        = sub_data,
        )

        logger.info(
            "PayPalSubscriptionViewSet.create — created | vendor=%s | sub_id=%s",
            vendor.email, paypal_sub_id,
        )

        return Response(
            {
                "success":      True,
                "paypal_sub_id": paypal_sub_id,
                "approval_url": approval_url,
                "message":      (
                    "Redirect the buyer to approval_url to complete PayPal sign-up. "
                    "Subscription will activate via webhook."
                ),
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Cancel recurring subscription ────────────────────────────────────────

    @extend_schema(
        summary="Cancel PayPal recurring subscription (OTP required)",
        request=CancelSubscriptionSerializer,
        responses={200: {"description": "Subscription cancelled."}},
    )
    @action(detail=False, methods=["post"], url_path="cancel")
    def cancel_subscription(self, request):
        from otp.models import OTP

        vendor = request.user

        paypal_sub = (
            PayPalSubscription.objects
            .filter(
                vendor = vendor,
                status = PayPalSubscription.SubStatus.ACTIVE,
            )
            .order_by("-created_at")
            .first()
        )

        if not paypal_sub:
            return Response(
                {
                    "success": False,
                    "message": "No active PayPal subscription found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CancelSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        otp_code = serializer.validated_data["otp_code"]

        # Verify OTP
        otp = (
            OTP.objects
            .filter(
                user    = vendor,
                purpose = OTP.Purpose.SENSITIVE_ACTION,
                is_used = False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp or otp.code != otp_code or otp.is_expired:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or expired OTP. Request a new one.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        # Cancel on PayPal
        try:
            cancel_paypal_subscription(
                paypal_sub.paypal_sub_id,
                reason="Cancelled by vendor via StockSense dashboard.",
            )
        except Exception as exc:
            logger.exception(
                "PayPalSubscriptionViewSet.cancel — API error | vendor=%s | %s",
                vendor.email, exc,
            )
            return Response(
                {
                    "success": False,
                    "message": "Could not cancel on PayPal. Please try again.",
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Update local records
        paypal_sub.status = PayPalSubscription.SubStatus.CANCELLED
        paypal_sub.save(update_fields=["status"])

        vendor_sub = paypal_sub.vendor_subscription
        if vendor_sub:
            vendor_sub.cancelled_at = timezone.now()
            vendor_sub.save(update_fields=["cancelled_at"])

            PendingPlanChange.objects.create(
                vendor        = vendor,
                change_type   = PendingPlanChange.ChangeType.CANCELLATION,
                change_status = PendingPlanChange.ChangeStatus.SCHEDULED,
                effective_at  = vendor_sub.current_period_end,
            )

        _notify_vendor(
            vendor            = vendor,
            notification_type = Notification.NotificationType.SUBSCRIPTION_CANCELLED,
            title             = "Subscription cancellation confirmed",
            message           = (
                "Your PayPal subscription has been cancelled. "
                "You keep all features until the end of the current period."
            ),
            action_url = "/settings/subscription",
        )

        logger.info(
            "PayPalSubscriptionViewSet.cancel — cancelled | vendor=%s | sub_id=%s",
            vendor.email, paypal_sub.paypal_sub_id,
        )

        return Response(
            {
                "success": True,
                "message": "PayPal subscription cancelled successfully.",
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Webhook ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class PayPalWebhookViewSet(GenericViewSet):
    """
    Receives and processes PayPal webhook events.

    POST /api/paypal/webhook/

    Events handled:
      PAYMENT.CAPTURE.COMPLETED       — one-time payment succeeded
      PAYMENT.CAPTURE.DENIED          — one-time payment failed
      BILLING.SUBSCRIPTION.ACTIVATED  — recurring sub activated
      BILLING.SUBSCRIPTION.CANCELLED  — recurring sub cancelled
      BILLING.SUBSCRIPTION.EXPIRED    — recurring sub expired
      PAYMENT.SALE.COMPLETED          — recurring payment succeeded (v1 event)
      BILLING.SUBSCRIPTION.PAYMENT.FAILED — recurring payment failed
    """

    permission_classes = [AllowAny]  # PayPal calls this unauthenticated

    @extend_schema(
        summary="PayPal webhook receiver",
        responses={200: {"description": "Event received."}},
    )
    @action(detail=False, methods=["post"], url_path="")
    def receive(self, request):
        # ── Verify signature ─────────────────────────────────────────────────
        webhook_id = getattr(settings, "PAYPAL_WEBHOOK_ID", "")
        if webhook_id:
            verified = verify_webhook_signature(
                transmission_id  = request.headers.get("PAYPAL-TRANSMISSION-ID", ""),
                timestamp        = request.headers.get("PAYPAL-TRANSMISSION-TIME", ""),
                webhook_id       = webhook_id,
                event_body       = request.body.decode("utf-8"),
                cert_url         = request.headers.get("PAYPAL-CERT-URL", ""),
                actual_signature = request.headers.get("PAYPAL-TRANSMISSION-SIG", ""),
                auth_algo        = request.headers.get("PAYPAL-AUTH-ALGO", ""),
            )
            if not verified:
                logger.warning("PayPal webhook signature verification failed.")
                return Response(
                    {"detail": "Signature verification failed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return Response(
                {"detail": "Invalid JSON."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event_id      = payload.get("id", "")
        event_type    = payload.get("event_type", "")
        resource      = payload.get("resource", {})
        resource_id   = resource.get("id", "")
        resource_type = payload.get("resource_type", "")

        # ── Idempotency: skip duplicate events ───────────────────────────────
        webhook_event, created = PayPalWebhookEvent.objects.get_or_create(
            event_id = event_id,
            defaults = {
                "event_type":    event_type,
                "resource_type": resource_type,
                "resource_id":   resource_id,
                "payload":       payload,
            },
        )

        if not created:
            logger.info(
                "PayPal webhook duplicate event ignored | event_id=%s", event_id
            )
            return Response({"detail": "Already processed."}, status=status.HTTP_200_OK)

        # ── Dispatch to handler ──────────────────────────────────────────────
        handler = {
            "PAYMENT.CAPTURE.COMPLETED":              self._handle_capture_completed,
            "PAYMENT.CAPTURE.DENIED":                 self._handle_capture_denied,
            "BILLING.SUBSCRIPTION.ACTIVATED":         self._handle_sub_activated,
            "BILLING.SUBSCRIPTION.CANCELLED":         self._handle_sub_cancelled,
            "BILLING.SUBSCRIPTION.EXPIRED":           self._handle_sub_expired,
            "PAYMENT.SALE.COMPLETED":                 self._handle_sale_completed,
            "BILLING.SUBSCRIPTION.PAYMENT.FAILED":    self._handle_payment_failed,
        }.get(event_type)

        if handler:
            try:
                handler(resource, webhook_event)
                webhook_event.processing_status = PayPalWebhookEvent.ProcessingStatus.PROCESSED
            except Exception as exc:
                logger.exception(
                    "PayPal webhook handler error | event_type=%s | error=%s",
                    event_type, exc,
                )
                webhook_event.processing_status = PayPalWebhookEvent.ProcessingStatus.FAILED
                webhook_event.failure_reason     = str(exc)
        else:
            webhook_event.processing_status = PayPalWebhookEvent.ProcessingStatus.IGNORED

        webhook_event.save(update_fields=["processing_status", "failure_reason"])

        return Response({"detail": "Received."}, status=status.HTTP_200_OK)

    # ── Handlers ─────────────────────────────────────────────────────────────

    def _handle_capture_completed(self, resource, webhook_event):
        """
        PAYMENT.CAPTURE.COMPLETED
        Sent when a one-time order capture succeeds.
        The subscription was already activated in the capture endpoint;
        this handler is a secondary guard / audit update.
        """
        capture_id = resource.get("id", "")
        order_id   = resource.get("supplementary_data", {}).get(
            "related_ids", {}
        ).get("order_id", "")

        logger.info(
            "Webhook CAPTURE.COMPLETED | capture_id=%s | order_id=%s",
            capture_id, order_id,
        )

        PayPalOrder.objects.filter(
            paypal_order_id = order_id
        ).update(
            status     = PayPalOrder.OrderStatus.COMPLETED,
            capture_id = capture_id,
        )

    def _handle_capture_denied(self, resource, webhook_event):
        """PAYMENT.CAPTURE.DENIED — mark local order as failed."""
        order_id = resource.get("supplementary_data", {}).get(
            "related_ids", {}
        ).get("order_id", "")

        logger.warning(
            "Webhook CAPTURE.DENIED | order_id=%s", order_id
        )

        PayPalOrder.objects.filter(
            paypal_order_id = order_id
        ).update(status=PayPalOrder.OrderStatus.FAILED)

    def _handle_sub_activated(self, resource, webhook_event):
        """
        BILLING.SUBSCRIPTION.ACTIVATED
        Buyer approved a recurring subscription.
        Activate the VendorSubscription.
        """
        paypal_sub_id = resource.get("id", "")
        logger.info("Webhook SUB.ACTIVATED | sub_id=%s", paypal_sub_id)

        try:
            paypal_sub = PayPalSubscription.objects.select_related(
                "vendor", "vendor_subscription__plan"
            ).get(paypal_sub_id=paypal_sub_id)
        except PayPalSubscription.DoesNotExist:
            logger.warning(
                "Webhook SUB.ACTIVATED — PayPalSubscription not found: %s",
                paypal_sub_id,
            )
            return

        paypal_sub.status = PayPalSubscription.SubStatus.ACTIVE
        paypal_sub.save(update_fields=["status"])

        vendor_sub = paypal_sub.vendor_subscription
        if vendor_sub:
            vendor_sub.status               = VendorSubscription.Status.ACTIVE
            vendor_sub.current_period_start = timezone.now()
            vendor_sub.current_period_end   = _period_end_from_cycle(
                vendor_sub.billing_cycle
            )
            vendor_sub.save(update_fields=[
                "status", "current_period_start", "current_period_end"
            ])

        _notify_vendor(
            vendor            = paypal_sub.vendor,
            notification_type = Notification.NotificationType.SUBSCRIPTION_ACTIVATED,
            title             = "PayPal subscription activated",
            message           = "Your recurring PayPal subscription is now active.",
            action_url        = "/dashboard",
        )

    def _handle_sub_cancelled(self, resource, webhook_event):
        """BILLING.SUBSCRIPTION.CANCELLED — sync cancellation from PayPal."""
        paypal_sub_id = resource.get("id", "")
        logger.info("Webhook SUB.CANCELLED | sub_id=%s", paypal_sub_id)

        PayPalSubscription.objects.filter(
            paypal_sub_id=paypal_sub_id
        ).update(status=PayPalSubscription.SubStatus.CANCELLED)

    def _handle_sub_expired(self, resource, webhook_event):
        """BILLING.SUBSCRIPTION.EXPIRED — mark expired."""
        paypal_sub_id = resource.get("id", "")
        logger.info("Webhook SUB.EXPIRED | sub_id=%s", paypal_sub_id)

        PayPalSubscription.objects.filter(
            paypal_sub_id=paypal_sub_id
        ).update(status=PayPalSubscription.SubStatus.EXPIRED)

    def _handle_sale_completed(self, resource, webhook_event):
        """
        PAYMENT.SALE.COMPLETED — a recurring billing cycle payment succeeded.
        Extend the VendorSubscription period.
        """
        billing_agreement_id = resource.get("billing_agreement_id", "")
        amount               = resource.get("amount", {}).get("total", "0")
        logger.info(
            "Webhook SALE.COMPLETED | sub_id=%s | amount=%s",
            billing_agreement_id, amount,
        )

        try:
            paypal_sub = PayPalSubscription.objects.select_related(
                "vendor_subscription"
            ).get(paypal_sub_id=billing_agreement_id)
        except PayPalSubscription.DoesNotExist:
            return

        paypal_sub.last_payment_amount = Decimal(amount)
        paypal_sub.last_payment_time   = timezone.now()
        paypal_sub.save(update_fields=["last_payment_amount", "last_payment_time"])

        vendor_sub = paypal_sub.vendor_subscription
        if vendor_sub:
            vendor_sub.current_period_start = timezone.now()
            vendor_sub.current_period_end   = _period_end_from_cycle(
                vendor_sub.billing_cycle
            )
            vendor_sub.amount_paid = Decimal(amount)
            vendor_sub.save(update_fields=[
                "current_period_start", "current_period_end", "amount_paid"
            ])

    def _handle_payment_failed(self, resource, webhook_event):
        """
        BILLING.SUBSCRIPTION.PAYMENT.FAILED
        Mark VendorSubscription as past_due.
        """
        paypal_sub_id = resource.get("id", "")
        logger.warning(
            "Webhook PAYMENT.FAILED | sub_id=%s", paypal_sub_id
        )

        try:
            paypal_sub = PayPalSubscription.objects.select_related(
                "vendor", "vendor_subscription"
            ).get(paypal_sub_id=paypal_sub_id)
        except PayPalSubscription.DoesNotExist:
            return

        vendor_sub = paypal_sub.vendor_subscription
        if vendor_sub:
            vendor_sub.status = VendorSubscription.Status.PAST_DUE
            vendor_sub.save(update_fields=["status"])

        _notify_vendor(
            vendor            = paypal_sub.vendor,
            notification_type = Notification.NotificationType.SUBSCRIPTION_EXPIRED,
            title             = "PayPal payment failed",
            message           = (
                "Your latest PayPal subscription payment failed. "
                "Please update your payment method to avoid service interruption."
            ),
            action_url = "/settings/subscription",
        )