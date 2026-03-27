// src/hooks/useVendorPaypal.ts

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
import { apiGet, apiPost, getApiErrorMessage } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import toast from "react-hot-toast";
import type { ApiResponse, PaginatedResponse } from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type BillingCycle = "monthly" | "yearly";
export type PayPalCurrency = "NGN" | "USD" | "GBP";

// ── Order types ───────────────────────────────────────────────

export interface PayPalOrder {
  id: string;
  paypal_order_id: string;
  intent: "activation" | "upgrade";
  amount: string;
  currency: PayPalCurrency;
  status: "CREATED" | "APPROVED" | "COMPLETED" | "FAILED" | "VOIDED";
  capture_id: string;
  created_at: string;
}

export interface CreateOrderRequest {
  plan: number; // SubscriptionPlan PK
  billing_cycle: BillingCycle;
  currency: PayPalCurrency;
}

export interface CreateOrderResponse {
  success: boolean;
  paypal_order_id: string;
  amount: string;
  currency: PayPalCurrency;
  message: string;
}

export interface CaptureOrderRequest {
  paypal_order_id: string;
}

export interface CaptureOrderResponse {
  success: boolean;
  message: string;
  capture_id: string;
}

// ── Upgrade types ─────────────────────────────────────────────

export interface UpgradeCreateRequest {
  step: "create";
  new_plan: number; // SubscriptionPlan PK
  billing_cycle?: BillingCycle;
}

export interface UpgradeCaptureRequest {
  step: "capture";
  paypal_order_id: string;
}

export type UpgradeOrderRequest = UpgradeCreateRequest | UpgradeCaptureRequest;

export interface UpgradeCreateResponse {
  success: boolean;
  paypal_order_id: string;
  charge_now: string;
  currency: PayPalCurrency;
  message: string;
}

export interface UpgradeCaptureResponse {
  success: boolean;
  message: string;
  capture_id: string;
}

export type UpgradeOrderResponse =
  | UpgradeCreateResponse
  | UpgradeCaptureResponse;

// ── Subscription types ────────────────────────────────────────

export interface PayPalSubscription {
  id: string;
  paypal_sub_id: string;
  paypal_plan_id: string;
  status:
    | "APPROVAL_PENDING"
    | "APPROVED"
    | "ACTIVE"
    | "SUSPENDED"
    | "CANCELLED"
    | "EXPIRED";
  next_billing_time: string | null;
  last_payment_amount: string;
  last_payment_time: string | null;
  created_at: string;
}

export interface CreateSubscriptionRequest {
  plan: number;
  billing_cycle: BillingCycle;
  currency: PayPalCurrency;
  return_url?: string;
  cancel_url?: string;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  paypal_sub_id: string;
  approval_url: string;
  message: string;
}

export interface CancelSubscriptionRequest {
  otp_code: string;
}

// ── Mutation result types ─────────────────────────────────────

type CreateOrderMutationResult = UseMutationResult<
  ApiResponse<CreateOrderResponse>,
  Error,
  CreateOrderRequest
>;

type CaptureOrderMutationResult = UseMutationResult<
  ApiResponse<CaptureOrderResponse>,
  Error,
  CaptureOrderRequest
>;

type UpgradeOrderMutationResult = UseMutationResult<
  ApiResponse<UpgradeOrderResponse>,
  Error,
  UpgradeOrderRequest
>;

type CreateSubscriptionMutationResult = UseMutationResult<
  ApiResponse<CreateSubscriptionResponse>,
  Error,
  CreateSubscriptionRequest
>;

type CancelSubscriptionMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  CancelSubscriptionRequest
>;

// ── Mutation options types ────────────────────────────────────

type CreateOrderMutationOptions = UseMutationOptions<
  ApiResponse<CreateOrderResponse>,
  Error,
  CreateOrderRequest
>;

type CaptureOrderMutationOptions = UseMutationOptions<
  ApiResponse<CaptureOrderResponse>,
  Error,
  CaptureOrderRequest
>;

type UpgradeOrderMutationOptions = UseMutationOptions<
  ApiResponse<UpgradeOrderResponse>,
  Error,
  UpgradeOrderRequest
>;

type CreateSubscriptionMutationOptions = UseMutationOptions<
  ApiResponse<CreateSubscriptionResponse>,
  Error,
  CreateSubscriptionRequest
>;

type CancelSubscriptionMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  CancelSubscriptionRequest
>;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/paypal";

const paypalApi = {
  // ── Orders ───────────────────────────────────────────────────

  listOrders: (): Promise<PaginatedResponse<PayPalOrder>> =>
    apiGet<PaginatedResponse<PayPalOrder>>(`${BASE}/orders/`),

  createOrder: (
    data: CreateOrderRequest,
  ): Promise<ApiResponse<CreateOrderResponse>> =>
    apiPost<ApiResponse<CreateOrderResponse>>(`${BASE}/orders/create/`, data),

  captureOrder: (
    data: CaptureOrderRequest,
  ): Promise<ApiResponse<CaptureOrderResponse>> =>
    apiPost<ApiResponse<CaptureOrderResponse>>(`${BASE}/orders/capture/`, data),

  upgradeOrder: (
    data: UpgradeOrderRequest,
  ): Promise<ApiResponse<UpgradeOrderResponse>> =>
    apiPost<ApiResponse<UpgradeOrderResponse>>(`${BASE}/orders/upgrade/`, data),

  // ── Subscriptions ─────────────────────────────────────────────

  mySubscription: (): Promise<ApiResponse<PayPalSubscription | null>> =>
    apiGet<ApiResponse<PayPalSubscription | null>>(`${BASE}/subscriptions/me/`),

  createSubscription: (
    data: CreateSubscriptionRequest,
  ): Promise<ApiResponse<CreateSubscriptionResponse>> =>
    apiPost<ApiResponse<CreateSubscriptionResponse>>(
      `${BASE}/subscriptions/create/`,
      data,
    ),

  cancelSubscription: (
    data: CancelSubscriptionRequest,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> =>
    apiPost<ApiResponse<{ success: boolean; message: string }>>(
      `${BASE}/subscriptions/cancel/`,
      data,
    ),
};

// ─────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────

function useIsVendor(): boolean {
  return useAuthStore((s) => s.isVendor());
}

// ─────────────────────────────────────────────────────────────
// Order history
// ─────────────────────────────────────────────────────────────

export function usePayPalOrders(
  options?: Partial<UseQueryOptions<PaginatedResponse<PayPalOrder>>>,
): UseQueryResult<PaginatedResponse<PayPalOrder>> {
  const isVendor = useIsVendor();

  return useQuery({
    queryKey: QK.paypalOrders(),
    queryFn: paypalApi.listOrders,
    staleTime: STALE.DEFAULT,
    enabled: isVendor,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Active PayPal subscription
// ─────────────────────────────────────────────────────────────

export function useMyPayPalSubscription(
  options?: Partial<UseQueryOptions<ApiResponse<PayPalSubscription | null>>>,
): UseQueryResult<ApiResponse<PayPalSubscription | null>> {
  const isVendor = useIsVendor();

  return useQuery({
    queryKey: QK.paypalSubscription(),
    queryFn: paypalApi.mySubscription,
    staleTime: STALE.DEFAULT,
    enabled: isVendor,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Create order (activation step 1)
// ─────────────────────────────────────────────────────────────

export function useCreatePayPalOrder(
  options?: CreateOrderMutationOptions,
): CreateOrderMutationResult {
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => paypalApi.createOrder(data),

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Capture order (activation step 2)
// ─────────────────────────────────────────────────────────────

export function useCapturePayPalOrder(
  options?: CaptureOrderMutationOptions,
): CaptureOrderMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CaptureOrderRequest) => paypalApi.captureOrder(data),

    onSuccess: () => {
      toast.success("Payment captured. Your plan is now active.");
      qc.invalidateQueries({ queryKey: QK.subscription() });
      qc.invalidateQueries({ queryKey: QK.vendorSubscription() });
      qc.invalidateQueries({ queryKey: QK.paypalOrders() });
      qc.invalidateQueries({ queryKey: QK.me() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Upgrade order (step=create then step=capture)
// ─────────────────────────────────────────────────────────────

export function useUpgradePayPalOrder(
  options?: UpgradeOrderMutationOptions,
): UpgradeOrderMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: UpgradeOrderRequest) => paypalApi.upgradeOrder(data),

    onSuccess: (_res, variables: UpgradeOrderRequest) => {
      // Only invalidate on the capture step — create step just returns an order ID
      if (variables.step === "capture") {
        toast.success("Plan upgraded successfully.");
        qc.invalidateQueries({ queryKey: QK.subscription() });
        qc.invalidateQueries({ queryKey: QK.vendorSubscription() });
        qc.invalidateQueries({ queryKey: QK.paypalOrders() });
        qc.invalidateQueries({ queryKey: QK.me() });
      }
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Create recurring PayPal subscription
// ─────────────────────────────────────────────────────────────

export function useCreatePayPalSubscription(
  options?: CreateSubscriptionMutationOptions,
): CreateSubscriptionMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubscriptionRequest) =>
      paypalApi.createSubscription(data),

    onSuccess: () => {
      // Subscription is not active yet — buyer still needs to approve on PayPal.
      // Invalidation happens after the webhook activates it.
      toast.success(
        "Redirecting to PayPal. Your plan will activate after approval.",
      );
      qc.invalidateQueries({ queryKey: QK.paypalSubscription() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Cancel recurring PayPal subscription
// ─────────────────────────────────────────────────────────────

export function useCancelPayPalSubscription(
  options?: CancelSubscriptionMutationOptions,
): CancelSubscriptionMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CancelSubscriptionRequest) =>
      paypalApi.cancelSubscription(data),

    onSuccess: () => {
      toast.success("PayPal subscription cancelled.");
      qc.invalidateQueries({ queryKey: QK.paypalSubscription() });
      qc.invalidateQueries({ queryKey: QK.subscription() });
      qc.invalidateQueries({ queryKey: QK.vendorSubscription() });
      qc.invalidateQueries({ queryKey: QK.me() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — PayPal payment management page
// ─────────────────────────────────────────────────────────────

interface VendorPayPalHook {
  orders: UseQueryResult<PaginatedResponse<PayPalOrder>>;
  subscription: UseQueryResult<ApiResponse<PayPalSubscription | null>>;
  createOrder: CreateOrderMutationResult;
  captureOrder: CaptureOrderMutationResult;
  upgradeOrder: UpgradeOrderMutationResult;
  createSubscription: CreateSubscriptionMutationResult;
  cancelSubscription: CancelSubscriptionMutationResult;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
}

export function useVendorPaypal(): VendorPayPalHook {
  const orders = usePayPalOrders();
  const subscription = useMyPayPalSubscription();
  const createOrder = useCreatePayPalOrder();
  const captureOrder = useCapturePayPalOrder();
  const upgradeOrder = useUpgradePayPalOrder();
  const createSubscription = useCreatePayPalSubscription();
  const cancelSubscription = useCancelPayPalSubscription();

  return {
    orders,
    subscription,
    createOrder,
    captureOrder,
    upgradeOrder,
    createSubscription,
    cancelSubscription,
    isLoading: orders.isLoading || subscription.isLoading,
    isError: orders.isError || subscription.isError,
    isFetching: orders.isFetching || subscription.isFetching,
  };
}
