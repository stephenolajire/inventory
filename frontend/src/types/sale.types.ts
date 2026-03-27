// src/types/sale.types.ts

import type { PaymentMethod } from "./cart.types";

export interface SaleListItem {
  id: string;
  cart: string;
  product: string | null;
  product_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
  payment_method: PaymentMethod;
  currency: string;
  sold_at: string;
}

export interface SaleDetail extends SaleListItem {
  tax_rate: string;
  tax_amount: string;
  created_at: string;
}

export interface Receipt {
  cart_id: string;
  cart_label: string;
  payment_method: PaymentMethod;
  amount_tendered: string;
  change_due: string;
  cart_total: string;
  currency: string;
  paid_at: string | null;
  items: SaleListItem[];
}

export interface SalesSummary {
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

export interface SaleByProduct {
  product_id: string | null;
  product_name: string;
  total_units: number;
  total_revenue: string;
}

export interface SaleByPaymentMethod {
  payment_method: PaymentMethod;
  total_sales: number;
  total_revenue: string;
  percentage: number;
}

export interface SaleFilters {
  product?: string;
  payment_method?: PaymentMethod;
  from_date?: string;
  to_date?: string;
  search?: string;
  page?: number;
}

export interface AdminSaleListItem extends SaleListItem {
  vendor_email: string;
}
