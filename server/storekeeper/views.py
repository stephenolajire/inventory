# storekeeper/views.py

import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count
from decimal import Decimal

from django.utils import timezone

from rest_framework import status, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsApprovedVendor
from notifications.models import Notification
from products.models import Product
from sales.models import Sale

from .models import Cart, CartItem
from .serializers import (
    CartListSerializer,
    CartReadSerializer,
    CartCreateSerializer,
    CartLabelSerializer,
    ScanSerializer,
    CartItemUpdateSerializer,
    SetPaymentSerializer,
    MarkPaidSerializer,
)

logger = logging.getLogger(__name__)
User   = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _recalculate_cart(cart: Cart) -> None:
    """
    Recomputes cart subtotal, tax total and total amount
    from all its CartItems and saves the result.
    Also updates change_due if a cash amount was already entered.
    Called after every scan, qty update or item removal.
    """
    items = cart.items.all()

    subtotal  = sum(item.line_total  for item in items)
    tax_total = sum(item.tax_amount  for item in items)
    total     = subtotal + tax_total

    cart.subtotal     = subtotal
    cart.tax_total    = tax_total
    cart.total_amount = total

    if cart.amount_tendered is not None:
        cart.change_due = max(cart.amount_tendered - total, 0)

    cart.save(update_fields=[
        "subtotal", "tax_total", "total_amount", "change_due"
    ])


def _notify_low_stock(vendor, product: Product) -> None:
    """
    Creates a low-stock in-app notification for the vendor.
    Called after stock is decremented on payment.
    """
    Notification.objects.create(
        recipient           = vendor,
        notification_type   = Notification.NotificationType.LOW_STOCK,
        title               = f"Low stock — {product.name}",
        message             = (
            f"'{product.name}' has {product.quantity_in_stock} "
            f"unit(s) remaining. Consider restocking soon."
        ),
        channel             = Notification.Channel.IN_APP,
        related_object_type = "Product",
        related_object_id   = product.id,
        action_url          = f"/products/{product.id}",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Storekeeper ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class StorekeeperViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    The live counter screen API.

    GET    /api/storekeeper/carts/                        — list open carts (tab bar)
    POST   /api/storekeeper/carts/                        — open new cart
    GET    /api/storekeeper/carts/{id}/                   — get cart detail with items
    PATCH  /api/storekeeper/carts/{id}/label/             — rename cart tab
    POST   /api/storekeeper/carts/{id}/scan/              — scan a barcode
    PATCH  /api/storekeeper/carts/{id}/items/{item_id}/   — update item quantity
    DELETE /api/storekeeper/carts/{id}/items/{item_id}/   — remove item from cart
    DELETE /api/storekeeper/carts/{id}/clear/             — abandon and clear cart
    PATCH  /api/storekeeper/carts/{id}/payment/           — set payment method
    POST   /api/storekeeper/carts/{id}/pay/               — mark as paid
    GET    /api/storekeeper/carts/history/                — paid cart history
    """

    permission_classes = [IsApprovedVendor]

    def get_queryset(self):
        return (
            Cart.objects
            .filter(
                vendor = self.request.user,
                status = Cart.Status.OPEN,
            )
            .annotate(item_count=Count("items"))
            .order_by("created_at")
        )

    def get_serializer_class(self):
        if self.action == "list":
            return CartListSerializer
        if self.action == "create":
            return CartCreateSerializer
        if self.action == "rename":
            return CartLabelSerializer
        if self.action == "scan":
            return ScanSerializer
        if self.action == "update_item":
            return CartItemUpdateSerializer
        if self.action == "set_payment":
            return SetPaymentSerializer
        if self.action == "pay":
            return MarkPaidSerializer
        return CartReadSerializer

    # ── List open carts (tab bar) ──

    @extend_schema(
        summary="List all open cart sessions (tab bar)",
        responses={200: CartListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        qs         = self.get_queryset()
        serializer = CartListSerializer(qs, many=True)
        return Response(
            {
                "success": True,
                "count":   qs.count(),
                "data":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Get cart detail ──

    @extend_schema(
        summary="Get full cart detail with all items",
        responses={200: CartReadSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        cart = (
            Cart.objects
            .prefetch_related("items__product")
            .filter(
                vendor = request.user,
                pk     = kwargs["pk"],
            )
            .first()
        )

        if not cart:
            return Response(
                {"success": False, "message": "Cart not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CartReadSerializer(cart)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Open new cart ──

    @extend_schema(
        summary="Open a new cart session",
        request=CartCreateSerializer,
        responses={201: CartReadSerializer},
    )
    def create(self, request, *args, **kwargs):
        serializer = CartCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # ── Auto-label if not provided ──
        label = serializer.validated_data.get("label", "").strip()
        if not label:
            open_count = Cart.objects.filter(
                vendor = request.user,
                status = Cart.Status.OPEN,
            ).count()
            label = f"Customer {open_count + 1}"

        vendor = request.user
        cart   = Cart.objects.create(
            vendor   = vendor,
            label    = label,
            currency = getattr(
                vendor.vendor_profile,
                "currency",
                "NGN",
            ) if hasattr(vendor, "vendor_profile") else "NGN",
        )

        logger.info(
            "StorekeeperViewSet.create — cart opened | cart=%s | vendor=%s",
            cart.id,
            vendor.email,
        )

        return Response(
            {
                "success": True,
                "message": f"Cart '{cart.label}' opened.",
                "data":    CartReadSerializer(cart).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Rename cart ──

    @extend_schema(
        summary="Rename a cart tab",
        request=CartLabelSerializer,
        responses={200: CartReadSerializer},
    )
    @action(detail=True, methods=["patch"], url_path="label")
    def rename(self, request, pk=None):
        cart = self._get_open_cart(pk)
        if isinstance(cart, Response):
            return cart

        serializer = CartLabelSerializer(
            cart,
            data    = request.data,
            partial = True,
        )
        serializer.is_valid(raise_exception=True)
        cart = serializer.save()

        return Response(
            {
                "success": True,
                "message": f"Cart renamed to '{cart.label}'.",
                "data":    CartReadSerializer(cart).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Scan barcode ──

    @extend_schema(
        summary="Scan a barcode — adds or increments CartItem",
        request=ScanSerializer,
        responses={200: CartReadSerializer},
    )
    @action(detail=True, methods=["post"], url_path="scan")
    def scan(self, request, pk=None):
        # ── 1. Fetch the open cart first ──
        cart = self._get_open_cart(pk)
        if isinstance(cart, Response):
            return cart

        # ── 2. Validate the incoming payload ──
        serializer = ScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        barcode           = serializer.validated_data["barcode"]
        measured_quantity = serializer.validated_data.get("measured_quantity")
        product           = serializer.validated_data["product"]   # already resolved in ScanSerializer.validate()

        # ── 3. Resolve price, tax and quantity ──
        unit_price = product.effective_price
        tax_rate   = product.tax_rate
        quantity   = measured_quantity if product.is_variable_quantity else Decimal("1")

        tax_amount = (unit_price * quantity * tax_rate / 100).quantize(Decimal("0.01"))
        line_total = (unit_price * quantity + tax_amount).quantize(Decimal("0.01"))

        # ── 4. Add or increment CartItem ──
        if product.is_variable_quantity:
            # Each weighing is a discrete line — never merge rows
            CartItem.objects.create(
                cart         = cart,
                product      = product,
                product_name = product.name,
                unit_price   = unit_price,
                unit         = product.unit,
                quantity     = quantity,
                tax_rate     = tax_rate,
                tax_amount   = tax_amount,
                line_total   = line_total,
            )
            action_taken = "added"

        else:
            # Fixed-quantity — merge repeat scans into one row
            existing = cart.items.filter(product=product).first()

            if existing:
                existing.quantity  += Decimal("1")
                existing.tax_amount = (
                    unit_price * existing.quantity * tax_rate / 100
                ).quantize(Decimal("0.01"))
                existing.line_total = (
                    unit_price * existing.quantity + existing.tax_amount
                ).quantize(Decimal("0.01"))
                existing.save(update_fields=["quantity", "tax_amount", "line_total"])
                action_taken = "incremented"
            else:
                CartItem.objects.create(
                    cart         = cart,
                    product      = product,
                    product_name = product.name,
                    unit_price   = unit_price,
                    unit         = product.unit,
                    quantity     = Decimal("1"),
                    tax_rate     = tax_rate,
                    tax_amount   = tax_amount,
                    line_total   = line_total,
                )
                action_taken = "added"

        # ── 5. Recalculate cart totals ──
        _recalculate_cart(cart)

        # ── 6. Reload with prefetch for the response ──
        cart = (
            Cart.objects
            .prefetch_related("items__product")
            .get(pk=cart.pk)
        )

        logger.info(
            "StorekeeperViewSet.scan — %s | product=%s | qty=%s | cart=%s | vendor=%s",
            action_taken,
            product.name,
            quantity,
            cart.id,
            request.user.email,
        )

        return Response(
            {
                "success":      True,
                "message":      f"'{product.name}' {action_taken}.",
                "action_taken": action_taken,
                "data":         CartReadSerializer(cart).data,
            },
            status=status.HTTP_200_OK,
        )
    # ── Update item quantity ──

    @extend_schema(
        summary="Update a cart item quantity manually",
        request=CartItemUpdateSerializer,
        responses={200: CartReadSerializer},
    )
    @action(
        detail   = True,
        methods  = ["patch"],
        url_path = "items/(?P<item_id>[^/.]+)",
    )
    def update_item(self, request, pk=None, item_id=None):
        cart = self._get_open_cart(pk)
        if isinstance(cart, Response):
            return cart

        try:
            item = cart.items.get(pk=item_id)
        except CartItem.DoesNotExist:
            return Response(
                {"success": False, "message": "Item not found in this cart."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CartItemUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_qty = serializer.validated_data["quantity"]  # now a Decimal

        if new_qty == Decimal("0"):
            # ── Remove item ──
            product_name = item.product_name
            item.delete()
            _recalculate_cart(cart)

            cart = (
                Cart.objects
                .prefetch_related("items__product")
                .get(pk=cart.pk)
            )

            logger.info(
                "StorekeeperViewSet.update_item — removed | item=%s | cart=%s | vendor=%s",
                product_name,
                cart.id,
                request.user.email,
            )

            return Response(
                {
                    "success": True,
                    "message": f"'{product_name}' removed from cart.",
                    "data":    CartReadSerializer(cart).data,
                },
                status=status.HTTP_200_OK,
            )

        # ── Update quantity ──
        item.quantity   = new_qty
        item.tax_amount = (item.unit_price * new_qty * item.tax_rate / 100).quantize(Decimal("0.01"))
        item.line_total = (item.unit_price * new_qty + item.tax_amount).quantize(Decimal("0.01"))
        item.save(update_fields=["quantity", "tax_amount", "line_total"])

        _recalculate_cart(cart)

        cart = (
            Cart.objects
            .prefetch_related("items__product")
            .get(pk=cart.pk)
        )

        logger.info(
            "StorekeeperViewSet.update_item — qty updated | product=%s | qty=%d | cart=%s",
            item.product_name,
            new_qty,
            cart.id,
        )

        return Response(
            {
                "success": True,
                "message": f"'{item.product_name}' quantity updated to {new_qty}.",
                "data":    CartReadSerializer(cart).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Remove single item ──

    @extend_schema(summary="Remove a single item from the cart")
    @action(
        detail   = True,
        methods  = ["delete"],
        url_path = "items/(?P<item_id>[^/.]+)/remove",
    )
    def remove_item(self, request, pk=None, item_id=None):
        cart = self._get_open_cart(pk)
        if isinstance(cart, Response):
            return cart

        try:
            item = cart.items.get(pk=item_id)
        except CartItem.DoesNotExist:
            return Response(
                {"success": False, "message": "Item not found in this cart."},
                status=status.HTTP_404_NOT_FOUND,
            )

        product_name = item.product_name
        item.delete()
        _recalculate_cart(cart)

        cart = (
            Cart.objects
            .prefetch_related("items__product")
            .get(pk=cart.pk)
        )

        return Response(
            {
                "success": True,
                "message": f"'{product_name}' removed from cart.",
                "data":    CartReadSerializer(cart).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Clear / abandon cart ──

    @extend_schema(summary="Abandon and clear a cart session")
    @action(detail=True, methods=["delete"], url_path="clear")
    def clear(self, request, pk=None):
        cart = self._get_open_cart(pk)
        if isinstance(cart, Response):
            return cart

        if cart.items.count() == 0:
            # Empty cart — just delete it
            cart.delete()
            return Response(
                {"success": True, "message": "Empty cart removed."},
                status=status.HTTP_200_OK,
            )

        cart.status = Cart.Status.ABANDONED
        cart.save(update_fields=["status"])

        logger.info(
            "StorekeeperViewSet.clear — abandoned | cart=%s | vendor=%s",
            cart.id,
            request.user.email,
        )

        return Response(
            {"success": True, "message": "Cart cleared."},
            status=status.HTTP_200_OK,
        )

    # ── Set payment method ──

    @extend_schema(
        summary="Set payment method and optional cash amount",
        request=SetPaymentSerializer,
        responses={200: CartReadSerializer},
    )
    @action(detail=True, methods=["patch"], url_path="payment")
    def set_payment(self, request, pk=None):
        cart = self._get_open_cart(pk)
        if isinstance(cart, Response):
            return cart

        serializer = SetPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment_method  = serializer.validated_data["payment_method"]
        amount_tendered = serializer.validated_data.get("amount_tendered")

        cart.payment_method = payment_method

        if payment_method == Cart.PaymentMethod.CASH and amount_tendered:
            if amount_tendered < cart.total_amount:
                return Response(
                    {
                        "success": False,
                        "message": (
                            f"Amount received (₦{amount_tendered}) is less "
                            f"than the total (₦{cart.total_amount})."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            cart.amount_tendered = amount_tendered
            cart.change_due      = amount_tendered - cart.total_amount

        cart.save(update_fields=[
            "payment_method", "amount_tendered", "change_due"
        ])

        cart = (
            Cart.objects
            .prefetch_related("items__product")
            .get(pk=cart.pk)
        )

        return Response(
            {
                "success": True,
                "message": f"Payment method set to {payment_method}.",
                "data":    CartReadSerializer(cart).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Mark as paid ──

    @extend_schema(
        summary="Mark cart as paid — creates Sale rows, decrements stock",
        request=MarkPaidSerializer,
        responses={200: {"description": "Payment complete. Cart cleared."}},
    )
    @action(detail=True, methods=["post"], url_path="pay")
    def pay(self, request, pk=None):
        cart = self._get_open_cart(pk)
        if isinstance(cart, Response):
            return cart

        # ── Guard: cart must have items ──
        items = list(cart.items.select_related("product").all())
        if not items:
            return Response(
                {
                    "success": False,
                    "message": "Cannot complete payment on an empty cart.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MarkPaidSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment_method  = serializer.validated_data["payment_method"]
        amount_tendered = serializer.validated_data.get("amount_tendered")

        # ── Cash amount validation ──
        if payment_method == Cart.PaymentMethod.CASH:
            if not amount_tendered:
                return Response(
                    {
                        "success": False,
                        "message": "Cash amount received is required for Cash payments.",
                        "errors":  {"amount_tendered": ["This field is required."]},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if amount_tendered < cart.total_amount:
                return Response(
                    {
                        "success": False,
                        "message": (
                            f"Amount received (₦{amount_tendered}) is less "
                            f"than the total (₦{cart.total_amount})."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        vendor     = request.user
        paid_at    = timezone.now()
        change_due = None

        if payment_method == Cart.PaymentMethod.CASH and amount_tendered:
            change_due = amount_tendered - cart.total_amount

        low_stock_products = []

        try:
            with transaction.atomic():

                # ── A: Flip cart to paid ──
                cart.status          = Cart.Status.PAID
                cart.payment_method  = payment_method
                cart.paid_at         = paid_at
                cart.amount_tendered = amount_tendered
                cart.change_due      = change_due
                cart.save(update_fields=[
                    "status", "payment_method", "paid_at",
                    "amount_tendered", "change_due",
                ])

                # ── B: Create Sale rows ──
                
                sale_rows = [
                    Sale(
                        vendor         = vendor,
                        cart           = cart,
                        product        = item.product,
                        product_name   = item.product_name,
                        # unit_price     = item.unit_price,
                        unit           = item.unit,        # ← snapshot from CartItem
                        quantity       = item.quantity,
                        tax_rate       = item.tax_rate,
                        tax_amount     = item.tax_amount,
                        line_total     = item.line_total,
                        payment_method = payment_method,
                        currency       = cart.currency,
                        sold_at        = paid_at,
                    )
                    for item in items
                ]
                Sale.objects.bulk_create(sale_rows)

                # ── C: Decrement stock and increment total_sold ──
                for item in items:
                    if item.product:
                        # AFTER
                        product = item.product
                        # quantity_in_stock stays integer on the model — subtract the
                        # decimal quantity and floor to zero if the math goes negative
                        # (rounding dust on weighed items)
                        new_stock = product.quantity_in_stock - item.quantity
                        product.quantity_in_stock = max(new_stock, 0)

                        # total_sold tracks whole units sold for fixed-qty products;
                        # for weighed products it accumulates fractional units (kg sold, etc.)
                        # Both are now DecimalField-safe since Sale.quantity is Decimal
                        product.total_sold += item.quantity
                        product.save(update_fields=["quantity_in_stock", "total_sold"])

                        # ── Collect low stock products ──
                        if item.product.is_low_stock:
                            low_stock_products.append(item.product)

                logger.info(
                    "StorekeeperViewSet.pay — paid | cart=%s | total=₦%s | vendor=%s",
                    cart.id,
                    cart.total_amount,
                    vendor.email,
                )

        except Exception as exc:
            logger.exception(
                "StorekeeperViewSet.pay — transaction failed | cart=%s | error=%s",
                cart.id,
                str(exc),
            )
            return Response(
                {
                    "success": False,
                    "message": "Payment processing failed. Please try again.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # ── D: Notify low stock AFTER commit ──
        for product in low_stock_products:
            _notify_low_stock(vendor, product)

        return Response(
            {
                "success":     True,
                "message":     "Payment complete. Cart cleared.",
                "total_paid":  str(cart.total_amount),
                "change_due":  str(change_due) if change_due else "0.00",
                "cart_id":     str(cart.id),
                "paid_at":     paid_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )

    # ── Cart history ──

    @extend_schema(
        summary="List paid cart history",
        parameters=[
            OpenApiParameter("from_date", description="Filter from date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter("to_date",   description="Filter to date (YYYY-MM-DD)",   required=False, type=str),
            OpenApiParameter("method",    description="Filter by payment method",      required=False, type=str),
        ],
        responses={200: CartListSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="history")
    def history(self, request):
        qs = (
            Cart.objects
            .filter(
                vendor = request.user,
                status = Cart.Status.PAID,
            )
            .annotate(item_count=Count("items"))
            .order_by("-paid_at")
        )

        from_date = request.query_params.get("from_date")
        to_date   = request.query_params.get("to_date")
        method    = request.query_params.get("method")

        if from_date:
            qs = qs.filter(paid_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(paid_at__date__lte=to_date)
        if method:
            qs = qs.filter(payment_method=method)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = CartListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = CartListSerializer(qs, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _get_open_cart(self, pk):
        """
        Fetches an open cart belonging to the authenticated vendor.
        Returns a 404 Response if not found or already closed.
        Used by every action that mutates a cart.
        """
        cart = (
            Cart.objects
            .filter(
                pk     = pk,
                vendor = self.request.user,
                status = Cart.Status.OPEN,
            )
            .first()
        )
        if not cart:
            return Response(
                {
                    "success": False,
                    "message": "Cart not found or already closed.",
                    "code":    "cart_not_found",
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        return cart