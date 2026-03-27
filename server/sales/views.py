# sales/views.py

import logging

from django.db.models import Sum, Count, F
from django.utils import timezone

from rest_framework import status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsAdmin, IsApprovedVendor

from .models import Sale
from .serializers import (
    SaleListSerializer,
    SaleDetailSerializer,
    ReceiptSerializer,
    AdminSaleListSerializer,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Vendor Sales ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class SaleViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    Read-only viewset for vendor sales history.
    Sales are never created or edited via the API directly —
    they are created exclusively by the storekeeper pay endpoint.

    GET  /api/sales/                          — paginated sales list
    GET  /api/sales/{id}/                     — single sale detail
    GET  /api/sales/receipt/{cart_id}/        — all sale rows for one cart
    GET  /api/sales/summary/                  — totals for today/week/month
    GET  /api/sales/by-product/              — sales grouped by product
    GET  /api/sales/by-payment-method/       — sales grouped by payment method
    """

    permission_classes = [IsApprovedVendor]
    serializer_class   = SaleListSerializer

    def get_queryset(self):
        qs = (
            Sale.objects
            .filter(vendor=self.request.user)
            .select_related("product", "cart")
            .order_by("-sold_at")
        )

        # ── Filters ──
        product        = self.request.query_params.get("product")
        payment_method = self.request.query_params.get("payment_method")
        from_date      = self.request.query_params.get("from_date")
        to_date        = self.request.query_params.get("to_date")
        search         = self.request.query_params.get("search")

        if product:
            qs = qs.filter(product__id=product)
        if payment_method:
            qs = qs.filter(payment_method=payment_method)
        if from_date:
            qs = qs.filter(sold_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(sold_at__date__lte=to_date)
        if search:
            qs = qs.filter(product_name__icontains=search)

        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return SaleDetailSerializer
        return SaleListSerializer

    # ── List ──

    @extend_schema(
        summary="List vendor sales history",
        parameters=[
            OpenApiParameter("product",        description="Filter by product ID",      required=False, type=str),
            OpenApiParameter("payment_method", description="Filter by payment method",  required=False, type=str),
            OpenApiParameter("from_date",      description="From date (YYYY-MM-DD)",    required=False, type=str),
            OpenApiParameter("to_date",        description="To date (YYYY-MM-DD)",      required=False, type=str),
            OpenApiParameter("search",         description="Search by product name",    required=False, type=str),
        ],
        responses={200: SaleListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = SaleListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = SaleListSerializer(qs, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Retrieve ──

    @extend_schema(
        summary="Get single sale detail",
        responses={200: SaleDetailSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        sale       = self.get_object()
        serializer = SaleDetailSerializer(sale)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Receipt — all sale rows for one cart ──

    @extend_schema(
        summary="Get receipt — all sale lines for one cart",
        responses={200: ReceiptSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="receipt/(?P<cart_id>[^/.]+)")
    def receipt(self, request, cart_id=None):
        sales = (
            Sale.objects
            .filter(
                vendor  = request.user,
                cart__id = cart_id,
            )
            .select_related("cart")
            .order_by("id")
        )

        if not sales.exists():
            return Response(
                {
                    "success": False,
                    "message": "No sales found for this cart.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ── Annotate cart-level totals ──
        cart = sales.first().cart

        # ── Build receipt response ──
        sale_data  = ReceiptSerializer(sales, many=True).data
        cart_total = sales.aggregate(total=Sum("line_total"))["total"] or 0

        return Response(
            {
                "success":        True,
                "cart_id":        str(cart_id),
                "cart_label":     cart.label,
                "payment_method": cart.payment_method,
                "amount_tendered": str(cart.amount_tendered or 0),
                "change_due":     str(cart.change_due or 0),
                "cart_total":     str(cart_total),
                "currency":       cart.currency,
                "paid_at":        cart.paid_at.isoformat() if cart.paid_at else None,
                "items":          sale_data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Summary — today / week / month ──

    @extend_schema(
        summary="Get revenue summary for today, this week and this month",
        responses={200: {"description": "Revenue summary."}},
    )
    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        now        = timezone.now()
        today      = now.date()
        week_start = today - timezone.timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        def _totals(qs):
            result = qs.aggregate(
                revenue = Sum("line_total"),
                orders  = Count("cart", distinct=True),
                units   = Sum("quantity"),
            )
            return {
                "revenue": str(result["revenue"] or 0),
                "orders":  result["orders"]  or 0,
                "units":   result["units"]   or 0,
            }

        base_qs = Sale.objects.filter(vendor=request.user)

        today_qs  = base_qs.filter(sold_at__date=today)
        week_qs   = base_qs.filter(sold_at__date__gte=week_start)
        month_qs  = base_qs.filter(sold_at__date__gte=month_start)

        # ── Month vs last month ──
        last_month_start = (month_start - timezone.timedelta(days=1)).replace(day=1)
        last_month_qs    = base_qs.filter(
            sold_at__date__gte = last_month_start,
            sold_at__date__lt  = month_start,
        )
        this_month_rev = month_qs.aggregate(r=Sum("line_total"))["r"] or 0
        last_month_rev = last_month_qs.aggregate(r=Sum("line_total"))["r"] or 0

        if last_month_rev > 0:
            change_pct = round(
                ((this_month_rev - last_month_rev) / last_month_rev) * 100,
                2,
            )
        else:
            change_pct = 100.0 if this_month_rev > 0 else 0.0

        return Response(
            {
                "success": True,
                "data": {
                    "today":               _totals(today_qs),
                    "this_week":           _totals(week_qs),
                    "this_month":          _totals(month_qs),
                    "month_vs_last_pct":   change_pct,
                },
            },
            status=status.HTTP_200_OK,
        )

    # ── Sales grouped by product ──

    @extend_schema(
        summary="Sales totals grouped by product",
        parameters=[
            OpenApiParameter("from_date", description="From date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter("to_date",   description="To date (YYYY-MM-DD)",   required=False, type=str),
            OpenApiParameter("limit",     description="Number of results",      required=False, type=int),
        ],
        responses={200: {"description": "Sales by product."}},
    )
    @action(detail=False, methods=["get"], url_path="by-product")
    def by_product(self, request):
        qs = Sale.objects.filter(vendor=request.user)

        from_date = request.query_params.get("from_date")
        to_date   = request.query_params.get("to_date")
        limit     = int(request.query_params.get("limit", 10))

        if from_date:
            qs = qs.filter(sold_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(sold_at__date__lte=to_date)

        results = (
            qs
            .values("product", "product_name")
            .annotate(
                total_units   = Sum("quantity"),
                total_revenue = Sum("line_total"),
            )
            .order_by("-total_revenue")[:limit]
        )

        return Response(
            {
                "success": True,
                "data": [
                    {
                        "product_id":    str(r["product"]) if r["product"] else None,
                        "product_name":  r["product_name"],
                        "total_units":   r["total_units"],
                        "total_revenue": str(r["total_revenue"]),
                    }
                    for r in results
                ],
            },
            status=status.HTTP_200_OK,
        )

    # ── Sales grouped by payment method ──

    @extend_schema(
        summary="Sales totals grouped by payment method",
        parameters=[
            OpenApiParameter("from_date", description="From date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter("to_date",   description="To date (YYYY-MM-DD)",   required=False, type=str),
        ],
        responses={200: {"description": "Sales by payment method."}},
    )
    @action(detail=False, methods=["get"], url_path="by-payment-method")
    def by_payment_method(self, request):
        qs = Sale.objects.filter(vendor=request.user)

        from_date = request.query_params.get("from_date")
        to_date   = request.query_params.get("to_date")

        if from_date:
            qs = qs.filter(sold_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(sold_at__date__lte=to_date)

        total_revenue = qs.aggregate(
            total=Sum("line_total")
        )["total"] or 1   # avoid division by zero

        results = (
            qs
            .values("payment_method")
            .annotate(
                total_sales   = Count("id"),
                total_revenue = Sum("line_total"),
            )
            .order_by("-total_revenue")
        )

        return Response(
            {
                "success": True,
                "data": [
                    {
                        "payment_method": r["payment_method"],
                        "total_sales":    r["total_sales"],
                        "total_revenue":  str(r["total_revenue"]),
                        "percentage":     round(
                            float(r["total_revenue"] or 0) / float(total_revenue) * 100,
                            2,
                        ),
                    }
                    for r in results
                ],
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Admin Sales ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class AdminSaleViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    Admin-only read-only viewset for platform-wide sales data.

    GET  /api/sales/admin/                — all sales across platform
    GET  /api/sales/admin/{id}/           — single sale detail
    GET  /api/sales/admin/summary/        — platform-wide revenue totals
    GET  /api/sales/admin/by-vendor/      — revenue grouped by vendor
    """

    permission_classes = [IsAdmin]
    serializer_class   = AdminSaleListSerializer

    def get_queryset(self):
        qs = (
            Sale.objects
            .select_related("vendor", "product", "cart")
            .order_by("-sold_at")
        )

        vendor         = self.request.query_params.get("vendor")
        payment_method = self.request.query_params.get("payment_method")
        from_date      = self.request.query_params.get("from_date")
        to_date        = self.request.query_params.get("to_date")
        search         = self.request.query_params.get("search")

        if vendor:
            qs = qs.filter(vendor__id=vendor)
        if payment_method:
            qs = qs.filter(payment_method=payment_method)
        if from_date:
            qs = qs.filter(sold_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(sold_at__date__lte=to_date)
        if search:
            qs = qs.filter(product_name__icontains=search)

        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return SaleDetailSerializer
        return AdminSaleListSerializer

    # ── List ──

    @extend_schema(
        summary="List all sales across platform (admin only)",
        parameters=[
            OpenApiParameter("vendor",         description="Filter by vendor ID",      required=False, type=str),
            OpenApiParameter("payment_method", description="Filter by payment method", required=False, type=str),
            OpenApiParameter("from_date",      description="From date (YYYY-MM-DD)",   required=False, type=str),
            OpenApiParameter("to_date",        description="To date (YYYY-MM-DD)",     required=False, type=str),
            OpenApiParameter("search",         description="Search by product name",   required=False, type=str),
        ],
        responses={200: AdminSaleListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = AdminSaleListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = AdminSaleListSerializer(qs, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Retrieve ──

    @extend_schema(
        summary="Get single sale detail (admin only)",
        responses={200: SaleDetailSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        sale       = self.get_object()
        serializer = SaleDetailSerializer(sale)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Platform-wide summary ──

    @extend_schema(
        summary="Platform-wide revenue summary (admin only)",
        responses={200: {"description": "Platform revenue totals."}},
    )
    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        now         = timezone.now()
        today       = now.date()
        month_start = today.replace(day=1)

        base_qs = Sale.objects.all()

        def _totals(qs):
            result = qs.aggregate(
                revenue  = Sum("line_total"),
                orders   = Count("cart", distinct=True),
                units    = Sum("quantity"),
                vendors  = Count("vendor", distinct=True),
            )
            return {
                "revenue": str(result["revenue"] or 0),
                "orders":  result["orders"]  or 0,
                "units":   result["units"]   or 0,
                "vendors": result["vendors"] or 0,
            }

        return Response(
            {
                "success": True,
                "data": {
                    "today":      _totals(base_qs.filter(sold_at__date=today)),
                    "this_month": _totals(base_qs.filter(sold_at__date__gte=month_start)),
                    "all_time":   _totals(base_qs),
                },
            },
            status=status.HTTP_200_OK,
        )

    # ── Revenue grouped by vendor ──

    @extend_schema(
        summary="Revenue grouped by vendor (admin only)",
        parameters=[
            OpenApiParameter("from_date", description="From date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter("to_date",   description="To date (YYYY-MM-DD)",   required=False, type=str),
            OpenApiParameter("limit",     description="Number of results",      required=False, type=int),
        ],
        responses={200: {"description": "Revenue by vendor."}},
    )
    @action(detail=False, methods=["get"], url_path="by-vendor")
    def by_vendor(self, request):
        qs = Sale.objects.all()

        from_date = request.query_params.get("from_date")
        to_date   = request.query_params.get("to_date")
        limit     = int(request.query_params.get("limit", 20))

        if from_date:
            qs = qs.filter(sold_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(sold_at__date__lte=to_date)

        results = (
            qs
            .values("vendor__id", "vendor__email")
            .annotate(
                total_revenue = Sum("line_total"),
                total_orders  = Count("cart", distinct=True),
                total_units   = Sum("quantity"),
            )
            .order_by("-total_revenue")[:limit]
        )

        return Response(
            {
                "success": True,
                "data": [
                    {
                        "vendor_id":     str(r["vendor__id"]),
                        "vendor_email":  r["vendor__email"],
                        "total_revenue": str(r["total_revenue"]),
                        "total_orders":  r["total_orders"],
                        "total_units":   r["total_units"],
                    }
                    for r in results
                ],
            },
            status=status.HTTP_200_OK,
        )