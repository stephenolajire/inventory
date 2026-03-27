# apps/vendors/admin.py

from django.contrib import admin

from .models import VendorProfile


@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display  = [
        "business_name", "get_email", "business_type",
        "state", "lga", "currency", "is_profile_complete",
    ]
    list_filter   = ["business_type", "state__country", "state", "currency"]
    search_fields = ["business_name", "user__email", "first_name", "last_name"]
    ordering      = ["business_name"]
    readonly_fields = [
        "id", "user", "is_profile_complete", "created_at", "updated_at",
    ]
    autocomplete_fields = ["user", "country", "state", "lga"]

    fieldsets = (
        ("Identity", {
            "fields": ("id", "user"),
        }),
        ("Owner Info", {
            "fields": ("first_name", "last_name"),
        }),
        ("Business Info", {
            "fields": (
                "business_name", "business_type",
                "business_description", "business_logo", "business_email",
            ),
        }),
        ("Location", {
            "fields": (
                "country", "state", "lga",
                "city_town", "street_address",
                "nearest_landmark", "postal_code",
            ),
        }),
        ("Preferences", {
            "fields": ("currency",),
        }),
        ("Meta", {
            "fields": ("is_profile_complete", "created_at", "updated_at"),
        }),
    )

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = "Email"
    get_email.admin_order_field = "user__email"

    def is_profile_complete(self, obj):
        return obj.is_profile_complete
    is_profile_complete.boolean = True
    is_profile_complete.short_description = "Profile Complete?"