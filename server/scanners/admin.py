# apps/scanners/admin.py

from django.contrib import admin

from .models import Scanner


@admin.register(Scanner)
class ScannerAdmin(admin.ModelAdmin):
    list_display  = [
        "serial_number", "brand", "model",
        "status", "get_vendor_email", "assigned_at",
    ]
    list_filter   = ["status", "brand"]
    search_fields = ["serial_number", "vendor__email", "brand", "model"]
    ordering      = ["serial_number"]
    readonly_fields = [
        "id", "assigned_at", "revoked_at", "created_at", "updated_at",
    ]
    autocomplete_fields = ["vendor", "registered_by"]

    fieldsets = (
        ("Device", {
            "fields": ("id", "serial_number", "brand", "model", "notes"),
        }),
        ("Status", {
            "fields": ("status",),
        }),
        ("Assignment", {
            "fields": ("vendor", "assigned_at"),
        }),
        ("Revocation", {
            "fields": ("revoked_at", "revoke_reason"),
        }),
        ("Registration", {
            "fields": ("registered_by", "created_at", "updated_at"),
        }),
    )

    def get_vendor_email(self, obj):
        return obj.vendor.email if obj.vendor else "—"
    get_vendor_email.short_description = "Vendor"
    get_vendor_email.admin_order_field = "vendor__email"