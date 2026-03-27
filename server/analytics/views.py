# analytics/views.py

import logging

from django.db.models import Sum, Count, Avg, F, Q
from django.db.models.functions import (
    TruncMonth,
    TruncDay,
    TruncHour,
    TruncYear,
)
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsAdmin, IsApprovedVendor
from sales.models import Sale
from products.models import Product, Category
from subscriptions.models import VendorSubscription, SubscriptionPlan

from .serializers import (
    MonthlyRevenueSerializer,
    DailyRevenueSerializer,
    RushHourSerializer,
    TopProductSerializer,
    PaymentMethodBreakdownSerializer,
    RevenueSummarySerializer,
    CategoryPerformanceSerializer,
    ProfitMarginSerializer,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Guard: check vendor has analytics access
# ─────────────────────────────────────────────────────────────────────────────

def _has_analytics_access(vendor) -> bool:
    """
    Returns True if the vendor's current plan includes analytics.
    Free and Basic plans do not have analytics access.
    Pro and Enterprise plans do.
    """
    subscription = (
        VendorSubscription.objects
        .select_related("plan")
        .filter(
            vendor = vendor,
            status = VendorSubscription.Status.ACTIVE,
        )
        .first()
    )
    if not subscription:
        return False
    return subscription.plan.has_analytics


def _analytics_forbidden():
    return Response(
        {
            "success": False,
            "message": (
                "Analytics is not available on your current plan. "
                "Upgrade to Pro or Enterprise to access full analytics."
            ),
            "code": "analytics_not_available",
        },
        status=status.HTTP_403_FORBIDDEN,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Vendor Analytics ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class AnalyticsViewSet(GenericViewSet):
    """
    Analytics dashboard data for vendors.
    Requires Pro or Enterprise subscription plan.

    All endpoints compute data directly from the Sale table
    using ORM aggregations — no separate analytics tables needed.

    GET  /api/analytics/summary/              — dashboard hero stats
    GET  /api/analytics/revenue/monthly/      — monthly revenue chart
    GET  /api/analytics/revenue/daily/        — daily revenue for a month
    GET  /api/analytics/revenue/yearly/       — yearly revenue trend
    GET  /api/analytics/rush-hours/           — rush hour heatmap
    GET  /api/analytics/top-products/         — top products by units sold
    GET  /api/analytics/top-products/revenue/ — top products by revenue
    GET  /api/analytics/worst-products/       — worst performing products
    GET  /api/analytics/payment-methods/      — payment method breakdown
    GET  /api/analytics/categories/           — category performance
    GET  /api/analytics/profit-margins/       — profit margins per product
    GET  /api/analytics/inventory/            — inventory health overview
    """

    permission_classes = [IsApprovedVendor]

    # ── Summary — dashboard hero stats ──

    @extend_schema(
        summary="Revenue summary — today, this week, this month",
        responses={200: RevenueSummarySerializer},
    )
    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        if not _has_analytics_access(request.user):
            return _analytics_forbidden()

        now   = timezone.now()
        today = timezone.localdate()
        week_start  = today - timezone.timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        base_qs = Sale.objects.filter(vendor=request.user)

        def _agg(qs):
            r = qs.aggregate(
                revenue = Sum("line_total"),
                orders  = Count("cart", distinct=True),
                units   = Sum("quantity"),
            )
            return {
                "revenue": str(r["revenue"] or 0),
                "orders":  r["orders"]  or 0,
                "units":   r["units"]   or 0,
            }

        today_data  = _agg(base_qs.filter(sold_at__date=today))
        week_data   = _agg(base_qs.filter(sold_at__date__gte=week_start))
        month_data  = _agg(base_qs.filter(sold_at__date__gte=month_start))

        # ── Month vs last month percentage change ──
        last_month_start = (month_start - timezone.timedelta(days=1)).replace(day=1)
        this_rev = base_qs.filter(
            sold_at__date__gte=month_start
        ).aggregate(r=Sum("line_total"))["r"] or 0

        last_rev = base_qs.filter(
            sold_at__date__gte = last_month_start,
            sold_at__date__lt  = month_start,
        ).aggregate(r=Sum("line_total"))["r"] or 0

        if last_rev > 0:
            change_pct = round(
                float((this_rev - last_rev) / last_rev * 100), 2
            )
        else:
            change_pct = 100.0 if this_rev > 0 else 0.0

        data = {
            "today":              today_data,
            "this_week":          week_data,
            "this_month":         month_data,
            "month_vs_last_pct":  change_pct,
        }

        serializer = RevenueSummarySerializer(data)
        return Response(
            {"success": True, "data": data},
            status=status.HTTP_200_OK,
        )

    # ── Monthly revenue chart ──

    @extend_schema(
        summary="Monthly revenue for the last N months",
        parameters=[
            OpenApiParameter(
                "months",
                description="Number of months to return (default 12, max 24)",
                required=False,
                type=int,
            ),
        ],
        responses={200: MonthlyRevenueSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="revenue/monthly")
    def revenue_monthly(self, request):
        if not _has_analytics_access(request.user):
            return _analytics_forbidden()

        months = min(int(request.query_params.get("months", 12)), 24)
        since  = timezone.now() - timezone.timedelta(days=months * 30)

        results = (
            Sale.objects
            .filter(
                vendor      = request.user,
                sold_at__gte = since,
            )
            .annotate(month=TruncMonth("sold_at"))
            .values("month")
            .annotate(
                total_revenue = Sum("line_total"),
                total_orders  = Count("cart", distinct=True),
            )
            .order_by("month")
        )

        data = [
            {
                "month":         r["month"].strftime("%Y-%m"),
                "total_revenue": str(r["total_revenue"] or 0),
                "total_orders":  r["total_orders"] or 0,
            }
            for r in results
        ]

        serializer = MonthlyRevenueSerializer(data, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Daily revenue for a specific month ──

    @extend_schema(
        summary="Daily revenue for a given month",
        parameters=[
            OpenApiParameter(
                "month",
                description="Month in YYYY-MM format (default: current month)",
                required=False,
                type=str,
            ),
        ],
        responses={200: DailyRevenueSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="revenue/daily")
    def revenue_daily(self, request):
        if not _has_analytics_access(request.user):
            return _analytics_forbidden()

        month_str = request.query_params.get("month")

        if month_str:
            try:
                from datetime import datetime
                month_dt    = datetime.strptime(month_str, "%Y-%m")
                month_start = timezone.make_aware(month_dt)
                # Last day of the month
                if month_dt.month == 12:
                    month_end = month_dt.replace(year=month_dt.year + 1, month=1, day=1)
                else:
                    month_end = month_dt.replace(month=month_dt.month + 1, day=1)
                month_end = timezone.make_aware(month_end)
            except ValueError:
                return Response(
                    {
                        "success": False,
                        "message": "Invalid month format. Use YYYY-MM.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            today       = timezone.now().date()
            month_start = timezone.make_aware(
                timezone.datetime(today.year, today.month, 1)
            )
            if today.month == 12:
                month_end = timezone.make_aware(
                    timezone.datetime(today.year + 1, 1, 1)
                )
            else:
                month_end = timezone.make_aware(
                    timezone.datetime(today.year, today.month + 1, 1)
                )

        results = (
            Sale.objects
            .filter(
                vendor       = request.user,
                sold_at__gte = month_start,
                sold_at__lt  = month_end,
            )
            .annotate(day=TruncDay("sold_at"))
            .values("day")
            .annotate(
                total_revenue = Sum("line_total"),
                total_orders  = Count("cart", distinct=True),
            )
            .order_by("day")
        )

        data = [
            {
                "date":          r["day"].strftime("%Y-%m-%d"),
                "total_revenue": str(r["total_revenue"] or 0),
                "total_orders":  r["total_orders"] or 0,
            }
            for r in results
        ]

        serializer = DailyRevenueSerializer(data, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Yearly revenue trend ──

    @extend_schema(
        summary="Yearly revenue trend",
        responses={200: {"description": "Revenue grouped by year."}},
    )
    @action(detail=False, methods=["get"], url_path="revenue/yearly")
    def revenue_yearly(self, request):
        if not _has_analytics_access(request.user):
            return _analytics_forbidden()

        results = (
            Sale.objects
            .filter(vendor=request.user)
            .annotate(year=TruncYear("sold_at"))
            .values("year")
            .annotate(
                total_revenue = Sum("line_total"),
                total_orders  = Count("cart", distinct=True),
                total_units   = Sum("quantity"),
            )
            .order_by("year")
        )

        data = [
            {
                "year":          r["year"].strftime("%Y"),
                "total_revenue": str(r["total_revenue"] or 0),
                "total_orders":  r["total_orders"]  or 0,
                "total_units":   r["total_units"]   or 0,
            }
            for r in results
        ]

        return Response(
            {"success": True, "data": data},
            status=status.HTTP_200_OK,
        )

    # ── Rush hours heatmap ──

    @extend_schema(
        summary="Rush hours — sales count grouped by hour of day",
        parameters=[
            OpenApiParameter(
                "days",
                description="Look back N days (default 30, max 90)",
                required=False,
                type=int,
            ),
        ],
        responses={200: RushHourSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="rush-hours")
    def rush_hours(self, request):
        if not _has_analytics_access(request.user):
            return _analytics_forbidden()

        days  = min(int(request.query_params.get("days", 30)), 90)
        since = timezone.now() - timezone.timedelta(days=days)

        results = (
            Sale.objects
            .filter(
                vendor       = request.user,
                sold_at__gte = since,
            )
            .annotate(hour=TruncHour("sold_at"))
            .values("hour")
            .annotate(
                total_sales   = Count("id"),
                total_revenue = Sum("line_total"),
            )
            .order_by("hour")
        )

        # ── Group by hour number (0–23) ──
        hour_map = {}
        for r in results:
            h = r["hour"].hour
            if h not in hour_map:
                hour_map[h] = {"total_sales": 0, "total_revenue": 0}
            hour_map[h]["total_sales"]   += r["total_sales"]
            hour_map[h]["total_revenue"] += float(r["total_revenue"] or 0)

        data = [
            {
                "hour":          h,
                "total_sales":   hour_map.get(h, {}).get("total_sales",   0),
                "total_revenue": str(hour_map.get(h, {}).get("total_revenue", 0)),
            }
            for h in range(24)
        ]

        serializer = RushHourSerializer(data, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Top products by units sold ──

    @extend_schema(
        summary="Top products by units sold",
        parameters=[
            OpenApiParameter("limit",     description="Number of results (default 10)", required=False, type=int),
            OpenApiParameter("from_date", description="From date (YYYY-MM-DD)",         required=False, type=str),
            OpenApiParameter("to_date",   description="To date (YYYY-MM-DD)",           required=False, type=str),
        ],
        responses={200: TopProductSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="top-products")
    def top_products(self, request):
        if not _has_analytics_access(request.user):
            return _analytics_forbidden()

        limit     = min(int(request.query_params.get("limit", 10)), 50)
        from_date = request.query_params.get("from_date")
        to_date   = request.query_params.get("to_date")

        qs = Sale.objects.filter(vendor=request.user)

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
            .order_by("-total_units")[:limit]
        )

        data = [
            {
                "product_id":    str(r["product"]) if r["product"] else None,
                "product_name":  r["product_name"],
                "total_units":   r["total_units"]   or 0,
                "total_revenue": str(r["total_revenue"] or 0),
            }
            for r in results
        ]

        serializer = TopProductSerializer(data, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Top products by revenue ──

    @extend_schema(
        summary="Top products by revenue generated",
        parameters=[
            OpenApiParameter("limit",     description="Number of results (default 10)", required=False, type=int),
            OpenApiParameter("from_date", description="From date (YYYY-MM-DD)",         required=False, type=str),
            OpenApiParameter("to_date",   description="To date (YYYY-MM-DD)",           required=False, type=str),
        ],
        responses={200: TopProductSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="top-products/revenue")
    def top_products_by_revenue(self, request):
        if not _has_analytics_access(request.user):
            return _analytics_forbidden()

        limit     = min(int(request.query_params.get("limit", 10)), 50)
        from_date = request.query_params.get("from_date")
        to_date   = request.query_params.get("to_date")

        qs = Sale.objects.filter(vendor=request.user)

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

        data = [
            {
                "product_id":    str(r["product"]) if r["product"] else None,
                "product_name":  r["product_name"],
                "total_units":   r["total_units"]   or 0,
                "total_revenue": str(r["total_revenue"] or 0),
            }
            for r in results
        ]

        serializer = TopProductSerializer(data, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Worst performing products ──

    @extend_schema(
        summary="Worst performing products — lowest sales",
        parameters=[
            OpenApiParameter("limit",     description="Number of results (default 10)", required=False, type=int),
            OpenApiParameter("from_date", description="From date (YYYY-MM-DD)",         required=False, type=str),
            OpenApiParameter("to_date",   description="To date (YYYY-MM-DD)",           required=False, type=str),
        ],
        responses={200: TopProductSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="worst-products")
    def worst_products(self, request):
        if not _has_analytics_access(request.user):
            return _analytics_forbidden()

        limit     = min(int(request.query_params.get("limit", 10)), 50)
        from_date = request.query_params.get("from_date")
        to_date   = request.query_params.get("to_date")

        qs = Sale.objects.filter(vendor=request.user)

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
            .order_by("total_units")[:limit]
        )

        data = [
            {
                "product_id":    str(r["product"]) if r["product"] else None,
                "product_name":  r["product_name"],
                "total_units":   r["total_units"]   or 0,
                "total_revenue": str(r["total_revenue"] or 0),
            }
            for r in results
        ]

        serializer = TopProductSerializer(data, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Payment method breakdown ──

    @extend_schema(
        summary="Sales breakdown by payment method",
        parameters=[
            OpenApiParameter("from_date", description="From date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter("to_date",   description="To date (YYYY-MM-DD)",   required=False, type=str),
        ],
        responses={200: PaymentMethodBreakdownSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="payment-methods")
    def payment_methods(self, request):
        if not _has_analytics_access(request.user):
            return _analytics_forbidden()

        qs = Sale.objects.filter(vendor=request.user)

        from_date = request.query_params.get("from_date")
        to_date   = request.query_params.get("to_date")

        if from_date:
            qs = qs.filter(sold_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(sold_at__date__lte=to_date)

        total_revenue = float(
            qs.aggregate(t=Sum("line_total"))["t"] or 1
        )

        results = (
            qs
            .values("payment_method")
            .annotate(
                total_sales   = Count("id"),
                total_revenue = Sum("line_total"),
            )
            .order_by("-total_revenue")
        )

        data = [
            {
                "payment_method": r["payment_method"],
                "total_sales":    r["total_sales"],
                "total_revenue":  str(r["total_revenue"] or 0),
                "percentage":     round(
                    float(r["total_revenue"] or 0) / total_revenue * 100,
                    2,
                ),
            }
            for r in results
        ]

        serializer = PaymentMethodBreakdownSerializer(data, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Category performance ──

    @extend_schema(
        summary="Revenue and units by product category",
        parameters=[
            OpenApiParameter("from_date", description="From date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter("to_date",   description="To date (YYYY-MM-DD)",   required=False, type=str),
        ],
        responses={200: CategoryPerformanceSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="categories")
    def categories(self, request):
        if not _has_analytics_access(request.user):
            return _analytics_forbidden()

        qs = Sale.objects.filter(vendor=request.user)

        from_date = request.query_params.get("from_date")
        to_date   = request.query_params.get("to_date")

        if from_date:
            qs = qs.filter(sold_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(sold_at__date__lte=to_date)

        total_revenue = float(
            qs.aggregate(t=Sum("line_total"))["t"] or 1
        )

        results = (
            qs
            .filter(product__isnull=False)
            .values(
                category_id   = F("product__category__id"),
                category_name = F("product__category__name"),
            )
            .annotate(
                total_units   = Sum("quantity"),
                total_revenue = Sum("line_total"),
            )
            .order_by("-total_revenue")
        )

        data = [
            {
                "category_id":   str(r["category_id"]) if r["category_id"] else None,
                "category_name": r["category_name"] or "Uncategorised",
                "total_units":   r["total_units"]   or 0,
                "total_revenue": str(r["total_revenue"] or 0),
                "percentage":    round(
                    float(r["total_revenue"] or 0) / total_revenue * 100,
                    2,
                ),
            }
            for r in results
        ]

        serializer = CategoryPerformanceSerializer(data, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Profit margins ──

    @extend_schema(
        summary="Profit margin per product (requires cost_price to be set)",
        parameters=[
            OpenApiParameter("from_date", description="From date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter("to_date",   description="To date (YYYY-MM-DD)",   required=False, type=str),
            OpenApiParameter("limit",     description="Number of results",      required=False, type=int),
        ],
        responses={200: ProfitMarginSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="profit-margins")
    def profit_margins(self, request):
        if not _has_analytics_access(request.user):
            return _analytics_forbidden()

        limit     = min(int(request.query_params.get("limit", 20)), 100)
        from_date = request.query_params.get("from_date")
        to_date   = request.query_params.get("to_date")

        qs = (
            Sale.objects
            .filter(
                vendor               = request.user,
                product__isnull      = False,
                product__cost_price__isnull = False,
            )
        )

        if from_date:
            qs = qs.filter(sold_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(sold_at__date__lte=to_date)

        results = (
            qs
            .values("product", "product_name")
            .annotate(
                total_revenue = Sum("line_total"),
                total_units   = Sum("quantity"),
                avg_cost      = Avg("product__cost_price"),
            )
            .order_by("-total_revenue")[:limit]
        )

        data = []
        for r in results:
            revenue      = float(r["total_revenue"] or 0)
            units        = r["total_units"] or 0
            avg_cost     = float(r["avg_cost"] or 0)
            total_cost   = avg_cost * units
            gross_profit = revenue - total_cost
            margin_pct   = round(
                (gross_profit / revenue * 100) if revenue > 0 else 0,
                2,
            )
            data.append({
                "product_id":    str(r["product"]),
                "product_name":  r["product_name"],
                "total_revenue": str(revenue),
                "total_cost":    str(round(total_cost, 2)),
                "gross_profit":  str(round(gross_profit, 2)),
                "margin_percent": margin_pct,
            })

        data.sort(key=lambda x: x["margin_percent"], reverse=True)
        serializer = ProfitMarginSerializer(data, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Inventory health ──

    @extend_schema(
        summary="Inventory health overview",
        responses={200: {"description": "Inventory health statistics."}},
    )
    @action(detail=False, methods=["get"], url_path="inventory")
    def inventory(self, request):
        if not _has_analytics_access(request.user):
            return _analytics_forbidden()

        vendor = request.user

        total_products = Product.objects.filter(
            vendor    = vendor,
            is_active = True,
        ).count()

        low_stock = Product.objects.filter(
            vendor    = vendor,
            is_active = True,
            quantity_in_stock__lte = F("low_stock_threshold"),
            quantity_in_stock__gt  = 0,
        ).count()

        out_of_stock = Product.objects.filter(
            vendor              = vendor,
            is_active           = True,
            quantity_in_stock   = 0,
        ).count()

        healthy = total_products - low_stock - out_of_stock

        # ── Total inventory value ──
        from django.db.models import ExpressionWrapper, DecimalField
        inv_value = Product.objects.filter(
            vendor    = vendor,
            is_active = True,
        ).aggregate(
            total_value = Sum(
                ExpressionWrapper(
                    F("quantity_in_stock") * F("selling_price"),
                    output_field=DecimalField(),
                )
            )
        )["total_value"] or 0

        # ── Top 5 products by current stock value ──
        top_by_value = (
            Product.objects
            .filter(vendor=vendor, is_active=True)
            .annotate(
                stock_value = ExpressionWrapper(
                    F("quantity_in_stock") * F("selling_price"),
                    output_field=DecimalField(),
                )
            )
            .order_by("-stock_value")[:5]
            .values("id", "name", "quantity_in_stock", "stock_value")
        )

        return Response(
            {
                "success": True,
                "data": {
                    "total_products":      total_products,
                    "healthy":             healthy,
                    "low_stock":           low_stock,
                    "out_of_stock":        out_of_stock,
                    "total_inventory_value": str(round(inv_value, 2)),
                    "top_by_stock_value": [
                        {
                            "product_id":   str(p["id"]),
                            "name":         p["name"],
                            "qty":          p["quantity_in_stock"],
                            "stock_value":  str(round(p["stock_value"] or 0, 2)),
                        }
                        for p in top_by_value
                    ],
                },
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Admin Analytics ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class AdminAnalyticsViewSet(GenericViewSet):
    """
    Platform-wide analytics for admins.

    GET  /api/analytics/admin/summary/         — platform revenue summary
    GET  /api/analytics/admin/revenue/monthly/ — monthly revenue across all vendors
    GET  /api/analytics/admin/top-vendors/     — top vendors by revenue
    GET  /api/analytics/admin/subscriptions/   — subscription plan distribution
    GET  /api/analytics/admin/registrations/   — vendor registration trend
    """

    permission_classes = [IsAdmin]

    # ── Platform summary ──

    @extend_schema(
        summary="Platform-wide revenue summary (admin only)",
        responses={200: {"description": "Platform summary."}},
    )
    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        now         = timezone.now()
        today       = now.date()
        month_start = today.replace(day=1)

        base_qs = Sale.objects.all()

        def _agg(qs):
            r = qs.aggregate(
                revenue = Sum("line_total"),
                orders  = Count("cart", distinct=True),
                vendors = Count("vendor", distinct=True),
            )
            return {
                "revenue": str(r["revenue"] or 0),
                "orders":  r["orders"]  or 0,
                "vendors": r["vendors"] or 0,
            }

        total_vendors   = User.objects.filter(role="vendor", status="approved").count()
        pending_vendors = User.objects.filter(role="vendor", status="pending_approval").count()

        return Response(
            {
                "success": True,
                "data": {
                    "today":           _agg(base_qs.filter(sold_at__date=today)),
                    "this_month":      _agg(base_qs.filter(sold_at__date__gte=month_start)),
                    "all_time":        _agg(base_qs),
                    "total_vendors":   total_vendors,
                    "pending_vendors": pending_vendors,
                },
            },
            status=status.HTTP_200_OK,
        )

    # ── Platform monthly revenue ──

    @extend_schema(
        summary="Platform monthly revenue trend (admin only)",
        parameters=[
            OpenApiParameter("months", description="Months to look back (default 12)", required=False, type=int),
        ],
        responses={200: MonthlyRevenueSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="revenue/monthly")
    def revenue_monthly(self, request):
        months = min(int(request.query_params.get("months", 12)), 24)
        since  = timezone.now() - timezone.timedelta(days=months * 30)

        results = (
            Sale.objects
            .filter(sold_at__gte=since)
            .annotate(month=TruncMonth("sold_at"))
            .values("month")
            .annotate(
                total_revenue = Sum("line_total"),
                total_orders  = Count("cart", distinct=True),
            )
            .order_by("month")
        )

        data = [
            {
                "month":         r["month"].strftime("%Y-%m"),
                "total_revenue": str(r["total_revenue"] or 0),
                "total_orders":  r["total_orders"] or 0,
            }
            for r in results
        ]

        serializer = MonthlyRevenueSerializer(data, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Top vendors by revenue ──

    @extend_schema(
        summary="Top vendors by revenue (admin only)",
        parameters=[
            OpenApiParameter("limit",     description="Number of vendors (default 10)", required=False, type=int),
            OpenApiParameter("from_date", description="From date (YYYY-MM-DD)",         required=False, type=str),
            OpenApiParameter("to_date",   description="To date (YYYY-MM-DD)",           required=False, type=str),
        ],
        responses={200: {"description": "Top vendors."}},
    )
    @action(detail=False, methods=["get"], url_path="top-vendors")
    def top_vendors(self, request):
        limit     = min(int(request.query_params.get("limit", 10)), 50)
        from_date = request.query_params.get("from_date")
        to_date   = request.query_params.get("to_date")

        qs = Sale.objects.all()

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
                        "total_revenue": str(r["total_revenue"] or 0),
                        "total_orders":  r["total_orders"]  or 0,
                        "total_units":   r["total_units"]   or 0,
                    }
                    for r in results
                ],
            },
            status=status.HTTP_200_OK,
        )

    # ── Subscription plan distribution ──

    @extend_schema(
        summary="Active subscription distribution by plan (admin only)",
        responses={200: {"description": "Plan distribution."}},
    )
    @action(detail=False, methods=["get"], url_path="subscriptions")
    def subscription_distribution(self, request):
        results = (
            VendorSubscription.objects
            .filter(status=VendorSubscription.Status.ACTIVE)
            .values("plan__name")
            .annotate(count=Count("id"))
            .order_by("plan__name")
        )

        total = sum(r["count"] for r in results)

        return Response(
            {
                "success": True,
                "data": [
                    {
                        "plan":       r["plan__name"],
                        "count":      r["count"],
                        "percentage": round(
                            r["count"] / total * 100 if total > 0 else 0,
                            2,
                        ),
                    }
                    for r in results
                ],
            },
            status=status.HTTP_200_OK,
        )

    # ── Vendor registration trend ──

    @extend_schema(
        summary="Vendor registration trend by month (admin only)",
        parameters=[
            OpenApiParameter("months", description="Months to look back (default 12)", required=False, type=int),
        ],
        responses={200: {"description": "Registration trend."}},
    )
    @action(detail=False, methods=["get"], url_path="registrations")
    def registrations(self, request):
        from django.contrib.auth import get_user_model
        User   = get_user_model()
        months = min(int(request.query_params.get("months", 12)), 24)
        since  = timezone.now() - timezone.timedelta(days=months * 30)

        results = (
            User.objects
            .filter(
                role       = "vendor",
                created_at__gte = since,
            )
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        return Response(
            {
                "success": True,
                "data": [
                    {
                        "month": r["month"].strftime("%Y-%m"),
                        "count": r["count"],
                    }
                    for r in results
                ],
            },
            status=status.HTTP_200_OK,
        )