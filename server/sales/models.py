"""
apps/sales/models.py
====================
Sale — the permanent, immutable record of every completed transaction.

A Sale row is created for every CartItem when a Cart is marked paid.
Multiple Sale rows share the same cart FK — together they form one receipt.

Design decisions:
  - vendor is a direct FK (not accessed via cart.vendor) — makes
    vendor-scoped queries fast with no joins.
  - All price fields are snapshotted from CartItem at payment time.
  - product FK is nullable — if vendor deletes a product, the sale
    record is preserved with snapshot fields intact.
  - sold_at maps to cart.paid_at and is the authoritative timestamp
    for all analytics.

Index strategy:
  - vendor + sold_at: composite (primary analytics range query)
  - vendor + product: composite (product performance analytics)
  - vendor + payment_method: composite (payment breakdown)
  - cart: db_index (group sale rows into one receipt view)
  - product + sold_at: composite (product trend analytics)
"""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class Sale(TimeStampedModel):

    class PaymentMethod(models.TextChoices):
        CASH     = "cash",     _("Cash")
        CARD     = "card",     _("Card")
        TRANSFER = "transfer", _("Bank Transfer")

    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sales",
        db_index=True,
        limit_choices_to={"role": "vendor"},
    )
    cart = models.ForeignKey(
        "storekeeper.Cart",
        on_delete=models.PROTECT,
        related_name="sales",
        db_index=True,
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales",
        db_index=True,
    )
    product_name   = models.CharField(max_length=255)
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        help_text=_("Supports fractional units for weighed items (e.g. 2.500 kg)."),
    )
    unit = models.CharField(
        max_length=10,
        default="each",
        help_text=_("Snapshotted from product at sale time."),
    )
    tax_rate       = models.DecimalField(max_digits=5,  decimal_places=2, default=0)
    tax_amount     = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total     = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=PaymentMethod.choices)
    currency       = models.CharField(max_length=3, default="NGN")
    sold_at        = models.DateTimeField(db_index=True)

    class Meta:
        db_table            = "sale"
        verbose_name        = _("Sale")
        verbose_name_plural = _("Sales")
        ordering            = ["-sold_at"]
        indexes = [
            models.Index(
                fields=["vendor", "sold_at"],
                name="idx_sale_vendor_sold_at",
            ),
            models.Index(
                fields=["vendor", "product"],
                name="idx_sale_vendor_product",
            ),
            models.Index(
                fields=["vendor", "payment_method"],
                name="idx_sale_vendor_payment",
            ),
            models.Index(
                fields=["product", "sold_at"],
                name="idx_sale_product_sold_at",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.product_name} × {self.quantity} {self.unit} — "
            f"{self.vendor.email} @ {self.sold_at:%Y-%m-%d %H:%M}"
        )