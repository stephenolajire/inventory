"""
apps/geography/serializers.py
==============================
Read-only serializers for geography dropdowns.
Only the fields the frontend needs to render the cascading
dropdowns (country → state → LGA) are exposed.
No write operations exist on geography records via the API.
"""

from rest_framework import serializers

from .models import Country, State, LGA


class CountryListSerializer(serializers.ModelSerializer):
    """
    Used in: vendor registration country dropdown.
    Renders: id, name, code, currency_code, currency_symbol.
    """

    class Meta:
        model  = Country
        fields = [
            "id",
            "name",
            "code",
            "currency_code",
            "currency_symbol",
        ]


class StateListSerializer(serializers.ModelSerializer):
    """
    Used in: vendor registration state dropdown (filtered by country).
    Renders: id, name, code only — country is already known from context.
    """

    class Meta:
        model  = State
        fields = [
            "id",
            "name",
            "code",
        ]


class LGAListSerializer(serializers.ModelSerializer):
    """
    Used in: vendor registration LGA dropdown (filtered by state).
    Renders: id, name only — state is already known from context.
    """

    class Meta:
        model  = LGA
        fields = [
            "id",
            "name",
        ]