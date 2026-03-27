# apps/sales/admin.py

from django.contrib import admin

from .models import Sale


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display  = [
        "product_name", "get_vendor_email",
        "quantity", "line_total",
        "payment_method", "currency", "sold_at",
    ]
    list_filter   = ["payment_method", "currency"]
    search_fields = ["product_name", "vendor__email"]
    ordering      = ["-sold_at"]
    date_hierarchy = "sold_at"
    readonly_fields = [
        "id", "vendor", "cart", "product",
        "product_name", "quantity",
        "tax_rate", "tax_amount", "line_total",
        "payment_method", "currency", "sold_at",
        "created_at", "updated_at",
    ]

    def get_vendor_email(self, obj):
        return obj.vendor.email
    get_vendor_email.short_description = "Vendor"
    get_vendor_email.admin_order_field = "vendor__email"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False