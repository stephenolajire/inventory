"""
apps/scanners/models.py
=======================
Physical barcode scanner registry.
Admin registers serial numbers into a pool. The system
auto-assigns the next available scanner on vendor approval.
One scanner per vendor at any point in time (OneToOne enforced
via the unique constraint on vendor when status = assigned).

Status lifecycle:
  available → assigned → revoked → available (reassigned)
  available → retired  (permanent, never reassigned)

Index strategy:
  - serial_number: unique + db_index (lookup by hardware serial)
  - status: partial index on status = "available" — the hot path
    is the pool query on vendor approval
  - vendor: db_index (reverse lookup: which scanner does this vendor have)
  - registered_by: db_index (admin audit: who registered this)
"""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class Scanner(TimeStampedModel):

    class Status(models.TextChoices):
        AVAILABLE = "available", _("Available")
        ASSIGNED  = "assigned",  _("Assigned")
        REVOKED   = "revoked",   _("Revoked")
        RETIRED   = "retired",   _("Retired")

    serial_number = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text=_("Hardware serial number printed on the device."),
    )
    brand = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)

    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.AVAILABLE,
        db_index=True,
    )
    vendor = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="scanner",
        db_index=True,
        limit_choices_to={"role": "vendor"},
    )
    assigned_at   = models.DateTimeField(null=True, blank=True)
    revoked_at    = models.DateTimeField(null=True, blank=True)
    revoke_reason = models.TextField(blank=True)

    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="registered_scanners",
        db_index=True,
        limit_choices_to={"role": "admin"},
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table            = "scanner"
        verbose_name        = _("Scanner")
        verbose_name_plural = _("Scanners")
        ordering            = ["serial_number"]
        indexes = [
            models.Index(
                fields=["status"],
                name="idx_scanner_status_available",
                condition=models.Q(status="available"),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.serial_number} [{self.get_status_display()}]"