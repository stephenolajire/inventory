// src/hooks/useVendorStorekeeper.ts

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
import { apiGet, apiPost, apiPatch, apiDelete, getApiErrorMessage } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import { useCartStore } from "../../store/cart.store";
import toast from "react-hot-toast";
import type {
  Cart,
  CartListItem,
  CartHistoryFilters,
  // ScanRequest,
  ScanResponse,
  SetPaymentRequest,
  MarkPaidRequest,
  MarkPaidResponse,
  UpdateCartItemRequest,
  OpenCartRequest,
  ApiResponse,
  PaginatedResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface RenameCartPayload {
  cart_id: string;
  label:   string;
}

interface ScanPayload {
  cart_id: string;
  barcode: string;
  measured_quantity?: number;
}

interface UpdateItemPayload {
  cart_id: string;
  item_id: string;
  quantity: number;
}

interface RemoveItemPayload {
  cart_id: string;
  item_id: string;
}

interface SetPaymentPayload extends SetPaymentRequest {
  cart_id: string;
}

interface MarkPaidPayload extends MarkPaidRequest {
  cart_id: string;
}

interface ClearCartPayload {
  cart_id:   string;
  abandoned: boolean;
}

type OpenCartMutationResult = UseMutationResult<
  ApiResponse<Cart>,
  Error,
  OpenCartRequest
>;

type RenameCartMutationResult = UseMutationResult<
  ApiResponse<Cart>,
  Error,
  RenameCartPayload
>;

type ScanMutationResult = UseMutationResult<
  ScanResponse,
  Error,
  ScanPayload
>;

type UpdateItemMutationResult = UseMutationResult<
  ApiResponse<Cart>,
  Error,
  UpdateItemPayload
>;

type RemoveItemMutationResult = UseMutationResult<
  ApiResponse<Cart>,
  Error,
  RemoveItemPayload
>;

type SetPaymentMutationResult = UseMutationResult<
  ApiResponse<Cart>,
  Error,
  SetPaymentPayload
>;

type MarkPaidMutationResult = UseMutationResult<
  MarkPaidResponse,
  Error,
  MarkPaidPayload
>;

type ClearCartMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  ClearCartPayload
>;

type OpenCartMutationOptions = UseMutationOptions<
  ApiResponse<Cart>,
  Error,
  OpenCartRequest
>;

type ScanMutationOptions = UseMutationOptions<
  ScanResponse,
  Error,
  ScanPayload
>;

type MarkPaidMutationOptions = UseMutationOptions<
  MarkPaidResponse,
  Error,
  MarkPaidPayload
>;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/storekeeper";

const storekeeperApi = {

  openCarts: (): Promise<ApiResponse<CartListItem[]>> =>
    apiGet<ApiResponse<CartListItem[]>>(`${BASE}/carts/`),

  cartDetail: (cartId: string): Promise<ApiResponse<Cart>> =>
    apiGet<ApiResponse<Cart>>(`${BASE}/carts/${cartId}/`),

  openCart: (
    data: OpenCartRequest
  ): Promise<ApiResponse<Cart>> =>
    apiPost<ApiResponse<Cart>>(`${BASE}/carts/`, data),

  renameCart: (
    payload: RenameCartPayload
  ): Promise<ApiResponse<Cart>> =>
    apiPatch<ApiResponse<Cart>>(
      `${BASE}/carts/${payload.cart_id}/`,
      { label: payload.label }
    ),

  scan: (payload: ScanPayload): Promise<ScanResponse> =>
  apiPost<ScanResponse>(
    `${BASE}/carts/${payload.cart_id}/scan/`,
    {
      barcode: payload.barcode,
      ...(payload.measured_quantity !== undefined && {
        measured_quantity: payload.measured_quantity,
      }),
    }
  ),

  updateItem: (
    payload: UpdateItemPayload
  ): Promise<ApiResponse<Cart>> =>
    apiPatch<ApiResponse<Cart>>(
      `${BASE}/carts/${payload.cart_id}/items/${payload.item_id}/`,
      { quantity: payload.quantity } as UpdateCartItemRequest
    ),

  removeItem: (
    payload: RemoveItemPayload
  ): Promise<ApiResponse<Cart>> =>
    apiDelete<ApiResponse<Cart>>(
      `${BASE}/carts/${payload.cart_id}/items/${payload.item_id}/`
    ),

  setPayment: (
    payload: SetPaymentPayload
  ): Promise<ApiResponse<Cart>> =>
    apiPatch<ApiResponse<Cart>>(
      `${BASE}/carts/${payload.cart_id}/payment/`,
      {
        payment_method:  payload.payment_method,
        amount_tendered: payload.amount_tendered,
      } as SetPaymentRequest
    ),

  markPaid: (
    payload: MarkPaidPayload
  ): Promise<MarkPaidResponse> =>
    apiPost<MarkPaidResponse>(
      `${BASE}/carts/${payload.cart_id}/pay/`,
      {
        payment_method:  payload.payment_method,
        amount_tendered: payload.amount_tendered,
      } as MarkPaidRequest
    ),

  clearCart: (
    payload: ClearCartPayload
  ): Promise<ApiResponse<{ success: boolean }>> =>
    apiDelete<ApiResponse<{ success: boolean }>>(
      `${BASE}/carts/${payload.cart_id}/clear/`,
      { params: { abandoned: payload.abandoned } }
    ),

  history: (
    filters?: CartHistoryFilters
  ): Promise<PaginatedResponse<CartListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date)   params.to_date   = filters.to_date;
    if (filters?.method)    params.method    = filters.method;
    if (filters?.page)      params.page      = filters.page;
    return apiGet<PaginatedResponse<CartListItem>>(
      `${BASE}/carts/history/`,
      { params }
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
// Open carts list
// ─────────────────────────────────────────────────────────────

export function useOpenCarts(
  options?: Partial<UseQueryOptions<ApiResponse<CartListItem[]>>>
): UseQueryResult<ApiResponse<CartListItem[]>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey:  QK.carts.open(),
    queryFn:   storekeeperApi.openCarts,
    staleTime: STALE.REALTIME,
    enabled:   isApproved,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Single cart detail
// ─────────────────────────────────────────────────────────────

export function useCartDetail(
  cartId:   string,
  options?: Partial<UseQueryOptions<ApiResponse<Cart>>>
): UseQueryResult<ApiResponse<Cart>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey:  QK.carts.detail(cartId),
    queryFn:   () => storekeeperApi.cartDetail(cartId),
    staleTime: STALE.REALTIME,
    enabled:   isApproved && !!cartId,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Cart history
// ─────────────────────────────────────────────────────────────

export function useCartHistory(
  filters?:  CartHistoryFilters,
  options?:  Partial<UseQueryOptions<PaginatedResponse<CartListItem>>>
): UseQueryResult<PaginatedResponse<CartListItem>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey:  QK.carts.history(filters as object),
    queryFn:   () => storekeeperApi.history(filters),
    staleTime: STALE.DEFAULT,
    enabled:   isApproved,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Open a new cart
// ─────────────────────────────────────────────────────────────

export function useOpenCart(
  options?: OpenCartMutationOptions
): OpenCartMutationResult {
  const qc        = useQueryClient();
  const cartStore = useCartStore();

  return useMutation({
    mutationFn: (data: OpenCartRequest) =>
      storekeeperApi.openCart(data),

    onSuccess: (res) => {
      if (res.data) {
        // Set as active cart immediately
        cartStore.setActiveCart(res.data);
        qc.invalidateQueries({ queryKey: QK.carts.open() });
        qc.setQueryData(QK.carts.detail(res.data.id), res);
      }
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Rename cart
// ─────────────────────────────────────────────────────────────

export function useRenameCart(
  options?: UseMutationOptions<ApiResponse<Cart>, Error, RenameCartPayload>
): RenameCartMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: RenameCartPayload) =>
      storekeeperApi.renameCart(payload),

    onSuccess: (res, vars) => {
      if (res.data) {
        qc.setQueryData(QK.carts.detail(vars.cart_id), res);
        qc.invalidateQueries({ queryKey: QK.carts.open() });
        useCartStore.getState().updateActiveCart(res.data);
      }
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Scan barcode
// ─────────────────────────────────────────────────────────────

export function useScan(
  options?: ScanMutationOptions
): ScanMutationResult {
  const qc        = useQueryClient();
  const cartStore = useCartStore();

  return useMutation({
    mutationFn: (payload: ScanPayload) =>
      storekeeperApi.scan(payload),

    onSuccess: (res, vars) => {
      if (res.data) {
        // Flash scan animation in store
        const productName =
          res.data.items[res.data.items.length - 1]?.product_name ?? "";
        cartStore.flashScan(productName);

        // Update active cart
        cartStore.updateActiveCart(res.data);
        qc.setQueryData(QK.carts.detail(vars.cart_id), {
          success: true,
          data:    res.data,
        });
      }
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Update cart item quantity
// ─────────────────────────────────────────────────────────────

export function useUpdateCartItem(
  options?: UseMutationOptions<ApiResponse<Cart>, Error, UpdateItemPayload>
): UpdateItemMutationResult {
  const qc        = useQueryClient();
  const cartStore = useCartStore();

  return useMutation({
    mutationFn: (payload: UpdateItemPayload) =>
      storekeeperApi.updateItem(payload),

    onSuccess: (res, vars) => {
      if (res.data) {
        cartStore.updateActiveCart(res.data);
        qc.setQueryData(QK.carts.detail(vars.cart_id), res);
      }
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Remove cart item
// ─────────────────────────────────────────────────────────────

export function useRemoveCartItem(
  options?: UseMutationOptions<ApiResponse<Cart>, Error, RemoveItemPayload>
): RemoveItemMutationResult {
  const qc        = useQueryClient();
  const cartStore = useCartStore();

  return useMutation({
    mutationFn: (payload: RemoveItemPayload) =>
      storekeeperApi.removeItem(payload),

    onSuccess: (res, vars) => {
      if (res.data) {
        cartStore.updateActiveCart(res.data);
        qc.setQueryData(QK.carts.detail(vars.cart_id), res);
      }
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Set payment method
// ─────────────────────────────────────────────────────────────

export function useSetPayment(
  options?: UseMutationOptions<ApiResponse<Cart>, Error, SetPaymentPayload>
): SetPaymentMutationResult {
  const qc        = useQueryClient();
  const cartStore = useCartStore();

  return useMutation({
    mutationFn: (payload: SetPaymentPayload) =>
      storekeeperApi.setPayment(payload),

    onSuccess: (res, vars) => {
      if (res.data) {
        cartStore.updateActiveCart(res.data);
        qc.setQueryData(QK.carts.detail(vars.cart_id), res);
      }
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Mark as paid
// ─────────────────────────────────────────────────────────────

export function useMarkPaid(
  options?: MarkPaidMutationOptions
): MarkPaidMutationResult {
  const qc        = useQueryClient();
  const cartStore = useCartStore();

  return useMutation({
    mutationFn: (payload: MarkPaidPayload) =>
      storekeeperApi.markPaid(payload),

    onSuccess: (_res, vars) => {
      // Remove paid cart from open carts
      cartStore.removeCart(vars.cart_id);
      cartStore.closePayment();

      qc.invalidateQueries({ queryKey: QK.carts.open()          });
      qc.invalidateQueries({ queryKey: QK.sales.list()          });
      qc.invalidateQueries({ queryKey: QK.sales.summary()       });
      qc.invalidateQueries({ queryKey: QK.products.lowStock()   });
      qc.invalidateQueries({ queryKey: QK.analytics.summary()   });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Clear cart
// ─────────────────────────────────────────────────────────────

export function useClearCart(
  options?: UseMutationOptions<
    ApiResponse<{ success: boolean }>,
    Error,
    ClearCartPayload
  >
): ClearCartMutationResult {
  const qc        = useQueryClient();
  const cartStore = useCartStore();

  return useMutation({
    mutationFn: (payload: ClearCartPayload) =>
      storekeeperApi.clearCart(payload),

    onSuccess: (_res, vars) => {
      cartStore.removeCart(vars.cart_id);
      qc.invalidateQueries({ queryKey: QK.carts.open() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — full storekeeper counter screen
// ─────────────────────────────────────────────────────────────

interface StorekeeperHook {
  // ── Queries ──
  openCarts:   UseQueryResult<ApiResponse<CartListItem[]>>;
  activeCart:  Cart | null;
  isScanning:  boolean;
  lastScanned: string | null;

  // ── Mutations ──
  openCart:    OpenCartMutationResult;
  renameCart:  RenameCartMutationResult;
  scan:        ScanMutationResult;
  updateItem:  UpdateItemMutationResult;
  removeItem:  RemoveItemMutationResult;
  setPayment:  SetPaymentMutationResult;
  markPaid:    MarkPaidMutationResult;
  clearCart:   ClearCartMutationResult;

  // ── Cart store helpers ──
  setActiveCartId: (id: string) => void;
  openPayment:     () => void;
  closePayment:    () => void;
  isPaymentOpen:   boolean;
  isLoading:       boolean;
}

export function useStorekeeper(): StorekeeperHook {
  const cartStore = useCartStore();

  const openCarts  = useOpenCarts();
  const openCart   = useOpenCart();
  const renameCart = useRenameCart();
  const scan       = useScan();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const setPayment = useSetPayment();
  const markPaid   = useMarkPaid();
  const clearCart  = useClearCart();

  return {
    openCarts,
    activeCart:      cartStore.activeCart,
    isScanning:      cartStore.isScanning,
    lastScanned:     cartStore.lastScannedItem,
    openCart,
    renameCart,
    scan,
    updateItem,
    removeItem,
    setPayment,
    markPaid,
    clearCart,
    setActiveCartId: cartStore.setActiveCartId,
    openPayment:     cartStore.openPayment,
    closePayment:    cartStore.closePayment,
    isPaymentOpen:   cartStore.isPaymentOpen,
    isLoading:       openCarts.isLoading,
  };
}