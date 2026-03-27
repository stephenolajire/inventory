// src/hooks/admin/useAdminSubscriptions.ts

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
import type {
  AdminSubscriptionListItem,
  ActiveSubscription,
  SubscriptionStats,
  RevenueStats,
  RevenueFilters,
  PaymentRecord,
  PaymentFilters,
  ApiResponse,
  PaginatedResponse,
  PlanName,
  BillingCycle,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AdminSubscriptionFilters {
  plan?: PlanName;
  status?: string;
  billing_cycle?: BillingCycle;
  search?: string;
  page?: number;
}

interface OverridePlanPayload {
  subscription_id: string;
  plan_name: PlanName;
  billing_cycle?: BillingCycle;
  reason: string;
}

interface ExpireSubscriptionPayload {
  subscription_id: string;
  reason: string;
}

type OverrideMutationResult = UseMutationResult<
  ApiResponse<ActiveSubscription>,
  Error,
  OverridePlanPayload
>;

type ExpireMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  ExpireSubscriptionPayload
>;

type OverrideMutationOptions = UseMutationOptions<
  ApiResponse<ActiveSubscription>,
  Error,
  OverridePlanPayload
>;

type ExpireMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  ExpireSubscriptionPayload
>;

// ─────────────────────────────────────────────────────────────
// Local query keys
// ─────────────────────────────────────────────────────────────

const ADMIN_SUB_QK = {
  stats: () => ["admin", "subscriptions", "stats"] as const,
  revenue: (f?: RevenueFilters) => ["admin", "revenue", f ?? {}] as const,
  payments: (f?: PaymentFilters) => ["admin", "payments", f ?? {}] as const,
} as const;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/subscriptions/admin";

const adminSubscriptionsApi = {
  list: (
    filters?: AdminSubscriptionFilters,
  ): Promise<PaginatedResponse<AdminSubscriptionListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.plan) params.plan = filters.plan;
    if (filters?.status) params.status = filters.status;
    if (filters?.billing_cycle) params.billing_cycle = filters.billing_cycle;
    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.page = filters.page;
    return apiGet<PaginatedResponse<AdminSubscriptionListItem>>(`${BASE}/`, {
      params,
    });
  },

  detail: (id: string): Promise<ApiResponse<ActiveSubscription>> =>
    apiGet<ApiResponse<ActiveSubscription>>(`${BASE}/${id}/`),

  stats: (): Promise<ApiResponse<SubscriptionStats>> =>
    apiGet<ApiResponse<SubscriptionStats>>(`${BASE}/stats/`),

  override: (
    payload: OverridePlanPayload,
  ): Promise<ApiResponse<ActiveSubscription>> =>
    apiPost<ApiResponse<ActiveSubscription>>(
      `${BASE}/${payload.subscription_id}/override/`,
      {
        plan_name: payload.plan_name,
        billing_cycle: payload.billing_cycle,
        reason: payload.reason,
      },
    ),

  expire: (
    payload: ExpireSubscriptionPayload,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> =>
    apiPost<ApiResponse<{ success: boolean; message: string }>>(
      `${BASE}/${payload.subscription_id}/expire/`,
      { reason: payload.reason },
    ),

  revenue: (filters?: RevenueFilters): Promise<ApiResponse<RevenueStats>> => {
    const params: Record<string, unknown> = {};
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;
    if (filters?.currency) params.currency = filters.currency;
    return apiGet<ApiResponse<RevenueStats>>(`${BASE}/revenue/`, { params });
  },

  payments: (
    filters?: PaymentFilters,
  ): Promise<PaginatedResponse<PaymentRecord>> => {
    const params: Record<string, unknown> = {};
    if (filters?.plan) params.plan = filters.plan;
    if (filters?.payment_type) params.payment_type = filters.payment_type;
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;
    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.page = filters.page;
    return apiGet<PaginatedResponse<PaymentRecord>>(`${BASE}/payments/`, {
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
// List all subscriptions
// ─────────────────────────────────────────────────────────────

export function useAdminSubscriptions(
  filters?: AdminSubscriptionFilters,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<AdminSubscriptionListItem>>
  >,
): UseQueryResult<PaginatedResponse<AdminSubscriptionListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.admin.subscriptions(filters as object),
    queryFn: () => adminSubscriptionsApi.list(filters),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Single subscription detail
// ─────────────────────────────────────────────────────────────

export function useAdminSubscriptionDetail(
  id: string,
  options?: Partial<UseQueryOptions<ApiResponse<ActiveSubscription>>>,
): UseQueryResult<ApiResponse<ActiveSubscription>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.admin.subscription(id),
    queryFn: () => adminSubscriptionsApi.detail(id),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin && !!id,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Subscription stats
// ─────────────────────────────────────────────────────────────

export function useAdminSubscriptionStats(
  options?: Partial<UseQueryOptions<ApiResponse<SubscriptionStats>>>,
): UseQueryResult<ApiResponse<SubscriptionStats>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ADMIN_SUB_QK.stats(),
    queryFn: adminSubscriptionsApi.stats,
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Override plan
// ─────────────────────────────────────────────────────────────

export function useAdminOverridePlan(
  options?: OverrideMutationOptions,
): OverrideMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: OverridePlanPayload) =>
      adminSubscriptionsApi.override(payload),

    onSuccess: (_data, vars) => {
      toast.success("Plan updated successfully.");
      qc.invalidateQueries({
        queryKey: QK.admin.subscription(vars.subscription_id),
      });
      qc.invalidateQueries({
        queryKey: QK.admin.subscriptions(),
      });
      qc.invalidateQueries({
        queryKey: ADMIN_SUB_QK.stats(),
      });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Force expire
// ─────────────────────────────────────────────────────────────

export function useAdminExpireSubscription(
  options?: ExpireMutationOptions,
): ExpireMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ExpireSubscriptionPayload) =>
      adminSubscriptionsApi.expire(payload),

    onSuccess: (_data, vars) => {
      toast.success("Subscription expired.");
      qc.invalidateQueries({
        queryKey: QK.admin.subscription(vars.subscription_id),
      });
      qc.invalidateQueries({
        queryKey: QK.admin.subscriptions(),
      });
      qc.invalidateQueries({
        queryKey: ADMIN_SUB_QK.stats(),
      });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Revenue breakdown
// ─────────────────────────────────────────────────────────────

export function useAdminRevenue(
  filters?: RevenueFilters,
  options?: Partial<UseQueryOptions<ApiResponse<RevenueStats>>>,
): UseQueryResult<ApiResponse<RevenueStats>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ADMIN_SUB_QK.revenue(filters),
    queryFn: () => adminSubscriptionsApi.revenue(filters),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Payment log
// ─────────────────────────────────────────────────────────────

export function useAdminPayments(
  filters?: PaymentFilters,
  options?: Partial<UseQueryOptions<PaginatedResponse<PaymentRecord>>>,
): UseQueryResult<PaginatedResponse<PaymentRecord>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ADMIN_SUB_QK.payments(filters),
    queryFn: () => adminSubscriptionsApi.payments(filters),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — admin subscriptions page
// ─────────────────────────────────────────────────────────────

interface AdminSubscriptionsDashboard {
  subscriptions: UseQueryResult<PaginatedResponse<AdminSubscriptionListItem>>;
  stats: UseQueryResult<ApiResponse<SubscriptionStats>>;
  revenue: UseQueryResult<ApiResponse<RevenueStats>>;
  payments: UseQueryResult<PaginatedResponse<PaymentRecord>>;
  override: OverrideMutationResult;
  expire: ExpireMutationResult;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
}

export function useAdminSubscriptionsDashboard(
  filters?: AdminSubscriptionFilters,
  revenueFilters?: RevenueFilters,
  paymentFilters?: PaymentFilters,
): AdminSubscriptionsDashboard {
  const subscriptions = useAdminSubscriptions(filters);
  const stats = useAdminSubscriptionStats();
  const revenue = useAdminRevenue(revenueFilters);
  const payments = useAdminPayments(paymentFilters);
  const override = useAdminOverridePlan();
  const expire = useAdminExpireSubscription();

  return {
    subscriptions,
    stats,
    revenue,
    payments,
    override,
    expire,
    isLoading: subscriptions.isLoading || stats.isLoading || revenue.isLoading,
    isError: subscriptions.isError || stats.isError || revenue.isError,
    isFetching:
      subscriptions.isFetching || stats.isFetching || revenue.isFetching,
  };
}
