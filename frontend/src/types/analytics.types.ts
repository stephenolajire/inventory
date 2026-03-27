// src/types/analytics.types.ts

export interface MonthlyRevenue {
  month: string;
  total_revenue: string;
  total_orders: number;
}

export interface DailyRevenue {
  date: string;
  total_revenue: string;
  total_orders: number;
}

export interface YearlyRevenue {
  year: string;
  total_revenue: string;
  total_orders: number;
  total_units: number;
}

export interface RushHour {
  hour: number;
  total_sales: number;
  total_revenue: string;
}

export interface TopProduct {
  product_id: string | null;
  product_name: string;
  total_units: number;
  total_revenue: string;
}

export interface PaymentMethodBreakdown {
  payment_method: string;
  total_sales: number;
  total_revenue: string;
  percentage: number;
}

export interface RevenueSummary {
  today: {
    revenue: string;
    orders: number;
    units: number;
  };
  this_week: {
    revenue: string;
    orders: number;
    units: number;
  };
  this_month: {
    revenue: string;
    orders: number;
    units: number;
  };
  month_vs_last_pct: number;
}

export interface CategoryPerformance {
  category_id: string | null;
  category_name: string;
  total_units: number;
  total_revenue: string;
  percentage: number;
}

export interface ProfitMargin {
  product_id: string;
  product_name: string;
  total_revenue: string;
  total_cost: string;
  gross_profit: string;
  margin_percent: number;
}

export interface InventoryHealth {
  total_products: number;
  healthy: number;
  low_stock: number;
  out_of_stock: number;
  total_inventory_value: string;
  top_by_stock_value: {
    product_id: string;
    name: string;
    qty: number;
    stock_value: string;
  }[];
}

export interface AnalyticsFilters {
  from_date?: string;
  to_date?: string;
  limit?: number;
}

export interface MonthlyRevenueFilters {
  months?: number;
}

export interface DailyRevenueFilters {
  month?: string;
}

export interface RushHourFilters {
  days?: number;
}

// Admin analytics

export interface AdminPlatformSummary {
  today: {
    revenue: string;
    orders: number;
    vendors: number;
  };
  this_month: {
    revenue: string;
    orders: number;
    vendors: number;
  };
  all_time: {
    revenue: string;
    orders: number;
    vendors: number;
  };
  total_vendors: number;
  pending_vendors: number;
}

export interface TopVendor {
  vendor_id: string;
  vendor_email: string;
  total_revenue: string;
  total_orders: number;
  total_units: number;
}

export interface SubscriptionDistribution {
  plan: string;
  count: number;
  percentage: number;
}

export interface VendorRegistrationTrend {
  month: string;
  count: number;
}
