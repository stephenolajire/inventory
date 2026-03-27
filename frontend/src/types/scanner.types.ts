// src/types/scanner.types.ts

export type ScannerStatus = "available" | "assigned" | "revoked" | "retired";

// ─────────────────────────────────────────────────────────────
// Subscription plan
// ─────────────────────────────────────────────────────────────

export interface ScannerSubscriptionPlan {
  id: string;
  name: string;
  product_limit: number;
  monthly_price_ngn: string;
  yearly_price_ngn: string;
  has_analytics: boolean;
  has_reports: boolean;
  has_multi_branch: boolean;
}

// ─────────────────────────────────────────────────────────────
// Vendor subscription
// ─────────────────────────────────────────────────────────────

export interface ScannerVendorSubscription {
  id: string;
  plan: ScannerSubscriptionPlan;
  billing_cycle: "monthly" | "yearly";
  currency: string;
  status: "active" | "cancelled" | "expired" | "trialing";
  amount_paid: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Vendor profile
// ─────────────────────────────────────────────────────────────

export interface ScannerVendorProfile {
  first_name: string;
  last_name: string;
  business_name: string;
  business_type: string;
  business_description: string;
  business_logo: string;
  business_email: string;
  country_name: string | null;
  state_name: string | null;
  lga_name: string | null;
  city_town: string;
  street_address: string;
  nearest_landmark: string;
  postal_code: string;
  currency: string;
}

// ─────────────────────────────────────────────────────────────
// Vendor (embedded in scanner detail)
// ─────────────────────────────────────────────────────────────

export interface ScannerVendor {
  id: string;
  email: string;
  role: string;
  status: "approved" | "pending" | "rejected" | "suspended";
  email_verified: boolean;
  approved_at: string;
  last_login: string;
  date_joined: string;
  profile: ScannerVendorProfile;
  subscription: ScannerVendorSubscription;
}

// ─────────────────────────────────────────────────────────────
// Registered-by (admin who registered the scanner)
// ─────────────────────────────────────────────────────────────

export interface ScannerRegisteredBy {
  id: string;
  email: string;
  role: string;
}

// ─────────────────────────────────────────────────────────────
// Core scanner shapes
// ─────────────────────────────────────────────────────────────

export interface ScannerVendorView {
  id: string;
  serial_number: string;
  brand: string;
  model: string;
  status: ScannerStatus;
  assigned_at: string | null;
}

export interface ScannerListItem {
  id: string;
  serial_number: string;
  brand: string;
  model: string;
  status: ScannerStatus;
  vendor_email: string | null;
  assigned_at: string | null;
  created_at: string;
}

/**
 * Full scanner detail — returned by GET /scanners/:id/
 * `vendor` is now a full ScannerVendor object (not a plain string).
 * `registered_by` is now a ScannerRegisteredBy object (not a plain string).
 */
export interface ScannerDetail extends ScannerListItem {
  vendor: ScannerVendor | null;
  registered_by: ScannerRegisteredBy | null;
  revoked_at: string | null;
  revoke_reason: string;
  notes: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// Mutation request bodies
// ─────────────────────────────────────────────────────────────

export interface RegisterScannerRequest {
  serial_number: string;
  brand?: string;
  model?: string;
  notes?: string;
}

export interface BulkRegisterScannerRequest {
  scanners: RegisterScannerRequest[];
}

export interface BulkRegisterResult {
  success: boolean;
  message: string;
  data: {
    created: string[];
    existing: string[];
    failed: {
      serial_number: string;
      error: string;
    }[];
  };
}

export interface RevokeScannerRequest {
  revoke_reason?: string;
}

export interface ReassignScannerRequest {
  vendor_id: string;
}

// ─────────────────────────────────────────────────────────────
// Stats & filters
// ─────────────────────────────────────────────────────────────

export interface ScannerPoolStats {
  total: number;
  available: number;
  assigned: number;
  revoked: number;
  retired: number;
}

export interface ScannerFilters {
  status?: ScannerStatus;
  search?: string;
  brand?: string;
}
