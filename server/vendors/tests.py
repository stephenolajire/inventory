"""
apps/vendors/models.py
======================
VendorProfile — extended profile for vendor users.
Separated from the User model so the auth table stays lean
and focused purely on authentication concerns.

One VendorProfile per vendor User (OneToOne).
All business, location and contact fields live here.
Profile fields are intentionally nullable — vendors complete
their profile in Settings after first login, not at registration.

Index strategy:
  - business_name: unique + db_index (platform-wide uniqueness check)
  - business_type + state: composite (admin filtering by type in a region)
  - state + lga: composite (admin geographic filtering)
  - country: db_index (used in future multi-country expansion queries)
"""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class VendorProfile(TimeStampedModel):

    class BusinessType(models.TextChoices):
        RETAIL      = "retail",      _("Retail")
        WHOLESALE   = "wholesale",   _("Wholesale")
        PHARMACY    = "pharmacy",    _("Pharmacy")
        SUPERMARKET = "supermarket", _("Supermarket")
        ELECTRONICS = "electronics", _("Electronics")
        FASHION     = "fashion",     _("Fashion")
        FOOD_BEV    = "food_bev",    _("Food & Beverage")
        OTHER       = "other",       _("Other")

    # ── Identity ──
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vendor_profile",
        db_index=True,
    )

    # ── Owner info ──
    first_name = models.CharField(max_length=100, blank=True)
    last_name  = models.CharField(max_length=100, blank=True)

    # ── Business info ──
    business_name = models.CharField(
        max_length=200,
        unique=True,
        db_index=True,
        blank=True,
    )
    business_type = models.CharField(
        max_length=20,
        choices=BusinessType.choices,
        blank=True,
        db_index=True,
    )
    business_description = models.TextField(max_length=300, blank=True)
    business_logo        = models.URLField(
        blank=True,
        help_text=_("Cloudinary URL — set via media upload endpoint."),
    )
    business_email = models.EmailField(blank=True)

    # ── Location ──
    country = models.ForeignKey(
        "geography.Country",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="vendors",
        db_index=True,
    )
    state = models.ForeignKey(
        "geography.State",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="vendors",
        db_index=True,
    )
    lga = models.ForeignKey(
        "geography.LGA",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="vendors",
        db_index=True,
    )
    city_town        = models.CharField(max_length=100, blank=True)
    street_address   = models.CharField(max_length=255, blank=True)
    nearest_landmark = models.CharField(max_length=255, blank=True)
    postal_code      = models.CharField(max_length=20,  blank=True)

    # ── Preferences ──
    currency = models.CharField(
        max_length=3,
        default="NGN",
        help_text=_("ISO 4217 code. Defaults to NGN."),
    )

    class Meta:
        db_table            = "vendor_profile"
        verbose_name        = _("Vendor Profile")
        verbose_name_plural = _("Vendor Profiles")
        indexes = [
            # Admin: filter vendors by geographic area
            models.Index(
                fields=["state", "lga"],
                name="idx_vendor_state_lga",
            ),
            # Admin: filter vendors by business type within a state
            models.Index(
                fields=["state", "business_type"],
                name="idx_vendor_state_type",
            ),
        ]

    def __str__(self) -> str:
        return self.business_name or self.user.email

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_profile_complete(self) -> bool:
        """
        Returns True when the minimum required profile fields
        are filled in. Used by the frontend to show a completion prompt.
        """
        return all([
            self.first_name,
            self.last_name,
            self.business_name,
            self.business_type,
            self.state,
            self.lga,
            self.street_address,
        ])