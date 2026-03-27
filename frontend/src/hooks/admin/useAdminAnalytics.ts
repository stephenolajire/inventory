// src/hooks/admin/useAdminAnalytics.ts

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { QK, STALE } from "../../lib/queryClient";
import { apiGet } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import type {
  AdminPlatformSummary,
  MonthlyRevenue,
  TopVendor,
  SubscriptionDistribution,
  VendorRegistrationTrend,
  ApiResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/analytics/admin";

const adminAnalyticsApi = {
  summary: () => apiGet<ApiResponse<AdminPlatformSummary>>(`${BASE}/summary/`),

  monthlyRevenue: (months?: number) =>
    apiGet<ApiResponse<MonthlyRevenue[]>>(`${BASE}/revenue/monthly/`, {
      params: months ? { months } : undefined,
    }),

  topVendors: (params?: {
    limit?: number;
    from_date?: string;
    to_date?: string;
  }) =>
    apiGet<ApiResponse<TopVendor[]>>(`${BASE}/top-vendors/`, {
      params,
    }),

  subscriptionDistribution: () =>
    apiGet<ApiResponse<SubscriptionDistribution[]>>(`${BASE}/subscriptions/`),

  registrationTrend: (months?: number) =>
    apiGet<ApiResponse<VendorRegistrationTrend[]>>(`${BASE}/registrations/`, {
      params: months ? { months } : undefined,
    }),
};

// ─────────────────────────────────────────────────────────────
// Guard — only admin users can use these hooks
// ─────────────────────────────────────────────────────────────

function useIsAdmin(): boolean {
  return useAuthStore((s) => s.isAdmin());
}

// ─────────────────────────────────────────────────────────────
// Platform summary
// ─────────────────────────────────────────────────────────────

/**
 * Platform-wide revenue summary for the admin dashboard.
 * Returns today, this month and all-time figures plus
 * total vendor and pending vendor counts.
 */
export function useAdminAnalyticsSummary(
  options?: Partial<UseQueryOptions<ApiResponse<AdminPlatformSummary>>>,
) {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.adminAnalytics.summary(),
    queryFn: adminAnalyticsApi.summary,
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Monthly revenue
// ─────────────────────────────────────────────────────────────

/**
 * Platform-wide monthly revenue for the last N months.
 * Used to render the admin revenue bar chart.
 *
 * @param months  Number of months to return (default 12, max 24)
 */
export function useAdminMonthlyRevenue(
  months?: number,
  options?: Partial<UseQueryOptions<ApiResponse<MonthlyRevenue[]>>>,
) {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.adminAnalytics.monthly({ months }),
    queryFn: () => adminAnalyticsApi.monthlyRevenue(months),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Top vendors
// ─────────────────────────────────────────────────────────────

interface TopVendorFilters {
  limit?: number;
  from_date?: string;
  to_date?: string;
}

/**
 * Top vendors ranked by revenue.
 * Optionally filtered by date range and limited to N results.
 */
export function useAdminTopVendors(
  filters?: TopVendorFilters,
  options?: Partial<UseQueryOptions<ApiResponse<TopVendor[]>>>,
) {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.adminAnalytics.topVendors(filters),
    queryFn: () => adminAnalyticsApi.topVendors(filters),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Subscription distribution
// ─────────────────────────────────────────────────────────────

/**
 * Distribution of active subscriptions by plan.
 * Returns plan name, count and percentage.
 * Used to render the plan distribution chart on the admin dashboard.
 */
export function useAdminSubscriptionDistribution(
  options?: Partial<UseQueryOptions<ApiResponse<SubscriptionDistribution[]>>>,
) {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.adminAnalytics.subscriptions(),
    queryFn: adminAnalyticsApi.subscriptionDistribution,
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Registration trend
// ─────────────────────────────────────────────────────────────

/**
 * Vendor registration count grouped by month.
 * Used to render the registrations trend chart.
 *
 * @param months  Number of months to look back (default 12, max 24)
 */
export function useAdminRegistrationTrend(
  months?: number,
  options?: Partial<UseQueryOptions<ApiResponse<VendorRegistrationTrend[]>>>,
) {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.adminAnalytics.registrations({ months }),
    queryFn: () => adminAnalyticsApi.registrationTrend(months),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — loads everything for the admin dashboard
// in a single call. Each query runs in parallel.
// ─────────────────────────────────────────────────────────────

/**
 * Loads all admin analytics data in parallel.
 * Use this on the AdminAnalyticsPage to avoid waterfall loading.
 *
 * const {
 *   summary,
 *   monthly,
 *   topVendors,
 *   subscriptions,
 *   registrations,
 *   isLoading,
 *   isError,
 * } = useAdminAnalyticsDashboard();
 */
export function useAdminAnalyticsDashboard(params?: {
  months?: number;
  vendorLimit?: number;
  from_date?: string;
  to_date?: string;
}) {
  const summary = useAdminAnalyticsSummary();
  const monthly = useAdminMonthlyRevenue(params?.months);
  const topVendors = useAdminTopVendors({
    limit: params?.vendorLimit ?? 10,
    from_date: params?.from_date,
    to_date: params?.to_date,
  });
  const subscriptions = useAdminSubscriptionDistribution();
  const registrations = useAdminRegistrationTrend(params?.months);

  const isLoading =
    summary.isLoading ||
    monthly.isLoading ||
    topVendors.isLoading ||
    subscriptions.isLoading ||
    registrations.isLoading;

  const isError =
    summary.isError ||
    monthly.isError ||
    topVendors.isError ||
    subscriptions.isError ||
    registrations.isError;

  const isFetching =
    summary.isFetching ||
    monthly.isFetching ||
    topVendors.isFetching ||
    subscriptions.isFetching ||
    registrations.isFetching;

  return {
    summary,
    monthly,
    topVendors,
    subscriptions,
    registrations,
    isLoading,
    isError,
    isFetching,
  };
}
