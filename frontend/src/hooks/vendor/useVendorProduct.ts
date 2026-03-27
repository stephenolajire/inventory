// src/hooks/useVendorProducts.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { QK, STALE } from "../../lib/queryClient";
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  apiUpload,
  getApiErrorMessage,
} from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import toast from "react-hot-toast";
import type {
  ProductListItem,
  ProductDetail,
  Category,
  CreateProductRequest,
  UpdateProductRequest,
  StockUpdateRequest,
  DiscountUpdateRequest,
  ProductFilters,
  ApiResponse,
  PaginatedResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UploadImagePayload {
  product_id:  string;
  file:        File;
  onProgress?: (pct: number) => void;
}

interface UpdateStockPayload extends StockUpdateRequest {
  product_id: string;
}

interface UpdateDiscountPayload extends DiscountUpdateRequest {
  product_id: string;
}

interface UpdateProductPayload extends UpdateProductRequest {
  product_id: string;
}

interface DeleteProductPayload {
  product_id: string;
}

interface ActivateProductPayload {
  product_id: string;
}

type CreateProductMutationResult = UseMutationResult<
  ApiResponse<ProductListItem>,
  Error,
  CreateProductRequest
>;

type UpdateProductMutationResult = UseMutationResult<
  ApiResponse<ProductDetail>,
  Error,
  UpdateProductPayload
>;

type DeleteProductMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  DeleteProductPayload
>;

type ActivateProductMutationResult = UseMutationResult<
  ApiResponse<ProductDetail>,
  Error,
  ActivateProductPayload
>;

type UpdateStockMutationResult = UseMutationResult<
  ApiResponse<ProductDetail>,
  Error,
  UpdateStockPayload
>;

type UpdateDiscountMutationResult = UseMutationResult<
  ApiResponse<ProductDetail>,
  Error,
  UpdateDiscountPayload
>;

type UploadImageMutationResult = UseMutationResult<
  ApiResponse<ProductDetail>,
  Error,
  UploadImagePayload
>;

type CreateProductMutationOptions = UseMutationOptions<
  ApiResponse<ProductListItem>,
  Error,
  CreateProductRequest
>;

type UpdateProductMutationOptions = UseMutationOptions<
  ApiResponse<ProductDetail>,
  Error,
  UpdateProductPayload
>;

type DeleteProductMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean }>,
  Error,
  DeleteProductPayload
>;

type UpdateStockMutationOptions = UseMutationOptions<
  ApiResponse<ProductDetail>,
  Error,
  UpdateStockPayload
>;

type UpdateDiscountMutationOptions = UseMutationOptions<
  ApiResponse<ProductDetail>,
  Error,
  UpdateDiscountPayload
>;

type UploadImageMutationOptions = UseMutationOptions<
  ApiResponse<ProductDetail>,
  Error,
  UploadImagePayload
>;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/products";

const productApi = {

  list: (
    filters?: ProductFilters
  ): Promise<PaginatedResponse<ProductListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.category)  params.category  = filters.category;
    if (filters?.search)    params.search    = filters.search;
    if (filters?.low_stock) params.low_stock = filters.low_stock;
    if (filters?.ordering)  params.ordering  = filters.ordering;
    if (filters?.page)      params.page      = filters.page;
    return apiGet<PaginatedResponse<ProductListItem>>(
      `${BASE}/`,
      { params }
    );
  },

  detail: (id: string): Promise<ApiResponse<ProductDetail>> =>
    apiGet<ApiResponse<ProductDetail>>(`${BASE}/${id}/`),

  create: (
    data: CreateProductRequest
  ): Promise<ApiResponse<ProductListItem>> =>
    apiPost<ApiResponse<ProductListItem>>(`${BASE}/`, data),

  update: (
    payload: UpdateProductPayload
  ): Promise<ApiResponse<ProductDetail>> =>
    apiPatch<ApiResponse<ProductDetail>>(
      `${BASE}/${payload.product_id}/`,
      payload
    ),

  delete: (
    payload: DeleteProductPayload
  ): Promise<ApiResponse<{ success: boolean }>> =>
    apiDelete<ApiResponse<{ success: boolean }>>(
      `${BASE}/${payload.product_id}/`
    ),

  activate: (
    payload: ActivateProductPayload
  ): Promise<ApiResponse<ProductDetail>> =>
    apiPost<ApiResponse<ProductDetail>>(
      `${BASE}/${payload.product_id}/activate/`
    ),

  updateStock: (
    payload: UpdateStockPayload
  ): Promise<ApiResponse<ProductDetail>> =>
    apiPatch<ApiResponse<ProductDetail>>(
      `${BASE}/${payload.product_id}/stock/`,
      { quantity_in_stock: payload.quantity_in_stock } as StockUpdateRequest
    ),

  updateDiscount: (
    payload: UpdateDiscountPayload
  ): Promise<ApiResponse<ProductDetail>> =>
    apiPatch<ApiResponse<ProductDetail>>(
      `${BASE}/${payload.product_id}/discount/`,
      {
        discount_price:      payload.discount_price,
        discount_expires_at: payload.discount_expires_at,
      } as DiscountUpdateRequest
    ),

  uploadImage: (
    payload: UploadImagePayload
  ): Promise<ApiResponse<ProductDetail>> => {
    const formData = new FormData();
    formData.append("image", payload.file);
    return apiUpload<ApiResponse<ProductDetail>>(
      `${BASE}/${payload.product_id}/image/`,
      formData,
      payload.onProgress
    );
  },

  lowStock: (): Promise<PaginatedResponse<ProductListItem>> =>
    apiGet<PaginatedResponse<ProductListItem>>(`${BASE}/low-stock/`),

  categories: (): Promise<ApiResponse<Category[]>> =>
    apiGet<ApiResponse<Category[]>>("/categories/"),
};

// ─────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────

function useIsApproved(): boolean {
  return useAuthStore((s) => s.isApproved());
}

// ─────────────────────────────────────────────────────────────
// Product list
// ─────────────────────────────────────────────────────────────

export function useProducts(
  filters?:  ProductFilters,
  options?:  Partial<UseQueryOptions<PaginatedResponse<ProductListItem>>>
): UseQueryResult<PaginatedResponse<ProductListItem>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey:  QK.products.list(filters as object),
    queryFn:   () => productApi.list(filters),
    staleTime: STALE.DEFAULT,
    enabled:   isApproved,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Product detail
// ─────────────────────────────────────────────────────────────

export function useProductDetail(
  id:       string,
  options?: Partial<UseQueryOptions<ApiResponse<ProductDetail>>>
): UseQueryResult<ApiResponse<ProductDetail>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey:  QK.products.detail(id),
    queryFn:   () => productApi.detail(id),
    staleTime: STALE.DEFAULT,
    enabled:   isApproved && !!id,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Low stock products
// ─────────────────────────────────────────────────────────────

export function useLowStockProducts(
  options?: Partial<UseQueryOptions<PaginatedResponse<ProductListItem>>>
): UseQueryResult<PaginatedResponse<ProductListItem>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey:  QK.products.lowStock(),
    queryFn:   productApi.lowStock,
    staleTime: STALE.REALTIME,
    enabled:   isApproved,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────

export function useCategories(
  options?: Partial<UseQueryOptions<ApiResponse<Category[]>>>
): UseQueryResult<ApiResponse<Category[]>> {
  return useQuery({
    queryKey:  QK.categories.list(),
    queryFn:   productApi.categories,
    staleTime: STALE.STATIC,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Create product
// ─────────────────────────────────────────────────────────────

export function useCreateProduct(
  options?: CreateProductMutationOptions
): CreateProductMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductRequest) =>
      productApi.create(data),

    onSuccess: () => {
      toast.success("Product added — barcode is being generated.");
      qc.invalidateQueries({ queryKey: QK.products.all() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Update product
// ─────────────────────────────────────────────────────────────

export function useUpdateProduct(
  options?: UpdateProductMutationOptions
): UpdateProductMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProductPayload) =>
      productApi.update(payload),

    onSuccess: (res, vars) => {
      toast.success("Product updated.");
      qc.setQueryData(QK.products.detail(vars.product_id), res);
      qc.invalidateQueries({ queryKey: QK.products.all() });
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

export function useDeleteProduct(
  options?: DeleteProductMutationOptions
): DeleteProductMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteProductPayload) =>
      productApi.delete(payload),

    onSuccess: (_res, vars) => {
      toast.success("Product removed.");
      qc.removeQueries({ queryKey: QK.products.detail(vars.product_id) });
      qc.invalidateQueries({ queryKey: QK.products.all() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Activate product
// ─────────────────────────────────────────────────────────────

export function useActivateProduct(
  options?: UseMutationOptions<
    ApiResponse<ProductDetail>,
    Error,
    ActivateProductPayload
  >
): ActivateProductMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ActivateProductPayload) =>
      productApi.activate(payload),

    onSuccess: (res, vars) => {
      toast.success("Product activated.");
      qc.setQueryData(QK.products.detail(vars.product_id), res);
      qc.invalidateQueries({ queryKey: QK.products.all() });
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

export function useUpdateStock(
  options?: UpdateStockMutationOptions
): UpdateStockMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStockPayload) =>
      productApi.updateStock(payload),

    onSuccess: (res, vars) => {
      toast.success("Stock updated.");
      qc.setQueryData(QK.products.detail(vars.product_id), res);
      qc.invalidateQueries({ queryKey: QK.products.lowStock() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Update discount
// ─────────────────────────────────────────────────────────────

export function useUpdateDiscount(
  options?: UpdateDiscountMutationOptions
): UpdateDiscountMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDiscountPayload) =>
      productApi.updateDiscount(payload),

    onSuccess: (res, vars) => {
      toast.success(
       ""
      );
      qc.setQueryData(QK.products.detail(vars.product_id), res);
      qc.invalidateQueries({ queryKey: QK.products.all() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Upload product image
// ─────────────────────────────────────────────────────────────

export function useUploadProductImage(
  options?: UploadImageMutationOptions
): UploadImageMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UploadImagePayload) =>
      productApi.uploadImage(payload),

    onSuccess: (res, vars) => {
      toast.success("Image uploaded.");
      qc.setQueryData(QK.products.detail(vars.product_id), res);
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — product management page
// ─────────────────────────────────────────────────────────────

interface VendorProductsHook {
  products:       UseQueryResult<PaginatedResponse<ProductListItem>>;
  lowStock:       UseQueryResult<PaginatedResponse<ProductListItem>>;
  categories:     UseQueryResult<ApiResponse<Category[]>>;
  create:         CreateProductMutationResult;
  update:         UpdateProductMutationResult;
  remove:         DeleteProductMutationResult;
  activate:       ActivateProductMutationResult;
  updateStock:    UpdateStockMutationResult;
  updateDiscount: UpdateDiscountMutationResult;
  uploadImage:    UploadImageMutationResult;
  isLoading:      boolean;
  isError:        boolean;
  isFetching:     boolean;
}

export function useVendorProducts(
  filters?: ProductFilters
): VendorProductsHook {
  const products       = useProducts(filters);
  const lowStock       = useLowStockProducts();
  const categories     = useCategories();
  const create         = useCreateProduct();
  const update         = useUpdateProduct();
  const remove         = useDeleteProduct();
  const activate       = useActivateProduct();
  const updateStock    = useUpdateStock();
  const updateDiscount = useUpdateDiscount();
  const uploadImage    = useUploadProductImage();

  return {
    products,
    lowStock,
    categories,
    create,
    update,
    remove,
    activate,
    updateStock,
    updateDiscount,
    uploadImage,
    isLoading:  products.isLoading  || categories.isLoading,
    isError:    products.isError    || categories.isError,
    isFetching: products.isFetching || categories.isFetching,
  };
}