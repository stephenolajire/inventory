"""
apps/geography/models.py
========================
Reference tables for countries, states and LGAs.
Seeded at migration time — no user creates these records.

Nigeria is the primary use case:
  - 36 states + FCT Abuja
  - 774 Local Government Areas

Designed to support future expansion to other countries
(UK, Ghana, Kenya) without schema changes.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class Country(TimeStampedModel):
    """
    Top-level geography reference.
    Nigeria (NG) is seeded as the default country at id=1.
    """

    name          = models.CharField(max_length=100, unique=True)
    code          = models.CharField(
        max_length=3,
        unique=True,
        db_index=True,
        help_text=_("ISO 3166-1 alpha-2 code e.g. NG, GB, GH."),
    )
    currency_code = models.CharField(
        max_length=3,
        default="NGN",
        help_text=_("ISO 4217 currency code e.g. NGN, GBP, USD."),
    )
    currency_symbol = models.CharField(
        max_length=5,
        default="₦",
    )
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table            = "geo_country"
        verbose_name        = _("Country")
        verbose_name_plural = _("Countries")
        ordering            = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class State(TimeStampedModel):
    """
    States within a country.
    Nigeria has 36 states + FCT Abuja = 37 records.
    """

    country = models.ForeignKey(
        Country,
        on_delete=models.PROTECT,
        related_name="states",
        db_index=True,
    )
    name = models.CharField(max_length=100)
    code = models.CharField(
        max_length=10,
        help_text=_("State abbreviation e.g. OY, LA, AB."),
    )

    class Meta:
        db_table            = "geo_state"
        verbose_name        = _("State")
        verbose_name_plural = _("States")
        ordering            = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["country", "code"],
                name="uq_state_country_code",
            ),
            models.UniqueConstraint(
                fields=["country", "name"],
                name="uq_state_country_name",
            ),
        ]
        indexes = [
            models.Index(
                fields=["country", "name"],
                name="idx_state_country_name",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name}, {self.country.code}"


class LGA(TimeStampedModel):
    """
    Local Government Areas within a state.
    Nigeria has 774 LGAs seeded at migration.
    Cascades from State — filtered dynamically when
    the vendor selects a state in the registration form.
    """

    state = models.ForeignKey(
        State,
        on_delete=models.PROTECT,
        related_name="lgas",
        db_index=True,
    )
    name = models.CharField(max_length=100)

    class Meta:
        db_table            = "geo_lga"
        verbose_name        = _("LGA")
        verbose_name_plural = _("LGAs")
        ordering            = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["state", "name"],
                name="uq_lga_state_name",
            ),
        ]
        indexes = [
            models.Index(
                fields=["state", "name"],
                name="idx_lga_state_name",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} — {self.state.name}"