"""
apps/products/models.py
"""

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from cloudinary.models import CloudinaryField

from core.models import TimeStampedModel


class Category(TimeStampedModel):

    name      = models.CharField(max_length=100, unique=True, db_index=True)
    slug      = models.SlugField(max_length=120, unique=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table            = "product_category"
        verbose_name        = _("Category")
        verbose_name_plural = _("Categories")
        ordering            = ["name"]

    def __str__(self) -> str:
        return self.name


class Product(TimeStampedModel):

    class Unit(models.TextChoices):
        EACH   = "each",   _("Each")
        CARTON = "carton", _("Carton")
        KG     = "kg",     _("Kilogram")
        LITRE  = "litre",  _("Litre")
        PACK   = "pack",   _("Pack")
        DOZEN  = "dozen",  _("Dozen")
        BAG    = "bag",    _("Bag")
        BOX    = "box",    _("Box")

    class ProcessingStatus(models.TextChoices):
        PROCESSING = "processing", _("Processing")
        ACTIVE     = "active",     _("Active")
        FAILED     = "failed",     _("Failed")

    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="products",
        db_index=True,
        limit_choices_to={"role": "vendor"},
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
        db_index=True,
    )
    name        = models.CharField(max_length=255, db_index=True)
    description = models.TextField(max_length=500, blank=True, default="")
    brand       = models.CharField(max_length=100, blank=True, default="", db_index=True)
    unit        = models.CharField(
        max_length=10,
        choices=Unit.choices,
        default=Unit.EACH,
    )
    image = CloudinaryField(
        "image",
        folder      = "stocksense/products/",
        blank       = True,
        null        = True,
        default     = None,
        help_text   = _("Product image — uploaded directly to Cloudinary."),
    )
    sku = models.CharField(
        max_length=100,
        blank=True,
        default="",
        db_index=True,
    )
    barcode = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        blank=True,
        null=True,
        default=None,
        help_text=_("System-generated Code128 barcode string."),
    )
    barcode_image = models.URLField(
        blank=True,
        default="",
        help_text=_("Cloudinary URL for the rendered barcode PNG."),
    )
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)
    cost_price    = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    discount_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    discount_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
    )
    quantity_in_stock = models.DecimalField(
        max_digits=10, decimal_places=3, default=0
    )
    low_stock_threshold = models.PositiveIntegerField(default=5)
    total_sold          = models.PositiveIntegerField(
        default=0,
        db_index=True,
    )
    is_active         = models.BooleanField(default=False, db_index=True)
    processing_status = models.CharField(
        max_length=15,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PROCESSING,
        db_index=True,
    )

    is_variable_quantity = models.BooleanField(
        default=False,
        db_index=True,
        help_text=_(
            "If True, the cashier enters the measured quantity at sale time "
            "(e.g. weight in kg). selling_price is treated as price-per-unit."
        ),
    )
    minimum_quantity = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        null=True,
        blank=True,
        help_text=_(
            "Minimum sellable quantity for variable-quantity products "
            "(e.g. 0.5 kg). Leave blank for no minimum."
        ),
    )

    class Meta:
        db_table            = "product"
        verbose_name        = _("Product")
        verbose_name_plural = _("Products")
        ordering            = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["vendor", "name"],
                condition=models.Q(is_active=True),
                name="uq_product_vendor_name_active",
            ),
            models.UniqueConstraint(
                fields=["vendor", "sku"],
                condition=~models.Q(sku=""),
                name="uq_product_vendor_sku",
            ),
        ]
        indexes = [
            models.Index(fields=["vendor", "is_active"],         name="idx_product_vendor_active"),
            models.Index(fields=["vendor", "total_sold"],        name="idx_product_vendor_total_sold"),
            models.Index(fields=["vendor", "quantity_in_stock"], name="idx_product_vendor_qty"),
            models.Index(fields=["category", "vendor"],          name="idx_product_category_vendor"),
        ]

    def __str__(self) -> str:
        return f"{self.name} [{self.vendor.email}]"

    @property
    def image_url(self) -> str:
        """Always returns a plain HTTPS URL string or empty string."""
        if not self.image:
            return ""
        from cloudinary.utils import cloudinary_url
        url, _ = cloudinary_url(str(self.image), secure=True)
        return url

    @property
    def effective_price(self):
        if (
            self.discount_price is not None
            and self.discount_expires_at is not None
            and timezone.now() < self.discount_expires_at
        ):
            return self.discount_price
        return self.selling_price

    @property
    def is_low_stock(self) -> bool:
        return self.quantity_in_stock <= self.low_stock_threshold