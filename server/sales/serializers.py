"""
apps/sales/serializers.py
==========================
All sale serializers are read-only.
Sales are created by the mark-as-paid flow only — never via the API.
"""

from rest_framework import serializers

from .models import Sale


class SaleListSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Sale
        fields = [
            "id",
            "cart",
            "product",
            "product_name",
            # "unit_price",
            "unit",          # ← add
            "quantity",
            "line_total",
            "payment_method",
            "currency",
            "sold_at",
        ]


class SaleDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Sale
        fields = [
            "id",
            "cart",
            "product",
            "product_name",
            # "unit_price",
            "unit",          # ← add
            "quantity",
            "tax_rate",
            "tax_amount",
            "line_total",
            "payment_method",
            "currency",
            "sold_at",
            "created_at",
        ]


class ReceiptSerializer(serializers.ModelSerializer):
    cart_total      = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    amount_tendered = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, source="cart.amount_tendered")
    change_due      = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, source="cart.change_due")

    class Meta:
        model  = Sale
        fields = [
            "id",
            "product_name",
            # "unit_price",
            "unit",          # ← add
            "quantity",
            "tax_amount",
            "line_total",
            "cart_total",
            "amount_tendered",
            "change_due",
            "payment_method",
            "currency",
            "sold_at",
        ]


class AdminSaleListSerializer(serializers.ModelSerializer):
    vendor_email = serializers.EmailField(source="vendor.email", read_only=True)

    class Meta:
        model  = Sale
        fields = [
            "id",
            "vendor_email",
            "product_name",
            "unit",          # ← add
            "quantity",
            "line_total",
            "payment_method",
            "currency",
            "sold_at",
        ]