# apps/paypal/admin.py

from django.contrib import admin

from .models import PayPalOrder, PayPalSubscription, PayPalWebhookEvent


@admin.register(PayPalOrder)
class PayPalOrderAdmin(admin.ModelAdmin):
    list_display  = [
        "paypal_order_id", "vendor", "intent",
        "amount", "currency", "status", "created_at",
    ]
    list_filter   = ["status", "intent", "currency"]
    search_fields = ["paypal_order_id", "vendor__email", "capture_id"]
    readonly_fields = [
        "paypal_order_id", "capture_id", "raw_response",
        "created_at", "updated_at",
    ]
    ordering = ["-created_at"]


@admin.register(PayPalSubscription)
class PayPalSubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        "paypal_sub_id", "vendor", "status",
        "next_billing_time", "last_payment_amount", "created_at",
    ]
    list_filter   = ["status"]
    search_fields = ["paypal_sub_id", "vendor__email", "paypal_plan_id"]
    readonly_fields = [
        "paypal_sub_id", "paypal_plan_id", "raw_response",
        "created_at", "updated_at",
    ]
    ordering = ["-created_at"]


@admin.register(PayPalWebhookEvent)
class PayPalWebhookEventAdmin(admin.ModelAdmin):
    list_display = [
        "event_id", "event_type", "resource_id",
        "processing_status", "created_at",
    ]
    list_filter   = ["processing_status", "event_type"]
    search_fields = ["event_id", "resource_id", "event_type"]
    readonly_fields = [
        "event_id", "event_type", "resource_type",
        "resource_id", "payload", "failure_reason",
        "created_at", "updated_at",
    ]
    ordering = ["-created_at"]