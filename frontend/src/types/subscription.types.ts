// src/types/subscription.types.ts

import type { Currency } from "./vendor.types";

export type PlanName = "free" | "basic" | "pro" | "enterprise";

export type SubscriptionStatus =
  | "pending_approval"
  | "pending_payment"
  | "active"
  | "past_due"
  | "expired"
  | "cancelled";

export type BillingCycle = "monthly" | "yearly";

export type PaymentType = "initial" | "upgrade" | "renewal";

// Currency is re-exported from vendor.types — do not redefine here
export type { Currency } from "./vendor.types";

export type PendingChangeType = "downgrade" | "cycle_change" | "cancellation";
export type PendingChangeStatus = "scheduled" | "applied" | "cancelled";

export interface SubscriptionPlan {
  id: number;
  name: PlanName;
  product_limit: number;
  monthly_price_ngn: string;
  yearly_price_ngn: string;
  has_analytics: boolean;
  has_reports: boolean;
  has_multi_branch: boolean;
}

export interface ActiveSubscription {
  id: string;
  plan_name: PlanName;
  plan_display_name: string;
  has_analytics: boolean;
  has_reports: boolean;
  product_limit: number;
  billing_cycle: BillingCycle;
  currency: Currency;
  status: SubscriptionStatus;
  amount_paid: string;
  current_period_start: string | null;
  current_period_end: string | null;
  pending_change?: PendingPlanChange;
}

export interface PendingPlanChange {
  id: string;
  new_plan_name: PlanName | null;
  new_billing_cycle: BillingCycle;
  change_type: PendingChangeType;
  effective_at: string;
}

export interface SelectPlanRequest {
  plan: string;
  billing_cycle: BillingCycle;
  currency?: Currency;
}

export interface ProcessPaymentRequest {
  stripe_payment_method_id: string;
}

export interface UpgradePlanRequest {
  new_plan: string;
  billing_cycle?: BillingCycle;
  stripe_payment_method_id: string;
}

export interface DowngradePlanRequest {
  new_plan: string;
  billing_cycle?: BillingCycle;
}

export interface CancelSubscriptionRequest {
  otp_code: string;
}

export interface AdminSubscriptionListItem {
  id: string;
  vendor_email: string;
  plan_name: PlanName;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  amount_paid: string;
  currency: Currency;
  current_period_end: string | null;
  created_at: string;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  pending: number;
  expired: number;
  cancelled: number;
  past_due: number;
  by_plan: {
    plan: PlanName;
    count: number;
  }[];
}

// ─────────────────────────────────────────────────────────────
// Revenue
// ─────────────────────────────────────────────────────────────

export interface PlanRevenue {
  plan_name: PlanName;
  plan_display: string;
  total_revenue: string;
  active_vendors: number;
  payment_count: number;
  initial_revenue: string;
  upgrade_revenue: string;
  renewal_revenue: string;
  monthly_revenue: string;
  yearly_revenue: string;
}

export interface RevenueStats {
  total_revenue: string;
  total_payments: number;
  total_active_vendors: number;
  currency: string;
  by_plan: PlanRevenue[];
}

export interface RevenueFilters {
  from_date?: string;
  to_date?: string;
  currency?: string;
}

// ─────────────────────────────────────────────────────────────
// Payment records
// ─────────────────────────────────────────────────────────────

export interface PaymentRecord {
  id: string;
  vendor_email: string;
  plan_name: PlanName;
  payment_type: PaymentType;
  amount: string;
  currency: Currency;
  billing_cycle: BillingCycle;
  stripe_intent_id: string;
  created_at: string;
}

export interface PaymentFilters {
  plan?: PlanName;
  payment_type?: PaymentType;
  from_date?: string;
  to_date?: string;
  search?: string;
  page?: number;
}
