# apps/subscriptions/admin.py

from django.contrib import admin

from .models import SubscriptionPlan, VendorSubscription, PendingPlanChange, PaymentRecord


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display  = [
        "name", "product_limit",
        "monthly_price_gbp", "yearly_price_gbp",
        "has_analytics", "has_reports", "has_multi_branch", "is_active",
    ]
    list_filter   = ["is_active", "has_analytics", "has_reports"]
    ordering      = ["monthly_price_gbp"]
    readonly_fields = ["id", "created_at", "updated_at"]
    search_fields = ["name"]


@admin.register(VendorSubscription)
class VendorSubscriptionAdmin(admin.ModelAdmin):
    list_display  = [
        "get_vendor_email", "plan", "billing_cycle",
        "status", "amount_paid", "currency",
        "current_period_start", "current_period_end",
    ]
    list_filter   = ["status", "plan", "billing_cycle", "currency"]
    search_fields = ["vendor__email"]
    ordering      = ["-created_at"]
    readonly_fields = [
        "id",
        "current_period_start", "current_period_end",
        "cancelled_at", "created_at", "updated_at",
    ]
    autocomplete_fields = ["vendor"]

    fieldsets = (
        ("Vendor", {
            "fields": ("id", "vendor"),
        }),
        ("Plan", {
            "fields": ("plan", "billing_cycle", "currency"),
        }),
        ("Status & Payment", {
            "fields": ("status", "amount_paid", "stripe_intent_id"),
        }),
        ("Period", {
            "fields": ("current_period_start", "current_period_end", "cancelled_at"),
        }),
        ("Meta", {
            "fields": ("created_at", "updated_at"),
        }),
    )

    def get_vendor_email(self, obj):
        return obj.vendor.email
    get_vendor_email.short_description = "Vendor"
    get_vendor_email.admin_order_field = "vendor__email"


@admin.register(PendingPlanChange)
class PendingPlanChangeAdmin(admin.ModelAdmin):
    list_display  = [
        "get_vendor_email", "change_type", "new_plan",
        "new_billing_cycle", "change_status", "effective_at",
    ]
    list_filter   = ["change_type", "change_status"]
    search_fields = ["vendor__email"]
    ordering      = ["effective_at"]
    readonly_fields = ["id", "created_at", "updated_at"]
    autocomplete_fields = ["vendor", "new_plan"]

    def get_vendor_email(self, obj):
        return obj.vendor.email
    get_vendor_email.short_description = "Vendor"
    get_vendor_email.admin_order_field = "vendor__email"


admin.site.register(PaymentRecord)