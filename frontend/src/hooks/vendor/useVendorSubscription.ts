// src/hooks/useVendorSubscription.ts

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
  SubscriptionPlan,
  ActiveSubscription,
  SelectPlanRequest,
  UpgradePlanRequest,
  DowngradePlanRequest,
  CancelSubscriptionRequest,
  ApiResponse,
  PaginatedResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ReactivatePayload {
  plan:          string;
  billing_cycle: "monthly" | "yearly";
}

interface ProrationPreview {
  current_plan:     string;
  new_plan:         string;
  prorated_amount:  string;
  billing_cycle:    string;
  effective_date:   string;
}

type SelectPlanMutationResult = UseMutationResult<
  ApiResponse<ActiveSubscription>,
  Error,
  SelectPlanRequest
>;

type UpgradeMutationResult = UseMutationResult<
  ApiResponse<ActiveSubscription>,
  Error,
  UpgradePlanRequest
>;

type DowngradeMutationResult = UseMutationResult<
  ApiResponse<ActiveSubscription>,
  Error,
  DowngradePlanRequest
>;

type CancelMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  CancelSubscriptionRequest
>;

type ReactivateMutationResult = UseMutationResult<
  ApiResponse<ActiveSubscription>,
  Error,
  ReactivatePayload
>;

type SelectPlanMutationOptions = UseMutationOptions<
  ApiResponse<ActiveSubscription>,
  Error,
  SelectPlanRequest
>;

type UpgradeMutationOptions = UseMutationOptions<
  ApiResponse<ActiveSubscription>,
  Error,
  UpgradePlanRequest
>;

type DowngradeMutationOptions = UseMutationOptions<
  ApiResponse<ActiveSubscription>,
  Error,
  DowngradePlanRequest
>;

type CancelMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  CancelSubscriptionRequest
>;

type ReactivateMutationOptions = UseMutationOptions<
  ApiResponse<ActiveSubscription>,
  Error,
  ReactivatePayload
>;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/subscriptions";

const subscriptionApi = {

  plans: (): Promise<PaginatedResponse<SubscriptionPlan>> =>
    apiGet<PaginatedResponse<SubscriptionPlan>>(`${BASE}/plans/`),

  me: (): Promise<ApiResponse<ActiveSubscription>> =>
    apiGet<ApiResponse<ActiveSubscription>>(`${BASE}/me/`),

  selectPlan: (
    data: SelectPlanRequest
  ): Promise<ApiResponse<ActiveSubscription>> =>
    apiPost<ApiResponse<ActiveSubscription>>(
      `${BASE}/pay/`,
      data
    ),

  upgrade: (
    data: UpgradePlanRequest
  ): Promise<ApiResponse<ActiveSubscription>> =>
    apiPost<ApiResponse<ActiveSubscription>>(
      `${BASE}/upgrade/`,
      data
    ),

  downgrade: (
    data: DowngradePlanRequest
  ): Promise<ApiResponse<ActiveSubscription>> =>
    apiPost<ApiResponse<ActiveSubscription>>(
      `${BASE}/downgrade/`,
      data
    ),

  cancel: (
    data: CancelSubscriptionRequest
  ): Promise<ApiResponse<{ success: boolean; message: string }>> =>
    apiPost<ApiResponse<{ success: boolean; message: string }>>(
      `${BASE}/cancel/`,
      data
    ),

  reactivate: (
    data: ReactivatePayload
  ): Promise<ApiResponse<ActiveSubscription>> =>
    apiPost<ApiResponse<ActiveSubscription>>(
      `${BASE}/reactivate/`,
      data
    ),

  prorationPreview: (
    new_plan:      string,
    billing_cycle: string
  ): Promise<ApiResponse<ProrationPreview>> =>
    apiGet<ApiResponse<ProrationPreview>>(
      `${BASE}/proration-preview/`,
      { params: { new_plan, billing_cycle } }
    ),
};

// ─────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────

function useIsVendor(): boolean {
  return useAuthStore((s) => s.isVendor());
}

// ─────────────────────────────────────────────────────────────
// All plans — public
// ─────────────────────────────────────────────────────────────

export function useSubscriptionPlans(
  options?: Partial<UseQueryOptions<PaginatedResponse<SubscriptionPlan>>>
): UseQueryResult<PaginatedResponse<SubscriptionPlan>> {
  return useQuery({
    queryKey:  QK.plans(),
    queryFn:   subscriptionApi.plans,
    staleTime: STALE.STATIC,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Current vendor subscription
// ─────────────────────────────────────────────────────────────

export function useMySubscription(
  options?: Partial<UseQueryOptions<ApiResponse<ActiveSubscription>>>
): UseQueryResult<ApiResponse<ActiveSubscription>> {
  const isVendor = useIsVendor();

  return useQuery({
    queryKey:  QK.subscription(),
    queryFn:   subscriptionApi.me,
    staleTime: STALE.DEFAULT,
    enabled:   isVendor,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Proration preview
// ─────────────────────────────────────────────────────────────

export function useProrationPreview(
  new_plan:      string,
  billing_cycle: string,
  options?: Partial<UseQueryOptions<ApiResponse<ProrationPreview>>>
): UseQueryResult<ApiResponse<ProrationPreview>> {
  const isVendor = useIsVendor();

  return useQuery({
    queryKey:  ["subscription", "proration", new_plan, billing_cycle],
    queryFn:   () => subscriptionApi.prorationPreview(new_plan, billing_cycle),
    staleTime: STALE.REALTIME,
    enabled:   isVendor && !!new_plan && !!billing_cycle,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Select / pay for a plan
// ─────────────────────────────────────────────────────────────

export function useSelectPlan(
  options?: SelectPlanMutationOptions
): SelectPlanMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: SelectPlanRequest) =>
      subscriptionApi.selectPlan(data),

    onSuccess: (res) => {
      toast.success("Plan activated successfully.");
      qc.setQueryData(QK.subscription(), res);
      qc.invalidateQueries({ queryKey: QK.vendorSubscription() });
      qc.invalidateQueries({ queryKey: QK.me()                 });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Upgrade plan
// ─────────────────────────────────────────────────────────────

export function useUpgradePlan(
  options?: UpgradeMutationOptions
): UpgradeMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: UpgradePlanRequest) =>
      subscriptionApi.upgrade(data),

    onSuccess: (res) => {
      toast.success("Plan upgraded successfully.");
      qc.setQueryData(QK.subscription(), res);
      qc.invalidateQueries({ queryKey: QK.vendorSubscription() });
      qc.invalidateQueries({ queryKey: QK.me()                 });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Downgrade plan
// ─────────────────────────────────────────────────────────────

export function useDowngradePlan(
  options?: DowngradeMutationOptions
): DowngradeMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: DowngradePlanRequest) =>
      subscriptionApi.downgrade(data),

    onSuccess: (res) => {
      toast.success(
        "Downgrade scheduled. Your current plan remains active until the end of the billing period."
      );
      qc.setQueryData(QK.subscription(), res);
      qc.invalidateQueries({ queryKey: QK.vendorSubscription() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Cancel subscription
// ─────────────────────────────────────────────────────────────

export function useCancelSubscription(
  options?: CancelMutationOptions
): CancelMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CancelSubscriptionRequest) =>
      subscriptionApi.cancel(data),

    onSuccess: () => {
      toast.success("Subscription cancelled.");
      qc.invalidateQueries({ queryKey: QK.subscription()       });
      qc.invalidateQueries({ queryKey: QK.vendorSubscription() });
      qc.invalidateQueries({ queryKey: QK.me()                 });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Reactivate subscription
// ─────────────────────────────────────────────────────────────

export function useReactivateSubscription(
  options?: ReactivateMutationOptions
): ReactivateMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: ReactivatePayload) =>
      subscriptionApi.reactivate(data),

    onSuccess: (res) => {
      toast.success("Subscription reactivated.");
      qc.setQueryData(QK.subscription(), res);
      qc.invalidateQueries({ queryKey: QK.vendorSubscription() });
      qc.invalidateQueries({ queryKey: QK.me()                 });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — subscription management page
// ─────────────────────────────────────────────────────────────

interface VendorSubscriptionHook {
  plans:        UseQueryResult<PaginatedResponse<SubscriptionPlan>>;
  subscription: UseQueryResult<ApiResponse<ActiveSubscription>>;
  selectPlan:   SelectPlanMutationResult;
  upgrade:      UpgradeMutationResult;
  downgrade:    DowngradeMutationResult;
  cancel:       CancelMutationResult;
  reactivate:   ReactivateMutationResult;
  isLoading:    boolean;
  isError:      boolean;
  isFetching:   boolean;
}

export function useVendorSubscription(): VendorSubscriptionHook {
  const plans        = useSubscriptionPlans();
  const subscription = useMySubscription();
  const selectPlan   = useSelectPlan();
  const upgrade      = useUpgradePlan();
  const downgrade    = useDowngradePlan();
  const cancel       = useCancelSubscription();
  const reactivate   = useReactivateSubscription();

  return {
    plans,
    subscription,
    selectPlan,
    upgrade,
    downgrade,
    cancel,
    reactivate,
    isLoading:  plans.isLoading  || subscription.isLoading,
    isError:    plans.isError    || subscription.isError,
    isFetching: plans.isFetching || subscription.isFetching,
  };
}