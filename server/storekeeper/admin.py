# apps/storekeeper/admin.py

from django.contrib import admin

from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model   = CartItem
    extra   = 0
    readonly_fields = [
        "id", "product", "product_name",
        "unit_price", "quantity",
        "tax_rate", "tax_amount", "line_total",
        "created_at",
    ]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display  = [
        "get_label", "get_vendor_email", "status",
        "total_amount", "payment_method",
        "paid_at", "created_at",
    ]
    list_filter   = ["status", "payment_method", "currency"]
    search_fields = ["vendor__email", "label"]
    ordering      = ["-created_at"]
    readonly_fields = [
        "id", "vendor", "subtotal", "tax_total", "total_amount",
        "amount_tendered", "change_due", "paid_at",
        "created_at", "updated_at",
    ]
    inlines = [CartItemInline]

    def get_label(self, obj):
        return obj.label or f"Cart #{str(obj.id)[:8]}"
    get_label.short_description = "Label"

    def get_vendor_email(self, obj):
        return obj.vendor.email
    get_vendor_email.short_description = "Vendor"
    get_vendor_email.admin_order_field = "vendor__email"

    def has_add_permission(self, request):
        return False


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display  = [
        "product_name", "get_cart_vendor",
        "quantity", "unit_price", "line_total",
    ]
    search_fields = ["product_name", "cart__vendor__email"]
    ordering      = ["-created_at"]
    readonly_fields = [
        "id", "cart", "product", "product_name",
        "unit_price", "quantity",
        "tax_rate", "tax_amount", "line_total",
        "created_at", "updated_at",
    ]

    def get_cart_vendor(self, obj):
        return obj.cart.vendor.email
    get_cart_vendor.short_description = "Vendor"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False