# apps/reports/admin.py

from django.contrib import admin

from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display  = [
        "get_vendor_email", "report_type",
        "period_start", "period_end",
        "status", "file_size_kb", "generated_at",
    ]
    list_filter   = ["report_type", "status"]
    search_fields = ["vendor__email"]
    ordering      = ["-created_at"]
    date_hierarchy = "created_at"
    readonly_fields = [
        "id", "vendor", "report_type",
        "period_start", "period_end",
        "status", "file_url", "file_size_kb",
        "generated_at", "error_detail",
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