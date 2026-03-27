# apps/products/admin.py

from django.contrib import admin

from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ["name", "slug", "is_active", "created_at"]
    list_filter   = ["is_active"]
    search_fields = ["name", "slug"]
    ordering      = ["name"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display  = [
        "name", "get_vendor_email", "category",
        "selling_price", "quantity_in_stock",
        "total_sold", "is_active", "processing_status","is_variable_quantity"
    ]
    list_filter   = [
        "is_active", "processing_status",
        "category", "unit",
    ]
    search_fields = [
        "name", "barcode", "sku",
        "vendor__email", "brand",
    ]
    ordering      = ["-created_at"]
    readonly_fields = [
        "id", "barcode", "barcode_image",
        "total_sold", "processing_status",
        "created_at", "updated_at",
    ]
    autocomplete_fields = ["vendor", "category"]

    fieldsets = (
        ("Ownership", {
            "fields": ("id", "vendor", "category"),
        }),
        ("Core Info", {
            "fields": (
                "name", "description", "brand",
                "unit", "image", "sku",
            ),
        }),
        ("Barcode", {
            "fields": ("barcode", "barcode_image"),
        }),
        ("Pricing", {
            "fields": (
                "selling_price", "cost_price",
                "discount_price", "discount_expires_at",
                "tax_rate",
            ),
        }),
        ("Inventory", {
            "fields": ("quantity_in_stock", "low_stock_threshold", "total_sold"),
        }),
        ("Lifecycle", {
            "fields": ("is_active", "processing_status"),
        }),
        ("Meta", {
            "fields": ("created_at", "updated_at"),
        }),
    )

    def get_vendor_email(self, obj):
        return obj.vendor.email
    get_vendor_email.short_description = "Vendor"
    get_vendor_email.admin_order_field = "vendor__email"