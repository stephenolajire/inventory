// src/hooks/admin/useAdminProducts.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { STALE } from "../../lib/queryClient";
import { apiGet, apiPatch, apiPost, apiDelete, getApiErrorMessage } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import toast from "react-hot-toast";
import type {
  ProductListItem,
  ProductDetail,
  ApiResponse,
  PaginatedResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AdminProductFilters {
  vendor?:    string;
  category?:  string;
  search?:    string;
  low_stock?: boolean;
  is_active?: boolean;
  ordering?:  string;
  page?:      number;
}

interface AdminToggleActivePayload {
  product_id: string;
  active:     boolean;
}

interface AdminDeleteProductPayload {
  product_id: string;
}

interface AdminUpdateStockPayload {
  product_id:        string;
  quantity_in_stock: number;
}

type AdminToggleMutationResult = UseMutationResult<
  ApiResponse<ProductDetail>,
  Error,
  AdminToggleActivePayload
>;

type AdminDeleteMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  AdminDeleteProductPayload
>;

type AdminUpdateStockMutationResult = UseMutationResult<
  ApiResponse<ProductDetail>,
  Error,
  AdminUpdateStockPayload
>;

type AdminToggleMutationOptions = UseMutationOptions<
  ApiResponse<ProductDetail>,
  Error,
  AdminToggleActivePayload
>;

type AdminDeleteMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean }>,
  Error,
  AdminDeleteProductPayload
>;

type AdminUpdateStockMutationOptions = UseMutationOptions<
  ApiResponse<ProductDetail>,
  Error,
  AdminUpdateStockPayload
>;

// ─────────────────────────────────────────────────────────────
// Local query keys
// ─────────────────────────────────────────────────────────────

const ADMIN_PRODUCT_QK = {
  list:     (f?: object) => ["admin", "products", "list", f]      as const,
  detail:   (id: string) => ["admin", "products", "detail", id]   as const,
  lowStock: ()           => ["admin", "products", "low-stock"]     as const,
} as const;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/products/admin";

const adminProductsApi = {

  list: (
    filters?: AdminProductFilters
  ): Promise<PaginatedResponse<ProductListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.vendor)    params.vendor    = filters.vendor;
    if (filters?.category)  params.category  = filters.category;
    if (filters?.search)    params.search    = filters.search;
    if (filters?.low_stock) params.low_stock = filters.low_stock;
    if (filters?.is_active !== undefined) params.is_active = filters.is_active;
    if (filters?.ordering)  params.ordering  = filters.ordering;
    if (filters?.page)      params.page      = filters.page;
    return apiGet<PaginatedResponse<ProductListItem>>(
      `${BASE}/`,
      { params }
    );
  },

  detail: (id: string): Promise<ApiResponse<ProductDetail>> =>
    apiGet<ApiResponse<ProductDetail>>(`${BASE}/${id}/`),

  lowStock: (page?: number): Promise<PaginatedResponse<ProductListItem>> =>
    apiGet<PaginatedResponse<ProductListItem>>(
      `${BASE}/low-stock/`,
      { params: page ? { page } : undefined }
    ),

  activate: (
    payload: AdminToggleActivePayload
  ): Promise<ApiResponse<ProductDetail>> =>
    payload.active
      ? apiPost<ApiResponse<ProductDetail>>(
          `${BASE}/${payload.product_id}/activate/`
        )
      : apiPatch<ApiResponse<ProductDetail>>(
          `${BASE}/${payload.product_id}/`,
          { is_active: false }
        ),

  delete: (
    payload: AdminDeleteProductPayload
  ): Promise<ApiResponse<{ success: boolean }>> =>
    apiDelete<ApiResponse<{ success: boolean }>>(
      `${BASE}/${payload.product_id}/`
    ),

  updateStock: (
    payload: AdminUpdateStockPayload
  ): Promise<ApiResponse<ProductDetail>> =>
    apiPatch<ApiResponse<ProductDetail>>(
      `${BASE}/${payload.product_id}/stock/`,
      { quantity_in_stock: payload.quantity_in_stock }
    ),
};

// ─────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────

function useIsAdmin(): boolean {
  return useAuthStore((s) => s.isAdmin());
}

// ─────────────────────────────────────────────────────────────
// List all products (admin — cross-vendor)
// ─────────────────────────────────────────────────────────────

export function useAdminProducts(
  filters?:  AdminProductFilters,
  options?:  Partial<UseQueryOptions<PaginatedResponse<ProductListItem>>>
): UseQueryResult<PaginatedResponse<ProductListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  ADMIN_PRODUCT_QK.list(filters as object),
    queryFn:   () => adminProductsApi.list(filters),
    staleTime: STALE.DEFAULT,
    enabled:   isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Single product detail
// ─────────────────────────────────────────────────────────────

export function useAdminProductDetail(
  id:       string,
  options?: Partial<UseQueryOptions<ApiResponse<ProductDetail>>>
): UseQueryResult<ApiResponse<ProductDetail>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  ADMIN_PRODUCT_QK.detail(id),
    queryFn:   () => adminProductsApi.detail(id),
    staleTime: STALE.DEFAULT,
    enabled:   isAdmin && !!id,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Platform-wide low stock
// ─────────────────────────────────────────────────────────────

export function useAdminLowStockProducts(
  page?:    number,
  options?: Partial<UseQueryOptions<PaginatedResponse<ProductListItem>>>
): UseQueryResult<PaginatedResponse<ProductListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  ADMIN_PRODUCT_QK.lowStock(),
    queryFn:   () => adminProductsApi.lowStock(page),
    staleTime: STALE.REALTIME,
    enabled:   isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Toggle active
// ─────────────────────────────────────────────────────────────

export function useAdminToggleProductActive(
  options?: AdminToggleMutationOptions
): AdminToggleMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminToggleActivePayload) =>
      adminProductsApi.activate(payload),

    onSuccess: (_res, vars) => {
      toast.success(
        `Product ${vars.active ? "activated" : "deactivated"}.`
      );
      qc.invalidateQueries({
        queryKey: ADMIN_PRODUCT_QK.list(),
      });
      qc.invalidateQueries({
        queryKey: ADMIN_PRODUCT_QK.detail(vars.product_id),
      });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Delete product
// ─────────────────────────────────────────────────────────────

export function useAdminDeleteProduct(
  options?: AdminDeleteMutationOptions
): AdminDeleteMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminDeleteProductPayload) =>
      adminProductsApi.delete(payload),

    onSuccess: (_res, vars) => {
      toast.success("Product deleted.");
      qc.removeQueries({
        queryKey: ADMIN_PRODUCT_QK.detail(vars.product_id),
      });
      qc.invalidateQueries({
        queryKey: ADMIN_PRODUCT_QK.list(),
      });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Update stock
// ─────────────────────────────────────────────────────────────

export function useAdminUpdateProductStock(
  options?: AdminUpdateStockMutationOptions
): AdminUpdateStockMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminUpdateStockPayload) =>
      adminProductsApi.updateStock(payload),

    onSuccess: (_res, vars) => {
      toast.success("Stock updated.");
      qc.invalidateQueries({
        queryKey: ADMIN_PRODUCT_QK.detail(vars.product_id),
      });
      qc.invalidateQueries({
        queryKey: ADMIN_PRODUCT_QK.list(),
      });
      qc.invalidateQueries({
        queryKey: ADMIN_PRODUCT_QK.lowStock(),
      });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — admin products page
// ─────────────────────────────────────────────────────────────

interface AdminProductsDashboard {
  products:     UseQueryResult<PaginatedResponse<ProductListItem>>;
  lowStock:     UseQueryResult<PaginatedResponse<ProductListItem>>;
  toggle:       AdminToggleMutationResult;
  remove:       AdminDeleteMutationResult;
  updateStock:  AdminUpdateStockMutationResult;
  isLoading:    boolean;
  isError:      boolean;
  isFetching:   boolean;
}

export function useAdminProductsDashboard(
  filters?: AdminProductFilters
): AdminProductsDashboard {
  const products    = useAdminProducts(filters);
  const lowStock    = useAdminLowStockProducts();
  const toggle      = useAdminToggleProductActive();
  const remove      = useAdminDeleteProduct();
  const updateStock = useAdminUpdateProductStock();

  return {
    products,
    lowStock,
    toggle,
    remove,
    updateStock,
    isLoading:  products.isLoading  || lowStock.isLoading,
    isError:    products.isError    || lowStock.isError,
    isFetching: products.isFetching || lowStock.isFetching,
  };
}