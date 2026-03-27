// src/hooks/useVendorSales.ts

import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { QK, STALE } from "../../lib/queryClient";
import { apiGet } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import type {
  SaleListItem,
  SaleDetail,
  SalesSummary,
  SaleByProduct,
  SaleByPaymentMethod,
  Receipt,
  SaleFilters,
  ApiResponse,
  PaginatedResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Local query keys
// ─────────────────────────────────────────────────────────────

const SALES_QK = {
  summary: () => ["sales", "summary"] as const,
  byProduct: (f?: object) => ["sales", "by-product", f] as const,
  byMethod: (f?: object) => ["sales", "by-method", f] as const,
} as const;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/sales";

const salesApi = {
  list: (filters?: SaleFilters): Promise<PaginatedResponse<SaleListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.product) params.product = filters.product;
    if (filters?.payment_method) params.payment_method = filters.payment_method;
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;
    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.page = filters.page;
    return apiGet<PaginatedResponse<SaleListItem>>(`${BASE}/`, { params });
  },

  detail: (id: string): Promise<ApiResponse<SaleDetail>> =>
    apiGet<ApiResponse<SaleDetail>>(`${BASE}/${id}/`),

  receipt: (cartId: string): Promise<ApiResponse<Receipt>> =>
    apiGet<ApiResponse<Receipt>>(`${BASE}/receipt/${cartId}/`),

  summary: (): Promise<ApiResponse<SalesSummary>> =>
    apiGet<ApiResponse<SalesSummary>>(`${BASE}/summary/`),

  byProduct: (filters?: {
    from_date?: string;
    to_date?: string;
    limit?: number;
  }): Promise<ApiResponse<SaleByProduct[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;
    if (filters?.limit) params.limit = filters.limit;
    return apiGet<ApiResponse<SaleByProduct[]>>(`${BASE}/by-product/`, {
      params,
    });
  },

  byPaymentMethod: (filters?: {
    from_date?: string;
    to_date?: string;
  }): Promise<ApiResponse<SaleByPaymentMethod[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;
    return apiGet<ApiResponse<SaleByPaymentMethod[]>>(
      `${BASE}/by-payment-method/`,
      { params },
    );
  },
};

// ─────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────

function useIsApproved(): boolean {
  return useAuthStore((s) => s.isApproved());
}

// ─────────────────────────────────────────────────────────────
// Sales list
// ─────────────────────────────────────────────────────────────

export function useVendorSalesList(
  filters?: SaleFilters,
  options?: Partial<UseQueryOptions<PaginatedResponse<SaleListItem>>>,
): UseQueryResult<PaginatedResponse<SaleListItem>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey: QK.sales.list(filters as object),
    queryFn: () => salesApi.list(filters),
    staleTime: STALE.DEFAULT,
    enabled: isApproved,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Sale detail
// ─────────────────────────────────────────────────────────────

export function useVendorSaleDetail(
  id: string,
  options?: Partial<UseQueryOptions<ApiResponse<SaleDetail>>>,
): UseQueryResult<ApiResponse<SaleDetail>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey: QK.sales.detail(id),
    queryFn: () => salesApi.detail(id),
    staleTime: STALE.DEFAULT,
    enabled: isApproved && !!id,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Receipt
// ─────────────────────────────────────────────────────────────

export function useReceipt(
  cartId: string,
  options?: Partial<UseQueryOptions<ApiResponse<Receipt>>>,
): UseQueryResult<ApiResponse<Receipt>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey: QK.sales.receipt(cartId),
    queryFn: () => salesApi.receipt(cartId),
    staleTime: STALE.NEVER,
    enabled: isApproved && !!cartId,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Sales summary
// ─────────────────────────────────────────────────────────────

export function useVendorSalesSummary(
  options?: Partial<UseQueryOptions<ApiResponse<SalesSummary>>>,
): UseQueryResult<ApiResponse<SalesSummary>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey: SALES_QK.summary(),
    queryFn: salesApi.summary,
    staleTime: STALE.DEFAULT,
    enabled: isApproved,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Sales by product
// ─────────────────────────────────────────────────────────────

interface ByProductFilters {
  from_date?: string;
  to_date?: string;
  limit?: number;
}

export function useVendorSalesByProduct(
  filters?: ByProductFilters,
  options?: Partial<UseQueryOptions<ApiResponse<SaleByProduct[]>>>,
): UseQueryResult<ApiResponse<SaleByProduct[]>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey: SALES_QK.byProduct(filters as object),
    queryFn: () => salesApi.byProduct(filters),
    staleTime: STALE.DEFAULT,
    enabled: isApproved,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Sales by payment method
// ─────────────────────────────────────────────────────────────

interface ByMethodFilters {
  from_date?: string;
  to_date?: string;
}

export function useVendorSalesByPaymentMethod(
  filters?: ByMethodFilters,
  options?: Partial<UseQueryOptions<ApiResponse<SaleByPaymentMethod[]>>>,
): UseQueryResult<ApiResponse<SaleByPaymentMethod[]>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey: SALES_QK.byMethod(filters as object),
    queryFn: () => salesApi.byPaymentMethod(filters),
    staleTime: STALE.DEFAULT,
    enabled: isApproved,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — sales dashboard
// ─────────────────────────────────────────────────────────────

interface VendorSalesHook {
  sales: UseQueryResult<PaginatedResponse<SaleListItem>>;
  summary: UseQueryResult<ApiResponse<SalesSummary>>;
  byProduct: UseQueryResult<ApiResponse<SaleByProduct[]>>;
  byMethod: UseQueryResult<ApiResponse<SaleByPaymentMethod[]>>;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
}

export function useVendorSales(
  filters?: SaleFilters,
  byProductFilters?: ByProductFilters,
  byMethodFilters?: ByMethodFilters,
): VendorSalesHook {
  const sales = useVendorSalesList(filters);
  const summary = useVendorSalesSummary();
  const byProduct = useVendorSalesByProduct(byProductFilters);
  const byMethod = useVendorSalesByPaymentMethod(byMethodFilters);

  return {
    sales,
    summary,
    byProduct,
    byMethod,
    isLoading:
      sales.isLoading ||
      summary.isLoading ||
      byProduct.isLoading ||
      byMethod.isLoading,
    isError:
      sales.isError || summary.isError || byProduct.isError || byMethod.isError,
    isFetching:
      sales.isFetching ||
      summary.isFetching ||
      byProduct.isFetching ||
      byMethod.isFetching,
  };
}
