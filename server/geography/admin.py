# apps/geography/admin.py

from django.contrib import admin

from .models import Country, State, LGA


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display  = ["name", "code", "currency_code", "currency_symbol", "is_active"]
    list_filter   = ["is_active"]
    search_fields = ["name", "code"]
    ordering      = ["name"]


@admin.register(State)
class StateAdmin(admin.ModelAdmin):
    list_display  = ["name", "code", "country"]
    list_filter   = ["country"]
    search_fields = ["name", "code"]
    ordering      = ["country__name", "name"]
    autocomplete_fields = ["country"]


@admin.register(LGA)
class LGAAdmin(admin.ModelAdmin):
    list_display  = ["name", "state"]
    list_filter   = ["state__country", "state"]
    search_fields = ["name"]
    ordering      = ["state__name", "name"]
    autocomplete_fields = ["state"]