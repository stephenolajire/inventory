"""
apps/analytics/serializers.py
==============================
All analytics serializers are read-only response shapes.
Plain Serializer subclasses — not ModelSerializers —
because data is aggregated, not a direct model instance.
"""

from rest_framework import serializers


class MonthlyRevenueSerializer(serializers.Serializer):
    """
    Used in: GET /api/analytics/revenue/monthly/
    One entry per month for the monthly bar chart.
    """

    month         = serializers.CharField()
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_orders  = serializers.IntegerField()


class DailyRevenueSerializer(serializers.Serializer):
    """
    Used in: GET /api/analytics/revenue/daily/?month=2025-01
    One entry per day for the daily line chart.
    """

    date          = serializers.DateField()
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_orders  = serializers.IntegerField()


class RushHourSerializer(serializers.Serializer):
    """
    Used in: GET /api/analytics/rush-hours/
    One entry per hour (0–23) for the heatmap bar chart.
    """

    hour          = serializers.IntegerField()
    total_sales   = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)


class TopProductSerializer(serializers.Serializer):
    """
    Used in: GET /api/analytics/top-products/
    Sorted by units sold descending.
    """

    product_id    = serializers.UUIDField()
    product_name  = serializers.CharField()
    total_units   = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)


class PaymentMethodBreakdownSerializer(serializers.Serializer):
    """
    Used in: GET /api/analytics/payment-methods/
    Payment method donut chart data.
    """

    payment_method = serializers.CharField()
    total_sales    = serializers.IntegerField()
    total_revenue  = serializers.DecimalField(max_digits=14, decimal_places=2)
    percentage     = serializers.DecimalField(max_digits=5, decimal_places=2)


class RevenueSummarySerializer(serializers.Serializer):
    """
    Used in: GET /api/analytics/summary/
    Dashboard hero stats.
    """

    today_revenue         = serializers.DecimalField(max_digits=14, decimal_places=2)
    today_orders          = serializers.IntegerField()
    week_revenue          = serializers.DecimalField(max_digits=14, decimal_places=2)
    week_orders           = serializers.IntegerField()
    month_revenue         = serializers.DecimalField(max_digits=14, decimal_places=2)
    month_orders          = serializers.IntegerField()
    month_vs_last_percent = serializers.DecimalField(max_digits=6, decimal_places=2)


class CategoryPerformanceSerializer(serializers.Serializer):
    """
    Used in: GET /api/analytics/categories/
    """

    category_id   = serializers.UUIDField()
    category_name = serializers.CharField()
    total_units   = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    percentage    = serializers.DecimalField(max_digits=5, decimal_places=2)


class ProfitMarginSerializer(serializers.Serializer):
    """
    Used in: GET /api/analytics/profit-margins/
    Only for products with cost_price set.
    """

    product_id     = serializers.UUIDField()
    product_name   = serializers.CharField()
    total_revenue  = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_cost     = serializers.DecimalField(max_digits=14, decimal_places=2)
    gross_profit   = serializers.DecimalField(max_digits=14, decimal_places=2)
    margin_percent = serializers.DecimalField(max_digits=6, decimal_places=2)