"""
apps/vendors/serializers.py
============================
Serializers are split by context:
  - VendorListSerializer      — one row in the admin vendor table
  - VendorDetailSerializer    — full vendor profile read
  - VendorProfileSerializer   — vendor updates their own profile
  - AdminVendorListSerializer — admin list with extra fields

Nested geography is kept shallow — only id + name are returned
to keep the response payload small and avoid N+1 queries.
The frontend dropdown already has the full geography data from
the /api/geography/ endpoints.
"""

from rest_framework import serializers

from users.serializers import UserMinimalSerializer
from .models import VendorProfile


# ─────────────────────────────────────────────────────────────────────────────
# Shallow nested serializers for embedded geography
# ─────────────────────────────────────────────────────────────────────────────

class _CountryEmbedSerializer(serializers.Serializer):
    id             = serializers.UUIDField(read_only=True)
    name           = serializers.CharField(read_only=True)
    currency_code  = serializers.CharField(read_only=True)

class _StateEmbedSerializer(serializers.Serializer):
    id   = serializers.UUIDField(read_only=True)
    name = serializers.CharField(read_only=True)

class _LGAEmbedSerializer(serializers.Serializer):
    id   = serializers.UUIDField(read_only=True)
    name = serializers.CharField(read_only=True)


# ─────────────────────────────────────────────────────────────────────────────
# Read serializers
# ─────────────────────────────────────────────────────────────────────────────

class VendorListSerializer(serializers.ModelSerializer):
    """
    Used in: admin vendor list table.
    Renders one row — no deep nesting, no heavy fields.
    State name is inlined as a string for quick display.
    """

    state_name    = serializers.CharField(source="state.name",    read_only=True, default="")
    lga_name      = serializers.CharField(source="lga.name",      read_only=True, default="")
    email         = serializers.EmailField(source="user.email",   read_only=True)
    account_status = serializers.CharField(source="user.status",  read_only=True)

    class Meta:
        model  = VendorProfile
        fields = [
            "id",
            "email",
            "business_name",
            "business_type",
            "state_name",
            "lga_name",
            "account_status",
            "created_at",
        ]


class VendorDetailSerializer(serializers.ModelSerializer):
    """
    Used in: admin vendor detail view, vendor settings page.
    Full profile including nested geography and account info.
    """

    user    = UserMinimalSerializer(read_only=True)
    country = _CountryEmbedSerializer(read_only=True)
    state   = _StateEmbedSerializer(read_only=True)
    lga     = _LGAEmbedSerializer(read_only=True)

    class Meta:
        model  = VendorProfile
        fields = [
            "id",
            "user",
            "first_name",
            "last_name",
            "business_name",
            "business_type",
            "business_description",
            "business_logo",
            "business_email",
            "country",
            "state",
            "lga",
            "city_town",
            "street_address",
            "nearest_landmark",
            "postal_code",
            "currency",
            "is_profile_complete",
            "created_at",
            "updated_at",
        ]


# ─────────────────────────────────────────────────────────────────────────────
# Write serializers
# ─────────────────────────────────────────────────────────────────────────────

class VendorProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Used in: PATCH /api/vendors/profile/
    Vendor updates their own profile from the Settings page.
    All fields are optional (partial update).
    Geography fields accept UUID FKs.
    business_logo is set via the separate media upload endpoint —
    it is intentionally excluded here to keep concerns separate.
    """

    class Meta:
        model  = VendorProfile
        fields = [
            "first_name",
            "last_name",
            "business_name",
            "business_type",
            "business_description",
            "business_email",
            "country",
            "state",
            "lga",
            "city_town",
            "street_address",
            "nearest_landmark",
            "postal_code",
            "currency",
        ]

    # apps/vendors/serializers.py

    def validate_business_name(self, value: str) -> str | None:
        # Allow blank — vendor has not set a name yet
        if not value or not value.strip():
            return None

        qs = VendorProfile.objects.filter(
            business_name__iexact=value
        ).exclude(
            pk=self.instance.pk if self.instance else None
        )

        if qs.exists():
            raise serializers.ValidationError(
                "A vendor with this business name already exists."
            )
        return value.strip()

    def validate(self, attrs: dict) -> dict:
        """
        Enforce LGA belongs to the selected State,
        and State belongs to the selected Country.
        """
        state   = attrs.get("state",   getattr(self.instance, "state",   None))
        lga     = attrs.get("lga",     getattr(self.instance, "lga",     None))
        country = attrs.get("country", getattr(self.instance, "country", None))

        if state and country and state.country_id != country.pk:
            raise serializers.ValidationError(
                {"state": "This state does not belong to the selected country."}
            )
        if lga and state and lga.state_id != state.pk:
            raise serializers.ValidationError(
                {"lga": "This LGA does not belong to the selected state."}
            )
        return attrs


class BusinessLogoUploadSerializer(serializers.ModelSerializer):
    """
    Used in: PATCH /api/vendors/profile/logo/
    Accepts only the logo URL returned by the media upload endpoint.
    Keeping this as its own serializer enforces the single-field contract.
    """

    class Meta:
        model  = VendorProfile
        fields = ["business_logo"]