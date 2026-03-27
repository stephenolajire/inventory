# apps/otp/admin.py

from django.contrib import admin

from .models import OTP


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display  = [
        "user", "purpose", "is_used", "is_expired", "expires_at", "created_at",
    ]
    list_filter   = ["purpose", "is_used"]
    search_fields = ["user__email"]
    ordering      = ["-created_at"]
    readonly_fields = [
        "id", "user", "purpose", "code",
        "expires_at", "is_used", "created_at", "updated_at",
    ]

    def is_expired(self, obj):
        return obj.is_expired
    is_expired.boolean = True
    is_expired.short_description = "Expired?"