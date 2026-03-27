// src/hooks/admin/useAdminSales.ts — corrected full file

import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { QK, STALE } from "../../lib/queryClient";
import { apiGet } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import type {
  AdminSaleListItem,
  SaleDetail,
  ApiResponse,
  PaginatedResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AdminSaleFilters {
  vendor?: string;
  payment_method?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  page?: number;
}

interface AdminSalesSummary {
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
}

interface AdminSaleByVendor {
  vendor_id: string;
  vendor_email: string;
  total_revenue: string;
  total_orders: number;
  total_units: number;
}

interface AdminSaleByVendorFilters {
  from_date?: string;
  to_date?: string;
  limit?: number;
}

// ─────────────────────────────────────────────────────────────
// Query keys — local additions not in the global QK factory
// ─────────────────────────────────────────────────────────────

const ADMIN_SALES_QK = {
  summary: () => ["admin", "sales", "summary"] as const,
  byVendor: (f?: object) => ["admin", "sales", "by-vendor", f] as const,
} as const;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/sales/admin";

const adminSalesApi = {
  list: (
    filters?: AdminSaleFilters,
  ): Promise<PaginatedResponse<AdminSaleListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.vendor) params.vendor = filters.vendor;
    if (filters?.payment_method) params.payment_method = filters.payment_method;
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;
    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.page = filters.page;
    return apiGet<PaginatedResponse<AdminSaleListItem>>(`${BASE}/`, { params });
  },

  detail: (id: string): Promise<ApiResponse<SaleDetail>> =>
    apiGet<ApiResponse<SaleDetail>>(`${BASE}/${id}/`),

  summary: (): Promise<ApiResponse<AdminSalesSummary>> =>
    apiGet<ApiResponse<AdminSalesSummary>>(`${BASE}/summary/`),

  byVendor: (
    filters?: AdminSaleByVendorFilters,
  ): Promise<ApiResponse<AdminSaleByVendor[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;
    if (filters?.limit) params.limit = filters.limit;
    return apiGet<ApiResponse<AdminSaleByVendor[]>>(`${BASE}/by-vendor/`, {
      params,
    });
  },
};

// ─────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────

function useIsAdmin(): boolean {
  return useAuthStore((s) => s.isAdmin());
}

// ─────────────────────────────────────────────────────────────
// List all sales
// ─────────────────────────────────────────────────────────────

export function useAdminSales(
  filters?: AdminSaleFilters,
  options?: Partial<UseQueryOptions<PaginatedResponse<AdminSaleListItem>>>,
): UseQueryResult<PaginatedResponse<AdminSaleListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.admin.sales(filters as object),
    queryFn: () => adminSalesApi.list(filters),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Single sale detail
// ─────────────────────────────────────────────────────────────

export function useAdminSaleDetail(
  id: string,
  options?: Partial<UseQueryOptions<ApiResponse<SaleDetail>>>,
): UseQueryResult<ApiResponse<SaleDetail>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.sales.detail(id),
    queryFn: () => adminSalesApi.detail(id),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin && !!id,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Platform-wide summary
// ─────────────────────────────────────────────────────────────

export function useAdminSalesSummary(
  options?: Partial<UseQueryOptions<ApiResponse<AdminSalesSummary>>>,
): UseQueryResult<ApiResponse<AdminSalesSummary>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ADMIN_SALES_QK.summary(),
    queryFn: adminSalesApi.summary,
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Sales grouped by vendor
// ─────────────────────────────────────────────────────────────

export function useAdminSalesByVendor(
  filters?: AdminSaleByVendorFilters,
  options?: Partial<UseQueryOptions<ApiResponse<AdminSaleByVendor[]>>>,
): UseQueryResult<ApiResponse<AdminSaleByVendor[]>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ADMIN_SALES_QK.byVendor(filters as object),
    queryFn: () => adminSalesApi.byVendor(filters),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — admin sales page
// ─────────────────────────────────────────────────────────────

interface AdminSalesDashboard {
  sales: UseQueryResult<PaginatedResponse<AdminSaleListItem>>;
  summary: UseQueryResult<ApiResponse<AdminSalesSummary>>;
  byVendor: UseQueryResult<ApiResponse<AdminSaleByVendor[]>>;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
}

export function useAdminSalesDashboard(
  filters?: AdminSaleFilters,
  vendorFilters?: AdminSaleByVendorFilters,
): AdminSalesDashboard {
  const sales = useAdminSales(filters);
  const summary = useAdminSalesSummary();
  const byVendor = useAdminSalesByVendor(vendorFilters);

  return {
    sales,
    summary,
    byVendor,
    isLoading: sales.isLoading || summary.isLoading || byVendor.isLoading,
    isError: sales.isError || summary.isError || byVendor.isError,
    isFetching: sales.isFetching || summary.isFetching || byVendor.isFetching,
  };
}
