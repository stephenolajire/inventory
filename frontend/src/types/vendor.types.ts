// src/types/vendor.types.ts

export type BusinessType =
  | "retail"
  | "wholesale"
  | "supermarket"
  | "pharmacy"
  | "food_and_beverage"
  | "fashion"
  | "electronics"
  | "other";

export type Currency = "NGN" | "USD" | "GBP";

export interface VendorProfile {
  id: string;
  user: string;
  first_name: string;
  last_name: string;
  business_name: string | null;
  business_type: BusinessType;
  business_description: string;
  business_logo: string;
  business_email: string;
  country: string | null;
  state: string | null;
  lga: string | null;
  city_town: string;
  street_address: string;
  nearest_landmark: string;
  postal_code: string;
  currency: Currency;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorListItem {
  id: string;
  email: string;
  business_name: string | null;
  business_type: BusinessType | "";
  state_name: string;
  lga_name: string;
  account_status: string;
  created_at: string;
}

export interface VendorDetail extends VendorProfile {
  user_status: string;
  user_email: string;
}

export interface VendorProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  business_name?: string;
  business_type?: BusinessType;
  business_description?: string;
  business_email?: string;
  country?: string;
  state?: string;
  lga?: string;
  city_town?: string;
  street_address?: string;
  nearest_landmark?: string;
  postal_code?: string;
  currency?: Currency;
}

export interface VendorApproveRequest {
  vendor_id: string;
}

export interface VendorRejectRequest {
  vendor_id: string;
  reason: string;
}


// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface MonthlyBreakdown {
  month:        string;
  revenue:      number;
  transactions: number;
  items_sold:   number;
}

interface TopProduct {
  name:              string;
  total_sold:        number;
  selling_price:     number;
  quantity_in_stock: number;
}

interface TopProductByRevenue {
  product_name: string;
  revenue:      number;
  units_sold:   number;
  transactions: number;
}

interface PaymentMethodBreakdown {
  payment_method: "cash" | "card" | "transfer";
  count:          number;
  revenue:        number;
}

interface CategoryBreakdown {
  category_name: string;
  count:         number;
}

interface VendorAnalyticsAccount {
  email:             string;
  status:            string;
  role:              string;
  joined_at:         string;
  approved_at:       string | null;
  approved_by:       string | null;
  email_verified:    boolean;
  email_verified_at: string | null;
  business_name:     string;
  business_type:     string | null;
  phone:             string | null;
  address:           string | null;
  state:             string | null;
  lga:               string | null;
  country:           string | null;
}

interface VendorAnalyticsProducts {
  total_products:       number;
  active_products:      number;
  inactive_products:    number;
  low_stock_count:      number;
  out_of_stock_count:   number;
  total_stock_value:    number | null;
  avg_selling_price:    number | null;
  most_expensive_price: number | null;
  cheapest_price:       number | null;
  total_units_sold:     number | null;
  discounted_products:  number;
  top_by_units:         TopProduct[];
  by_category:          CategoryBreakdown[];
}

interface VendorAnalyticsRevenue {
  total_revenue:       number | null;
  total_transactions:  number;
  total_items_sold:    number;
  avg_order_value:     number | null;
  total_tax_collected: number | null;
  first_sale_at:       string | null;
  last_sale_at:        string | null;
  by_payment_method:   PaymentMethodBreakdown[];
  top_by_revenue:      TopProductByRevenue[];
}

interface VendorAnalyticsSubscription {
  plan:                 string;
  billing_cycle:        string;
  status:               string;
  amount_paid:          number;
  currency:             string;
  current_period_start: string | null;
  current_period_end:   string | null;
}

interface VendorAnalyticsScanner {
  serial_number: string;
  status:        string;
  assigned_at:   string | null;
}

export interface VendorAnalytics {
  account:           VendorAnalyticsAccount;
  subscription:      VendorAnalyticsSubscription | null;
  scanner:           VendorAnalyticsScanner | null;
  products:          VendorAnalyticsProducts;
  revenue:           VendorAnalyticsRevenue;
  monthly_breakdown: MonthlyBreakdown[];
}

//
//   analytics: (id: string): Promise<ApiResponse<VendorAnalytics>> =>
//     apiGet<ApiResponse<VendorAnalytics>>(`${BASE}/${id}/analytics/`),
