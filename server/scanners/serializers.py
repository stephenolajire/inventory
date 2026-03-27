"""
apps/scanners/serializers.py
=============================
Serializers split by role:
  - Vendor sees only their assigned scanner serial + status.
  - Admin sees full pool detail including registration metadata.
  - Admin retrieve (detail) additionally embeds the full vendor
    profile and that vendor's active subscription.
"""

from rest_framework import serializers

from users.serializers import UserMinimalSerializer
from vendors.models import VendorProfile
from subscriptions.models import VendorSubscription, SubscriptionPlan

from .models import Scanner


# ─────────────────────────────────────────────────────────────
# Vendor-facing
# ─────────────────────────────────────────────────────────────

class ScannerVendorSerializer(serializers.ModelSerializer):
    """
    Used in: GET /api/vendors/profile/ (embedded in vendor detail).
    Vendor sees only their scanner serial and current status.
    Nothing about other scanners or admin metadata is exposed.
    """

    class Meta:
        model  = Scanner
        fields = [
            "id",
            "serial_number",
            "brand",
            "model",
            "status",
            "assigned_at",
        ]


# ─────────────────────────────────────────────────────────────
# Admin pool — list
# ─────────────────────────────────────────────────────────────

class ScannerListSerializer(serializers.ModelSerializer):
    """
    Used in: GET /api/scanners/ (admin pool overview table).
    One row per scanner — vendor name inlined for quick display.
    """

    vendor_email = serializers.EmailField(
        source="vendor.email",
        read_only=True,
        default=None,
    )

    class Meta:
        model  = Scanner
        fields = [
            "id",
            "serial_number",
            "brand",
            "model",
            "status",
            "vendor_email",
            "assigned_at",
            "created_at",
        ]


# ─────────────────────────────────────────────────────────────
# Admin detail — nested sub-serializers
# ─────────────────────────────────────────────────────────────

class _SubscriptionPlanInlineSerializer(serializers.ModelSerializer):
    """Plan snapshot embedded inside a vendor's active subscription."""

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


class _ActiveSubscriptionInlineSerializer(serializers.ModelSerializer):
    """
    Active subscription embedded inside the vendor detail block.
    Returns None when the vendor has no non-cancelled subscription.
    """

    plan = _SubscriptionPlanInlineSerializer(read_only=True)

    class Meta:
        model  = VendorSubscription
        fields = [
            "id",
            "plan",
            "billing_cycle",
            "currency",
            "status",
            "amount_paid",
            "current_period_start",
            "current_period_end",
            "cancelled_at",
            "created_at",
        ]


class _VendorProfileInlineSerializer(serializers.ModelSerializer):
    """
    Full vendor profile block embedded inside the scanner detail.
    Mirrors the fields available on VendorProfile.
    """

    country_name = serializers.CharField(
        source="country.name",
        read_only=True,
        default=None,
    )
    state_name = serializers.CharField(
        source="state.name",
        read_only=True,
        default=None,
    )
    lga_name = serializers.CharField(
        source="lga.name",
        read_only=True,
        default=None,
    )

    class Meta:
        model  = VendorProfile
        fields = [
            "first_name",
            "last_name",
            "business_name",
            "business_type",
            "business_description",
            "business_logo",
            "business_email",
            "country_name",
            "state_name",
            "lga_name",
            "city_town",
            "street_address",
            "nearest_landmark",
            "postal_code",
            "currency",
        ]


class _VendorDetailInlineSerializer(serializers.Serializer):
    """
    Flattened vendor block: User fields + VendorProfile + active subscription.
    Built manually (not ModelSerializer) because it spans three models.
    """

    # ── User fields ──
    id             = serializers.UUIDField()
    email          = serializers.EmailField()
    role           = serializers.CharField()
    status         = serializers.CharField()
    email_verified = serializers.BooleanField()
    approved_at    = serializers.DateTimeField(default=None)
    last_login     = serializers.DateTimeField(default=None)
    date_joined    = serializers.DateTimeField(source="created_at", default=None)

    # ── Profile (nested) ──
    profile = serializers.SerializerMethodField()

    # ── Subscription (nested) ──
    subscription = serializers.SerializerMethodField()

    def get_profile(self, vendor):
        profile = getattr(vendor, "vendor_profile", None)
        if not profile:
            return None
        return _VendorProfileInlineSerializer(profile).data

    def get_subscription(self, vendor):
        # Prefer prefetched data if available, otherwise hit the DB
        sub = (
            VendorSubscription.objects
            .select_related("plan")
            .filter(vendor=vendor)
            .exclude(status=VendorSubscription.Status.CANCELLED)
            .order_by("-created_at")
            .first()
        )
        if not sub:
            return None
        return _ActiveSubscriptionInlineSerializer(sub).data


# ─────────────────────────────────────────────────────────────
# Admin detail — top-level
# ─────────────────────────────────────────────────────────────

class ScannerDetailSerializer(serializers.ModelSerializer):
    """
    Used in: GET /api/scanners/{id}/ (admin scanner detail).
    Full scanner record + full vendor block (profile + subscription).
    registered_by is the admin who added the scanner to the pool.
    """

    vendor        = _VendorDetailInlineSerializer(read_only=True)
    registered_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model  = Scanner
        fields = [
            "id",
            "serial_number",
            "brand",
            "model",
            "status",
            "vendor",
            "assigned_at",
            "revoked_at",
            "revoke_reason",
            "registered_by",
            "notes",
            "created_at",
            "updated_at",
        ]


# ─────────────────────────────────────────────────────────────
# Write serializers
# ─────────────────────────────────────────────────────────────

class ScannerRegisterSerializer(serializers.ModelSerializer):
    """
    Used in: POST /api/scanners/ (admin registers a single scanner).
    serial_number uniqueness enforced at both DB and serializer level.
    """

    class Meta:
        model  = Scanner
        fields = [
            "serial_number",
            "brand",
            "model",
            "notes",
        ]

    def validate_serial_number(self, value: str) -> str:
        if Scanner.objects.filter(serial_number__iexact=value).exists():
            raise serializers.ValidationError(
                "A scanner with this serial number is already registered."
            )
        return value.upper()


class ScannerRevokeSerializer(serializers.ModelSerializer):
    """
    Used in: PATCH /api/scanners/{id}/revoke/ (admin revokes a scanner).
    Only revoke_reason is writable — status is set by the view.
    """

    class Meta:
        model  = Scanner
        fields = ["revoke_reason"]