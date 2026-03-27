"""
apps/subscriptions/serializers.py
===================================
Serializers layered by use case:
  - Plan list: public, no auth required
  - Vendor subscription detail: vendor's own active plan
  - Admin subscription list: all vendors, table view
  - Write serializers: plan selection, upgrade, downgrade
"""

from rest_framework import serializers

from .models import SubscriptionPlan, VendorSubscription, PendingPlanChange


class SubscriptionPlanListSerializer(serializers.ModelSerializer):
    """
    Used in: GET /api/subscriptions/plans/ (public pricing page).
    Renders the pricing card for each plan.
    """

    class Meta:
        model  = SubscriptionPlan
        fields = [
            "id",
            "name",
            "product_limit",
            "monthly_price_ngn",
            "yearly_price_ngn",
            "has_analytics",
            "has_reports",
            "has_multi_branch",
        ]


class ActiveSubscriptionSerializer(serializers.ModelSerializer):
    """
    Used in: GET /api/subscriptions/me/
    Renders the plan badge, billing info and period dates
    on the vendor dashboard and settings page.
    """

    plan_name         = serializers.CharField(
        source="plan.name",
        read_only=True,
    )
    plan_display_name = serializers.CharField(
        source="plan.get_name_display",
        read_only=True,
    )
    has_analytics = serializers.BooleanField(
        source="plan.has_analytics",
        read_only=True,
    )
    has_reports   = serializers.BooleanField(
        source="plan.has_reports",
        read_only=True,
    )
    product_limit = serializers.IntegerField(
        source="plan.product_limit",
        read_only=True,
    )

    class Meta:
        model  = VendorSubscription
        fields = [
            "id",
            "plan_name",
            "plan_display_name",
            "has_analytics",
            "has_reports",
            "product_limit",
            "billing_cycle",
            "currency",
            "status",
            "amount_paid",
            "current_period_start",
            "current_period_end",
        ]


class PendingPlanChangeSerializer(serializers.ModelSerializer):
    """
    Used in: embedded in ActiveSubscriptionSerializer when
    a scheduled change exists. Renders the upcoming change
    details on the settings page.
    """

    new_plan_name = serializers.CharField(
        source="new_plan.name",
        read_only=True,
        default=None,
    )

    class Meta:
        model  = PendingPlanChange
        fields = [
            "id",
            "new_plan_name",
            "new_billing_cycle",
            "change_type",
            "effective_at",
        ]


class AdminSubscriptionListSerializer(serializers.ModelSerializer):
    """
    Used in: GET /api/admin/subscriptions/ — admin table.
    One row per subscription — vendor email and plan name inlined.
    """

    vendor_email = serializers.EmailField(
        source="vendor.email",
        read_only=True,
    )
    plan_name = serializers.CharField(
        source="plan.name",
        read_only=True,
    )

    class Meta:
        model  = VendorSubscription
        fields = [
            "id",
            "vendor_email",
            "plan_name",
            "billing_cycle",
            "status",
            "amount_paid",
            "currency",
            "current_period_end",
            "created_at",
        ]


class SelectPlanSerializer(serializers.Serializer):
    """
    Used in: POST /api/subscriptions/select/
    Records plan choice at registration. No payment yet.
    """

    plan = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionPlan.objects.filter(is_active=True)
    )
    billing_cycle = serializers.ChoiceField(
        choices=VendorSubscription.BillingCycle.choices
    )
    currency = serializers.ChoiceField(
        choices=VendorSubscription.Currency.choices,
        default="NGN",
    )


class ProcessPaymentSerializer(serializers.Serializer):
    """
    Used in: POST /api/subscriptions/pay/
    Called on first login after admin approval (paid plans only).
    stripe_payment_method_id is the tokenised card from Stripe.js.
    """

    stripe_payment_method_id = serializers.CharField()


class UpgradePlanSerializer(serializers.Serializer):
    """
    Used in: POST /api/subscriptions/upgrade/
    Prorated charge is calculated in the view.
    """

    new_plan = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionPlan.objects.filter(is_active=True)
    )
    billing_cycle = serializers.ChoiceField(
        choices=VendorSubscription.BillingCycle.choices,
        required=False,
    )
    stripe_payment_method_id = serializers.CharField()


class DowngradePlanSerializer(serializers.Serializer):
    """
    Used in: POST /api/subscriptions/downgrade/
    Schedules the downgrade at period end — no immediate charge.
    """

    new_plan = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionPlan.objects.filter(is_active=True)
    )
    billing_cycle = serializers.ChoiceField(
        choices=VendorSubscription.BillingCycle.choices,
        required=False,
    )


class CancelSubscriptionSerializer(serializers.Serializer):
    """
    Used in: POST /api/subscriptions/cancel/
    Requires OTP confirmation from the vendor.
    """

    otp_code = serializers.CharField(max_length=6, min_length=6)

    def validate_otp_code(self, value: str) -> str:
        if not value.isdigit():
            raise serializers.ValidationError("OTP must be 6 digits.")
        return value
    

# apps/subscriptions/serializers.py — add at the bottom

from django.db.models import Sum, Count
from decimal import Decimal


class PlanRevenueSerializer(serializers.Serializer):
    """
    Per-plan revenue breakdown for the admin revenue dashboard.
    """
    plan_name        = serializers.CharField()
    plan_display     = serializers.CharField()
    total_revenue    = serializers.DecimalField(max_digits=14, decimal_places=2)
    active_vendors   = serializers.IntegerField()
    payment_count    = serializers.IntegerField()
    initial_revenue  = serializers.DecimalField(max_digits=14, decimal_places=2)
    upgrade_revenue  = serializers.DecimalField(max_digits=14, decimal_places=2)
    renewal_revenue  = serializers.DecimalField(max_digits=14, decimal_places=2)
    monthly_revenue  = serializers.DecimalField(max_digits=14, decimal_places=2)
    yearly_revenue   = serializers.DecimalField(max_digits=14, decimal_places=2)


class RevenueStatsSerializer(serializers.Serializer):
    """
    Top-level revenue summary — all plans combined.
    """
    total_revenue       = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_payments      = serializers.IntegerField()
    total_active_vendors = serializers.IntegerField()
    by_plan             = PlanRevenueSerializer(many=True)
    currency            = serializers.CharField(default="NGN")


class PaymentRecordSerializer(serializers.ModelSerializer):
    """
    Used in admin payment log — one row per charge.
    """
    vendor_email = serializers.EmailField(source="vendor.email", read_only=True)
    plan_name    = serializers.CharField(source="plan.name",     read_only=True)

    class Meta:
        from .models import PaymentRecord
        model  = PaymentRecord
        fields = [
            "id",
            "vendor_email",
            "plan_name",
            "payment_type",
            "amount",
            "currency",
            "billing_cycle",
            "stripe_intent_id",
            "created_at",
        ]