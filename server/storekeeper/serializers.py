"""
apps/storekeeper/serializers.py
================================
Read serializers:
  CartItemReadSerializer   — one item row on the screen
  CartReadSerializer       — full cart state after any mutation
  CartListSerializer       — list of open cart tabs

Write serializers:
  CartCreateSerializer     — open a new cart
  CartLabelSerializer      — rename a cart tab
  ScanSerializer           — barcode scan
  CartItemUpdateSerializer — manual qty change via +/- buttons
  SetPaymentSerializer     — set payment method + cash tendered
  MarkPaidSerializer       — final checkout confirmation
"""

from rest_framework import serializers
from decimal import Decimal

from .models import Cart, CartItem


class CartItemReadSerializer(serializers.ModelSerializer):

    class Meta:
        model  = CartItem
        fields = [
            "id",
            "product",
            "product_name",
            "unit_price",
            "unit",        # ← add
            "quantity",
            "tax_rate",
            "tax_amount",
            "line_total",
        ]


class CartReadSerializer(serializers.ModelSerializer):
    """
    Full cart state returned after every mutation.
    Primary response shape for all storekeeper write operations.
    """

    items = CartItemReadSerializer(many=True, read_only=True)

    class Meta:
        model  = Cart
        fields = [
            "id",
            "label",
            "status",
            "currency",
            "subtotal",
            "tax_total",
            "total_amount",
            "payment_method",
            "amount_tendered",
            "change_due",
            "paid_at",
            "items",
        ]


class CartListSerializer(serializers.ModelSerializer):
    """
    Used in: GET /api/storekeeper/carts/
    Renders the cart tab bar.
    """

    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model  = Cart
        fields = [
            "id",
            "label",
            "status",
            "total_amount",
            "item_count",
            "created_at",
        ]


class CartCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Cart
        fields = ["label"]


class CartLabelSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Cart
        fields = ["label"]

    def validate_label(self, value: str) -> str:
        if len(value.strip()) == 0:
            raise serializers.ValidationError("Label cannot be blank.")
        return value.strip()


class ScanSerializer(serializers.Serializer):
    """
    Used in: POST /api/storekeeper/carts/{id}/scan/

    For fixed-quantity products: just send barcode.
    For variable-quantity products: send barcode + measured_quantity.
    The view will reject a variable-quantity scan that arrives
    without measured_quantity.
    """

    barcode           = serializers.CharField(max_length=50)
    measured_quantity = serializers.DecimalField(
        max_digits=10,
        decimal_places=3,
        required=False,
        allow_null=True,
        min_value=Decimal("0.001"),
    )

    def validate_barcode(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Barcode cannot be blank.")
        return value.strip().upper()

    def validate(self, attrs: dict) -> dict:
        from products.models import Product
        barcode = attrs["barcode"]

        try:
            product = Product.objects.get(barcode=barcode, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError(
                {"barcode": "No active product found for this barcode."}
            )

        if product.is_variable_quantity:
            qty = attrs.get("measured_quantity")
            if qty is None:
                raise serializers.ValidationError({
                    "measured_quantity": (
                        f"'{product.name}' is sold by {product.unit}. "
                        f"Please enter the measured quantity."
                    )
                })
            if product.minimum_quantity and qty < product.minimum_quantity:
                raise serializers.ValidationError({
                    "measured_quantity": (
                        f"Minimum for {product.name} is "
                        f"{product.minimum_quantity} {product.unit}."
                    )
                })
        else:
            # Fixed-quantity — measured_quantity is ignored if sent
            attrs["measured_quantity"] = None

        attrs["product"] = product
        return attrs


class CartItemUpdateSerializer(serializers.Serializer):
    """
    Used in: PATCH /api/storekeeper/carts/{cart_id}/items/{item_id}/
    quantity = 0 signals removal — the view deletes the CartItem.
    """
    
    quantity = serializers.DecimalField(
        max_digits=10,
        decimal_places=3,
        min_value=Decimal("0"),   # 0 = delete signal
    )


class SetPaymentSerializer(serializers.Serializer):
    """
    Used in: PATCH /api/storekeeper/carts/{id}/payment/
    """

    payment_method  = serializers.ChoiceField(
        choices=Cart.PaymentMethod.choices
    )
    amount_tendered = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        allow_null=True,
    )

    def validate(self, attrs: dict) -> dict:
        if attrs["payment_method"] == Cart.PaymentMethod.CASH:
            if not attrs.get("amount_tendered"):
                raise serializers.ValidationError({
                    "amount_tendered": (
                        "Cash amount is required when payment method is Cash."
                    )
                })
        return attrs


class MarkPaidSerializer(serializers.Serializer):
    """
    Used in: POST /api/storekeeper/carts/{id}/pay/
    Final checkout — triggers the atomic transaction.
    """

    payment_method  = serializers.ChoiceField(
        choices=Cart.PaymentMethod.choices
    )
    amount_tendered = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        allow_null=True,
    )

    def validate(self, attrs: dict) -> dict:
        if attrs["payment_method"] == Cart.PaymentMethod.CASH:
            if not attrs.get("amount_tendered"):
                raise serializers.ValidationError({
                    "amount_tendered": (
                        "Cash amount is required for Cash payments."
                    )
                })
        return attrs