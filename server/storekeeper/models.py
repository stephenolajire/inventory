"""
apps/storekeeper/models.py
==========================
Cart and CartItem — the live, temporary sales session layer.

Cart      — one open session per customer at the counter.
            Multiple carts open simultaneously per vendor.
            Once paid, a Cart is permanent read-only history.

CartItem  — one row per unique product in a cart.
            Repeat scans increment quantity — no duplicate rows.
            All pricing fields are snapshotted at scan time.

Index strategy:
  Cart:
    - vendor + status: composite (storekeeper: get all open carts)
    - vendor + paid_at: composite (sales page date filtering)

  CartItem:
    - cart + product: composite unique (deduplication on scan)
"""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class Cart(TimeStampedModel):

    class Status(models.TextChoices):
        OPEN      = "open",      _("Open")
        PAID      = "paid",      _("Paid")
        ABANDONED = "abandoned", _("Abandoned")

    class PaymentMethod(models.TextChoices):
        CASH     = "cash",     _("Cash")
        CARD     = "card",     _("Card")
        TRANSFER = "transfer", _("Bank Transfer")

    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="carts",
        db_index=True,
        limit_choices_to={"role": "vendor"},
    )
    label    = models.CharField(max_length=50, blank=True, default="")
    status   = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True,
    )
    currency = models.CharField(max_length=3, default="NGN")

    subtotal     = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_total    = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    payment_method  = models.CharField(
        max_length=10,
        choices=PaymentMethod.choices,
        blank=True,
    )
    amount_tendered = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True,
    )
    change_due = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True,
    )
    paid_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table            = "cart"
        verbose_name        = _("Cart")
        verbose_name_plural = _("Carts")
        ordering            = ["-created_at"]
        indexes = [
            models.Index(
                fields=["vendor", "status"],
                name="idx_cart_vendor_status",
            ),
            models.Index(
                fields=["vendor", "paid_at"],
                name="idx_cart_vendor_paid_at",
            ),
        ]

    def __str__(self) -> str:
        label = self.label or f"Cart #{str(self.id)[:8]}"
        return f"{label} [{self.status}] — {self.vendor.email}"


class CartItem(TimeStampedModel):

    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items",
        db_index=True,
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="cart_items",
        db_index=True,
    )
    product_name = models.CharField(max_length=255)
    unit_price   = models.DecimalField(max_digits=12, decimal_places=2)
    unit         = models.CharField(max_length=10, default="each")  # ← snapshot
    quantity     = models.DecimalField(                              # ← was PositiveIntegerField
        max_digits=10,
        decimal_places=3,
        default=1,
    )
    tax_rate   = models.DecimalField(max_digits=5,  decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table            = "cart_item"
        verbose_name        = _("Cart Item")
        verbose_name_plural = _("Cart Items")
        # UniqueConstraint on (cart, product) intentionally removed —
        # variable-quantity products (e.g. plantain weighed twice)
        # appear as separate line items, not merged rows.
        indexes = [
            models.Index(
                fields=["cart", "product"],
                name="idx_cart_item_cart_product",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.product_name} × {self.quantity} {self.unit} "
            f"in Cart {str(self.cart_id)[:8]}"
        )