# subscriptions/views.py

import logging

from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from rest_framework import status, mixins
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsAdmin, IsApprovedVendor
from notifications.models import Notification

from .models import SubscriptionPlan, VendorSubscription, PendingPlanChange
from .serializers import (
    SubscriptionPlanListSerializer,
    ActiveSubscriptionSerializer,
    PendingPlanChangeSerializer,
    AdminSubscriptionListSerializer,
    SelectPlanSerializer,
    ProcessPaymentSerializer,
    UpgradePlanSerializer,
    DowngradePlanSerializer,
    CancelSubscriptionSerializer,
)

logger = logging.getLogger(__name__)
User   = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
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
    """
    Returns the vendor's most recent active subscription or None.
    """
    return (
        VendorSubscription.objects
        .select_related("plan")
        .filter(vendor=vendor)
        .exclude(status=VendorSubscription.Status.CANCELLED)
        .order_by("-created_at")
        .first()
    )


def _calculate_prorated_amount(
    current_plan_price: Decimal,
    new_plan_price: Decimal,
    period_start,
    period_end,
) -> Decimal:
    """
    Calculates the prorated charge when upgrading mid-cycle.

    Formula:
        days_remaining  = period_end - today
        total_days      = period_end - period_start
        unused_credit   = (days_remaining / total_days) × current_plan_price
        charge_now      = new_plan_price - unused_credit
    """
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


from subscriptions.utils import period_end_from_cycle as _period_end_from_cycle


# ─────────────────────────────────────────────────────────────────────────────
# Subscription Plan ViewSet — public read
# ─────────────────────────────────────────────────────────────────────────────

class SubscriptionPlanViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    Public read-only endpoint for subscription plans.
    Used by the registration page to display the pricing cards.

    GET  /api/subscriptions/plans/       — list all active plans
    GET  /api/subscriptions/plans/{id}/  — single plan detail
    """

    permission_classes = [AllowAny]
    serializer_class   = SubscriptionPlanListSerializer
    queryset           = SubscriptionPlan.objects.filter(
        is_active=True
    ).order_by("monthly_price_gbp")

    @extend_schema(
        summary="List all subscription plans (public)",
        responses={200: SubscriptionPlanListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        serializer = SubscriptionPlanListSerializer(
            self.get_queryset(),
            many=True,
        )
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Get single plan detail (public)",
        responses={200: SubscriptionPlanListSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        plan       = self.get_object()
        serializer = SubscriptionPlanListSerializer(plan)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Vendor Subscription ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class VendorSubscriptionViewSet(GenericViewSet):
    """
    Vendor subscription management.

    GET   /api/subscriptions/me/          — get active subscription
    POST  /api/subscriptions/pay/         — activate paid plan after approval
    POST  /api/subscriptions/upgrade/     — upgrade to higher plan
    POST  /api/subscriptions/downgrade/   — schedule downgrade at period end
    POST  /api/subscriptions/cancel/      — cancel subscription
    POST  /api/subscriptions/reactivate/  — reactivate a cancelled subscription
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "pay":
            return ProcessPaymentSerializer
        if self.action == "upgrade":
            return UpgradePlanSerializer
        if self.action == "downgrade":
            return DowngradePlanSerializer
        if self.action == "cancel":
            return CancelSubscriptionSerializer
        return ActiveSubscriptionSerializer

    # ── Get active subscription ──

    @extend_schema(
        summary="Get the authenticated vendor's active subscription",
        responses={200: ActiveSubscriptionSerializer},
    )
    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        subscription = _get_active_subscription(request.user)

        if not subscription:
            return Response(
                {"success": True, "data": None},
                status=status.HTTP_200_OK,
            )

        data = ActiveSubscriptionSerializer(subscription).data

        # ── Attach any pending plan change ──
        pending = (
            PendingPlanChange.objects
            .select_related("new_plan")
            .filter(
                vendor        = request.user,
                change_status = PendingPlanChange.ChangeStatus.SCHEDULED,
            )
            .first()
        )
        if pending:
            data["pending_change"] = PendingPlanChangeSerializer(pending).data

        return Response(
            {"success": True, "data": data},
            status=status.HTTP_200_OK,
        )

    # ── Activate paid plan after admin approval ──

    @extend_schema(
        summary="Activate subscription after admin approval",
        request=ProcessPaymentSerializer,
        responses={200: ActiveSubscriptionSerializer},
    )
    @action(detail=False, methods=["post"], url_path="pay")
    def pay(self, request):
        from .models import PaymentRecord

        vendor       = request.user
        subscription = _get_active_subscription(vendor)

        if not subscription:
            return Response(
                {"success": False, "message": "No subscription found. Please register first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if subscription.status != VendorSubscription.Status.PENDING_PAYMENT:
            return Response(
                {
                    "success": False,
                    "message": (
                        f"Payment is not required. "
                        f"Your subscription status is '{subscription.status}'."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Free plan: activate directly ──
        if subscription.plan.name == SubscriptionPlan.Name.FREE:
            with transaction.atomic():
                subscription.status               = VendorSubscription.Status.ACTIVE
                subscription.current_period_start = timezone.now()
                subscription.current_period_end   = timezone.now() + timezone.timedelta(days=3650)
                subscription.save(update_fields=[
                    "status", "current_period_start", "current_period_end",
                ])
                PaymentRecord.objects.create(
                    subscription     = subscription,
                    vendor           = vendor,
                    plan             = subscription.plan,
                    payment_type     = PaymentRecord.PaymentType.INITIAL,
                    amount           = Decimal("0.00"),
                    currency         = subscription.currency,
                    stripe_intent_id = "",
                    billing_cycle    = subscription.billing_cycle,
                )

            _notify_vendor(
                vendor            = vendor,
                notification_type = Notification.NotificationType.SUBSCRIPTION_ACTIVATED,
                title             = "Free plan activated",
                message           = "Your Free plan is now active. Start adding your products.",
                action_url        = "/dashboard",
            )
            return Response(
                {
                    "success": True,
                    "message": "Free plan activated. Welcome to StockSense!",
                    "data":    ActiveSubscriptionSerializer(subscription).data,
                },
                status=status.HTTP_200_OK,
            )

        # ── Paid plan ──
        serializer = ProcessPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        stripe_pm_id = serializer.validated_data["stripe_payment_method_id"]

        try:
            import stripe
            from django.conf import settings as django_settings

            stripe.api_key = django_settings.STRIPE_SECRET_KEY

            vendor_profile = getattr(vendor, "vendor_profile", None)

            # ── Reuse existing Stripe customer or create new one ──
            if subscription.stripe_customer_id:
                stripe_customer_id = subscription.stripe_customer_id
                # Attach new pm to existing customer
                stripe.PaymentMethod.attach(stripe_pm_id, customer=stripe_customer_id)
            else:
                stripe_customer = stripe.Customer.create(
                    email    = vendor.email,
                    name     = vendor_profile.business_name if vendor_profile else vendor.email,
                    metadata = {"vendor_id": str(vendor.id)},
                )
                stripe_customer_id = stripe_customer.id
                stripe.PaymentMethod.attach(stripe_pm_id, customer=stripe_customer_id)

            # ── Set as default payment method on customer ──
            stripe.Customer.modify(
                stripe_customer_id,
                invoice_settings={"default_payment_method": stripe_pm_id},
            )

            # ── Determine charge amount ──
            amount_decimal = (
                subscription.plan.yearly_price_gbp
                if subscription.billing_cycle == VendorSubscription.BillingCycle.YEARLY
                else subscription.plan.monthly_price_gbp
            )
            amount_pence = int(amount_decimal * 100)

            # ── Charge ──
            intent = stripe.PaymentIntent.create(
                amount         = amount_pence,
                currency       = subscription.currency.lower(),
                customer       = stripe_customer_id,
                payment_method = stripe_pm_id,
                confirm        = True,
                automatic_payment_methods={
                    "enabled":         True,
                    "allow_redirects": "never",
                },
                metadata={
                    "vendor_id":       str(vendor.id),
                    "plan":            subscription.plan.name,
                    "billing_cycle":   subscription.billing_cycle,
                    "type":            "initial",
                    "subscription_id": str(subscription.id),
                },
            )

            if intent.status != "succeeded":
                return Response(
                    {
                        "success": False,
                        "message": "Payment failed. Please check your card and try again.",
                        "code":    intent.status,
                    },
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )

            # ── Activate and persist Stripe IDs atomically ──
            with transaction.atomic():
                subscription.status                  = VendorSubscription.Status.ACTIVE
                subscription.stripe_last_intent_id   = intent.id
                subscription.stripe_customer_id      = stripe_customer_id      # ← NEW
                subscription.stripe_payment_method_id = stripe_pm_id           # ← NEW
                subscription.amount_paid             = amount_decimal
                subscription.current_period_start    = timezone.now()
                subscription.current_period_end      = _period_end_from_cycle(subscription.billing_cycle)
                subscription.save(update_fields=[
                    "status",
                    "stripe_last_intent_id",
                    "stripe_customer_id",        # ← NEW
                    "stripe_payment_method_id",  # ← NEW
                    "amount_paid",
                    "current_period_start",
                    "current_period_end",
                ])

                PaymentRecord.objects.create(
                    subscription     = subscription,
                    vendor           = vendor,
                    plan             = subscription.plan,
                    payment_type     = PaymentRecord.PaymentType.INITIAL,
                    amount           = amount_decimal,
                    currency         = subscription.currency,
                    stripe_intent_id = intent.id,
                    billing_cycle    = subscription.billing_cycle,
                )

        except stripe.error.CardError as exc:
            logger.warning(
                "VendorSubscriptionViewSet.pay — card error | vendor=%s | error=%s",
                vendor.email, str(exc),
            )
            return Response(
                {"success": False, "message": exc.user_message or "Card payment failed."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )
        except Exception as exc:
            logger.exception(
                "VendorSubscriptionViewSet.pay — unexpected error | vendor=%s | error=%s",
                vendor.email, str(exc),
            )
            return Response(
                {"success": False, "message": "Payment processing failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        _notify_vendor(
            vendor            = vendor,
            notification_type = Notification.NotificationType.SUBSCRIPTION_ACTIVATED,
            title             = f"{subscription.plan.get_name_display()} plan activated",
            message           = (
                f"Your {subscription.plan.get_name_display()} plan is now active. "
                f"Next billing date: {subscription.current_period_end.strftime('%d %b %Y')}."
            ),
            action_url = "/dashboard",
        )

        from subscriptions.tasks import send_payment_confirmation_email
        send_payment_confirmation_email.delay(str(vendor.id))

        return Response(
            {
                "success": True,
                "message": f"{subscription.plan.get_name_display()} plan activated. Welcome to StockSense!",
                "data":    ActiveSubscriptionSerializer(subscription).data,
            },
            status=status.HTTP_200_OK,
        )


    # ── Upgrade plan ──

    @extend_schema(
        summary="Upgrade to a higher plan",
        request=UpgradePlanSerializer,
        responses={200: ActiveSubscriptionSerializer},
    )
    @action(detail=False, methods=["post"], url_path="upgrade")
    def upgrade(self, request):
        from .models import PaymentRecord

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

        serializer = UpgradePlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_plan      = serializer.validated_data["new_plan"]
        billing_cycle = serializer.validated_data.get(
            "billing_cycle",
            subscription.billing_cycle,
        )
        stripe_pm_id  = serializer.validated_data["stripe_payment_method_id"]

        # ── Guard: new plan must be higher ──
        if new_plan.monthly_price_gbp <= subscription.plan.monthly_price_gbp:
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
                {
                    "success": False,
                    "message": "You are already on this plan.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Calculate prorated charge ──
        if billing_cycle == VendorSubscription.BillingCycle.YEARLY:
            new_price = new_plan.yearly_price_gbp
            cur_price = subscription.plan.yearly_price_gbp
        else:
            new_price = new_plan.monthly_price_gbp
            cur_price = subscription.plan.monthly_price_gbp

        charge_now = _calculate_prorated_amount(
            current_plan_price = cur_price,
            new_plan_price     = new_price,
            period_start       = subscription.current_period_start,
            period_end         = subscription.current_period_end,
        )

        logger.info(
            "VendorSubscriptionViewSet.upgrade — prorated charge=£%s | vendor=%s",
            charge_now,
            vendor.email,
        )

        # ── Process prorated payment via Stripe ──
        try:
            import stripe
            from django.conf import settings

            stripe.api_key = settings.STRIPE_SECRET_KEY

            amount_pence = int(charge_now * 100)
            intent_id   = ""

            if amount_pence > 0:
                intent = stripe.PaymentIntent.create(
                    amount         = amount_pence,
                    currency       = subscription.currency.lower(),
                    payment_method = stripe_pm_id,
                    confirm        = True,
                    automatic_payment_methods = {
                        "enabled":         True,
                        "allow_redirects": "never",
                    },
                    metadata = {
                        "vendor_id":       str(vendor.id),
                        "type":            "plan_upgrade",
                        "plan":            new_plan.name,
                        "billing_cycle":   billing_cycle,
                        "new_plan":        new_plan.name,
                        # webhook uses subscription_id to look up the record
                        "subscription_id": str(subscription.id),
                    },
                )

                if intent.status != "succeeded":
                    return Response(
                        {
                            "success": False,
                            "message": "Payment failed. Plan not changed.",
                        },
                        status=status.HTTP_402_PAYMENT_REQUIRED,
                    )

                intent_id = intent.id

            # ── Swap plan and record payment atomically ──
            with transaction.atomic():

                # Cancel current subscription
                subscription.status       = VendorSubscription.Status.CANCELLED
                subscription.cancelled_at = timezone.now()
                subscription.save(update_fields=["status", "cancelled_at"])

                # Create new active subscription — carry over Stripe customer/PM
                # so auto-renewal (process_subscription_renewal) can charge it.
                new_subscription = VendorSubscription.objects.create(
                    vendor                   = vendor,
                    plan                     = new_plan,
                    billing_cycle            = billing_cycle,
                    currency                 = subscription.currency,
                    status                   = VendorSubscription.Status.ACTIVE,
                    amount_paid              = charge_now,
                    stripe_last_intent_id    = intent_id,
                    stripe_customer_id       = subscription.stripe_customer_id,
                    stripe_payment_method_id = subscription.stripe_payment_method_id,
                    current_period_start     = timezone.now(),
                    current_period_end       = _period_end_from_cycle(billing_cycle),
                )

                # Record the upgrade payment
                PaymentRecord.objects.create(
                    subscription     = new_subscription,
                    vendor           = vendor,
                    plan             = new_plan,
                    payment_type     = PaymentRecord.PaymentType.UPGRADE,
                    amount           = charge_now,
                    currency         = subscription.currency,
                    stripe_intent_id = intent_id,
                    billing_cycle    = billing_cycle,
                )

        except stripe.error.CardError as exc:
            return Response(
                {
                    "success": False,
                    "message": exc.user_message or "Card payment failed.",
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        except Exception as exc:
            logger.exception(
                "VendorSubscriptionViewSet.upgrade — failed | vendor=%s | error=%s",
                vendor.email,
                str(exc),
            )
            return Response(
                {
                    "success": False,
                    "message": "Upgrade failed. Please try again.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        _notify_vendor(
            vendor            = vendor,
            notification_type = Notification.NotificationType.PLAN_UPGRADED,
            title             = f"Plan upgraded to {new_plan.get_name_display()}",
            message           = (
                f"You are now on the {new_plan.get_name_display()} plan. "
                f"All features are available immediately."
            ),
            action_url = "/settings/subscription",
        )

        from subscriptions.tasks import send_plan_change_email
        send_plan_change_email.delay(str(vendor.id), "upgraded", new_plan.name)

        return Response(
            {
                "success": True,
                "message": (
                    f"Plan upgraded to {new_plan.get_name_display()}. "
                    f"Prorated charge: £{charge_now}."
                ),
                "data": ActiveSubscriptionSerializer(new_subscription).data,
            },
            status=status.HTTP_200_OK,
        )
    # ── Downgrade plan ──

    @extend_schema(
        summary="Schedule a plan downgrade at period end",
        request=DowngradePlanSerializer,
        responses={200: {"description": "Downgrade scheduled."}},
    )
    @action(detail=False, methods=["post"], url_path="downgrade")
    def downgrade(self, request):
        vendor       = request.user
        subscription = _get_active_subscription(vendor)

        if not subscription or subscription.status != VendorSubscription.Status.ACTIVE:
            return Response(
                {
                    "success": False,
                    "message": "You need an active subscription to downgrade.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = DowngradePlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_plan      = serializer.validated_data["new_plan"]
        billing_cycle = serializer.validated_data.get(
            "billing_cycle",
            subscription.billing_cycle,
        )

        # ── Guard: new plan must be lower ──
        if new_plan.monthly_price_gbp >= subscription.plan.monthly_price_gbp:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Selected plan is not lower than your current plan. "
                        "Use the upgrade endpoint instead."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_plan == subscription.plan:
            return Response(
                {
                    "success": False,
                    "message": "You are already on this plan.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Check if a pending change already exists ──
        existing_pending = PendingPlanChange.objects.filter(
            vendor        = vendor,
            change_status = PendingPlanChange.ChangeStatus.SCHEDULED,
        ).first()

        if existing_pending:
            return Response(
                {
                    "success": False,
                    "message": (
                        f"You already have a scheduled plan change on "
                        f"{existing_pending.effective_at.strftime('%d %b %Y')}. "
                        f"Cancel it before scheduling a new one."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        effective_at = subscription.current_period_end

        PendingPlanChange.objects.create(
            vendor            = vendor,
            new_plan          = new_plan,
            new_billing_cycle = billing_cycle,
            change_type       = PendingPlanChange.ChangeType.DOWNGRADE,
            change_status     = PendingPlanChange.ChangeStatus.SCHEDULED,
            effective_at      = effective_at,
        )

        logger.info(
            "VendorSubscriptionViewSet.downgrade — scheduled | "
            "vendor=%s | new_plan=%s | effective=%s",
            vendor.email,
            new_plan.name,
            effective_at,
        )

        _notify_vendor(
            vendor            = vendor,
            notification_type = Notification.NotificationType.PLAN_DOWNGRADE_SCHEDULED,
            title             = "Plan change scheduled",
            message           = (
                f"Your plan will change to {new_plan.get_name_display()} on "
                f"{effective_at.strftime('%d %b %Y')}. "
                f"You keep all current features until then."
            ),
            action_url = "/settings/subscription",
        )

        from subscriptions.tasks import send_plan_change_email
        send_plan_change_email.delay(str(vendor.id), "downgraded", new_plan.name)

        return Response(
            {
                "success": True,
                "message": (
                    f"Your plan will change to "
                    f"{new_plan.get_name_display()} on "
                    f"{effective_at.strftime('%d %b %Y')}. "
                    f"You keep all current features until then."
                ),
                "data": {
                    "current_plan":  subscription.plan.name,
                    "new_plan":      new_plan.name,
                    "effective_at":  effective_at.isoformat(),
                },
            },
            status=status.HTTP_200_OK,
        )

    # ── Cancel subscription ──

    @extend_schema(
        summary="Cancel subscription at end of current period",
        request=CancelSubscriptionSerializer,
        responses={200: {"description": "Cancellation confirmed."}},
    )
    @action(detail=False, methods=["post"], url_path="cancel")
    def cancel(self, request):
        from otp.models import OTP

        vendor       = request.user
        subscription = _get_active_subscription(vendor)

        if not subscription or subscription.status not in [
            VendorSubscription.Status.ACTIVE,
            VendorSubscription.Status.PAST_DUE,
        ]:
            return Response(
                {
                    "success": False,
                    "message": "No active subscription to cancel.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CancelSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        otp_code = serializer.validated_data["otp_code"]

        # ── Verify OTP ──
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

        # ── Record cancellation — takes effect at period end ──
        subscription.cancelled_at = timezone.now()
        subscription.save(update_fields=["cancelled_at"])

        # ── Create pending cancellation record ──
        PendingPlanChange.objects.create(
            vendor        = vendor,
            change_type   = PendingPlanChange.ChangeType.CANCELLATION,
            change_status = PendingPlanChange.ChangeStatus.SCHEDULED,
            effective_at  = subscription.current_period_end,
        )

        logger.info(
            "VendorSubscriptionViewSet.cancel — scheduled | vendor=%s | effective=%s",
            vendor.email,
            subscription.current_period_end,
        )

        _notify_vendor(
            vendor            = vendor,
            notification_type = Notification.NotificationType.SUBSCRIPTION_CANCELLED,
            title             = "Subscription cancellation confirmed",
            message           = (
                f"Your {subscription.plan.get_name_display()} plan will end on "
                f"{subscription.current_period_end.strftime('%d %b %Y')}. "
                f"You can continue using all features until then."
            ),
            action_url = "/settings/subscription",
        )

        return Response(
            {
                "success": True,
                "message": (
                    f"Subscription will end on "
                    f"{subscription.current_period_end.strftime('%d %b %Y')}. "
                    f"You can continue using all features until then."
                ),
                "data": {
                    "plan":         subscription.plan.name,
                    "ends_at":      subscription.current_period_end.isoformat(),
                    "cancelled_at": subscription.cancelled_at.isoformat(),
                },
            },
            status=status.HTTP_200_OK,
        )

    # ── Reactivate cancelled subscription ──

    @extend_schema(
        summary="Reactivate a cancelled subscription before it expires",
        responses={200: ActiveSubscriptionSerializer},
    )
    @action(detail=False, methods=["post"], url_path="reactivate")
    def reactivate(self, request):
        vendor = request.user

        subscription = (
            VendorSubscription.objects
            .select_related("plan")
            .filter(
                vendor       = vendor,
                cancelled_at__isnull = False,
            )
            .exclude(status=VendorSubscription.Status.CANCELLED)
            .order_by("-created_at")
            .first()
        )

        if not subscription:
            return Response(
                {
                    "success": False,
                    "message": "No cancelled subscription found to reactivate.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if subscription.current_period_end < timezone.now():
            return Response(
                {
                    "success": False,
                    "message": (
                        "Your subscription period has already ended. "
                        "Please subscribe again."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Reactivate — remove cancelled_at and pending cancellation ──
        subscription.cancelled_at = None
        subscription.save(update_fields=["cancelled_at"])

        PendingPlanChange.objects.filter(
            vendor        = vendor,
            change_type   = PendingPlanChange.ChangeType.CANCELLATION,
            change_status = PendingPlanChange.ChangeStatus.SCHEDULED,
        ).update(change_status=PendingPlanChange.ChangeStatus.CANCELLED)

        logger.info(
            "VendorSubscriptionViewSet.reactivate — reactivated | vendor=%s",
            vendor.email,
        )

        _notify_vendor(
            vendor            = vendor,
            notification_type = Notification.NotificationType.SUBSCRIPTION_ACTIVATED,
            title             = "Subscription reactivated",
            message           = (
                f"Your {subscription.plan.get_name_display()} plan has been reactivated. "
                f"It will continue until "
                f"{subscription.current_period_end.strftime('%d %b %Y')}."
            ),
            action_url = "/settings/subscription",
        )

        return Response(
            {
                "success": True,
                "message": "Subscription reactivated successfully.",
                "data":    ActiveSubscriptionSerializer(subscription).data,
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Admin Subscription ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class AdminSubscriptionViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    Admin-only subscription management.

    GET   /api/subscriptions/admin/                  — list all subscriptions
    GET   /api/subscriptions/admin/{id}/             — subscription detail
    POST  /api/subscriptions/admin/{id}/override/    — override plan manually
    POST  /api/subscriptions/admin/{id}/expire/      — force expire
    GET   /api/subscriptions/admin/stats/            — subscription statistics
    """

    permission_classes = [IsAdmin]
    serializer_class   = AdminSubscriptionListSerializer

    def get_queryset(self):
        qs = (
            VendorSubscription.objects
            .select_related("vendor", "plan")
            .order_by("-created_at")
        )

        plan          = self.request.query_params.get("plan")
        sub_status    = self.request.query_params.get("status")
        billing_cycle = self.request.query_params.get("billing_cycle")
        search        = self.request.query_params.get("search")

        if plan:
            qs = qs.filter(plan__name=plan)
        if sub_status:
            qs = qs.filter(status=sub_status)
        if billing_cycle:
            qs = qs.filter(billing_cycle=billing_cycle)
        if search:
            qs = qs.filter(vendor__email__icontains=search)

        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ActiveSubscriptionSerializer
        return AdminSubscriptionListSerializer

    # ── List ──

    @extend_schema(
        summary="List all subscriptions (admin only)",
        parameters=[
            OpenApiParameter("plan",          description="Filter by plan name",     required=False, type=str),
            OpenApiParameter("status",        description="Filter by status",        required=False, type=str),
            OpenApiParameter("billing_cycle", description="Filter by billing cycle", required=False, type=str),
            OpenApiParameter("search",        description="Search by vendor email",  required=False, type=str),
        ],
        responses={200: AdminSubscriptionListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    # ── Retrieve ──

    @extend_schema(
        summary="Get subscription detail (admin only)",
        responses={200: ActiveSubscriptionSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    # ── Override plan ──

    @extend_schema(
        summary="Override a vendor's plan manually",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "plan_name":     {"type": "string"},
                    "billing_cycle": {"type": "string"},
                    "reason":        {"type": "string"},
                },
                "required": ["plan_name", "reason"],
            }
        },
        responses={200: ActiveSubscriptionSerializer},
    )
    @action(detail=True, methods=["post"], url_path="override")
    def override(self, request, pk=None):
        subscription = self.get_object()
        plan_name    = request.data.get("plan_name")
        reason       = request.data.get("reason", "").strip()
        billing_cycle = request.data.get(
            "billing_cycle",
            subscription.billing_cycle,
        )

        if not plan_name:
            return Response(
                {
                    "success": False,
                    "message": "plan_name is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not reason:
            return Response(
                {
                    "success": False,
                    "message": "A reason is required for plan overrides.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_plan = SubscriptionPlan.objects.get(
                name      = plan_name,
                is_active = True,
            )
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": f"Plan '{plan_name}' not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        old_plan_name = subscription.plan.name

        subscription.plan          = new_plan
        subscription.billing_cycle = billing_cycle
        subscription.status        = VendorSubscription.Status.ACTIVE
        subscription.save(update_fields=["plan", "billing_cycle", "status"])

        logger.info(
            "AdminSubscriptionViewSet.override — plan changed | "
            "vendor=%s | %s → %s | reason=%s | admin=%s",
            subscription.vendor.email,
            old_plan_name,
            new_plan.name,
            reason,
            request.user.email,
        )

        _notify_vendor(
            vendor            = subscription.vendor,
            notification_type = Notification.NotificationType.PLAN_UPGRADED,
            title             = f"Your plan has been updated",
            message           = (
                f"Your subscription has been updated to "
                f"{new_plan.get_name_display()} by the StockSense team. "
                f"Reason: {reason}"
            ),
            action_url = "/settings/subscription",
        )

        return Response(
            {
                "success": True,
                "message": (
                    f"Plan updated from {old_plan_name} to "
                    f"{new_plan.name} for {subscription.vendor.email}."
                ),
                "data": ActiveSubscriptionSerializer(subscription).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Force expire ──

    @extend_schema(
        summary="Force expire a subscription (admin only)",
        request={
            "application/json": {
                "type": "object",
                "properties": {"reason": {"type": "string"}},
                "required": ["reason"],
            }
        },
        responses={200: {"description": "Subscription expired."}},
    )
    @action(detail=True, methods=["post"], url_path="expire")
    def expire(self, request, pk=None):
        subscription = self.get_object()
        reason       = request.data.get("reason", "").strip()

        if not reason:
            return Response(
                {
                    "success": False,
                    "message": "A reason is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        subscription.status        = VendorSubscription.Status.EXPIRED
        subscription.current_period_end = timezone.now()
        subscription.save(update_fields=["status", "current_period_end"])

        logger.info(
            "AdminSubscriptionViewSet.expire — expired | vendor=%s | reason=%s | admin=%s",
            subscription.vendor.email,
            reason,
            request.user.email,
        )

        _notify_vendor(
            vendor            = subscription.vendor,
            notification_type = Notification.NotificationType.SUBSCRIPTION_EXPIRED,
            title             = "Your subscription has expired",
            message           = (
                "Your StockSense subscription has been expired. "
                f"Reason: {reason}. "
                "Please contact support for more information."
            ),
            action_url = "/support",
        )

        return Response(
            {
                "success": True,
                "message": f"Subscription expired for {subscription.vendor.email}.",
            },
            status=status.HTTP_200_OK,
        )

    # ── Stats ──

    @extend_schema(
        summary="Subscription statistics (admin only)",
        responses={200: {"description": "Subscription stats."}},
    )
    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        from django.db.models import Count

        total   = VendorSubscription.objects.count()
        active  = VendorSubscription.objects.filter(status="active").count()
        pending = VendorSubscription.objects.filter(
            status__in=["pending_approval", "pending_payment"]
        ).count()
        expired   = VendorSubscription.objects.filter(status="expired").count()
        cancelled = VendorSubscription.objects.filter(status="cancelled").count()
        past_due  = VendorSubscription.objects.filter(status="past_due").count()

        by_plan = (
            VendorSubscription.objects
            .filter(status="active")
            .values("plan__name")
            .annotate(count=Count("id"))
            .order_by("plan__name")
        )

        return Response(
            {
                "success": True,
                "data": {
                    "total":     total,
                    "active":    active,
                    "pending":   pending,
                    "expired":   expired,
                    "cancelled": cancelled,
                    "past_due":  past_due,
                    "by_plan": [
                        {
                            "plan":  r["plan__name"],
                            "count": r["count"],
                        }
                        for r in by_plan
                    ],
                },
            },
            status=status.HTTP_200_OK,
        )


        # ── Add these two actions inside AdminSubscriptionViewSet ──

    @extend_schema(
        summary="Revenue breakdown by subscription plan (admin only)",
        parameters=[
            OpenApiParameter("from_date", description="Start date YYYY-MM-DD", required=False, type=str),
            OpenApiParameter("to_date",   description="End date YYYY-MM-DD",   required=False, type=str),
            OpenApiParameter("currency",  description="Filter by currency",    required=False, type=str),
        ],
        responses={200: {"description": "Revenue stats by plan."}},
    )
    @action(detail=False, methods=["get"], url_path="revenue")
    def revenue(self, request):
        from django.db.models import Sum, Count, Q
        from .models import PaymentRecord
        from .serializers import RevenueStatsSerializer

        # ── Date filters ──
        from_date = request.query_params.get("from_date")
        to_date   = request.query_params.get("to_date")
        currency  = request.query_params.get("currency", "GBP")

        qs = PaymentRecord.objects.filter(currency=currency)

        if from_date:
            qs = qs.filter(created_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(created_at__date__lte=to_date)

        # ── Per-plan aggregation ──
        plan_rows = (
            qs
            .values("plan__name", "plan__id")
            .annotate(
                total_revenue   = Sum("amount"),
                payment_count   = Count("id"),
                initial_revenue = Sum("amount", filter=Q(payment_type="initial")),
                upgrade_revenue = Sum("amount", filter=Q(payment_type="upgrade")),
                renewal_revenue = Sum("amount", filter=Q(payment_type="renewal")),
                monthly_revenue = Sum("amount", filter=Q(billing_cycle="monthly")),
                yearly_revenue  = Sum("amount", filter=Q(billing_cycle="yearly")),
                active_vendors  = Count(
                    "vendor",
                    distinct=True,
                    filter=Q(subscription__status="active"),
                ),
            )
            .order_by("-total_revenue")
        )

        # ── Map plan id → display name ──
        plan_display_map = {
            p.name: p.get_name_display()
            for p in SubscriptionPlan.objects.all()
        }

        by_plan = []
        for row in plan_rows:
            by_plan.append({
                "plan_name":       row["plan__name"],
                "plan_display":    plan_display_map.get(row["plan__name"], row["plan__name"]),
                "total_revenue":   row["total_revenue"]   or Decimal("0.00"),
                "payment_count":   row["payment_count"]   or 0,
                "active_vendors":  row["active_vendors"]  or 0,
                "initial_revenue": row["initial_revenue"] or Decimal("0.00"),
                "upgrade_revenue": row["upgrade_revenue"] or Decimal("0.00"),
                "renewal_revenue": row["renewal_revenue"] or Decimal("0.00"),
                "monthly_revenue": row["monthly_revenue"] or Decimal("0.00"),
                "yearly_revenue":  row["yearly_revenue"]  or Decimal("0.00"),
            })

        total_revenue = qs.aggregate(t=Sum("amount"))["t"] or Decimal("0.00")
        total_payments = qs.count()
        total_active_vendors = (
            VendorSubscription.objects
            .filter(status=VendorSubscription.Status.ACTIVE)
            .values("vendor")
            .distinct()
            .count()
        )

        return Response({
            "success": True,
            "data": {
                "total_revenue":        total_revenue,
                "total_payments":       total_payments,
                "total_active_vendors": total_active_vendors,
                "currency":             currency,
                "by_plan":              by_plan,
            },
        }, status=status.HTTP_200_OK)


    @extend_schema(
        summary="Paginated payment log (admin only)",
        parameters=[
            OpenApiParameter("plan",         description="Filter by plan name",   required=False, type=str),
            OpenApiParameter("payment_type", description="initial/upgrade/renewal", required=False, type=str),
            OpenApiParameter("from_date",    description="Start date YYYY-MM-DD", required=False, type=str),
            OpenApiParameter("to_date",      description="End date YYYY-MM-DD",   required=False, type=str),
            OpenApiParameter("search",       description="Search vendor email",   required=False, type=str),
        ],
        responses={200: {"description": "Paginated payment records."}},
    )
    @action(detail=False, methods=["get"], url_path="payments")
    def payments(self, request):
        from .models import PaymentRecord
        from .serializers import PaymentRecordSerializer

        qs = (
            PaymentRecord.objects
            .select_related("vendor", "plan")
            .order_by("-created_at")
        )

        plan         = request.query_params.get("plan")
        payment_type = request.query_params.get("payment_type")
        from_date    = request.query_params.get("from_date")
        to_date      = request.query_params.get("to_date")
        search       = request.query_params.get("search")

        if plan:
            qs = qs.filter(plan__name=plan)
        if payment_type:
            qs = qs.filter(payment_type=payment_type)
        if from_date:
            qs = qs.filter(created_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(created_at__date__lte=to_date)
        if search:
            qs = qs.filter(vendor__email__icontains=search)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = PaymentRecordSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = PaymentRecordSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)