// src/hooks/admin/useAdminVendors.ts

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
  VendorListItem,
  VendorDetail,
  VendorApproveRequest,
  VendorRejectRequest,
  ApiResponse,
  PaginatedResponse,
  VendorAnalytics
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AdminVendorFilters {
  search?:        string;
  status?:        string;
  business_type?: string;
  state?:         string;
  page?:          number;
}

interface SuspendVendorPayload {
  vendor_id: string;
  reason:    string;
}

interface ReinstateVendorPayload {
  vendor_id: string;
}

type ApproveMutationResult = UseMutationResult<
  ApiResponse<VendorDetail>,
  Error,
  VendorApproveRequest
>;

type RejectMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  VendorRejectRequest
>;

type SuspendMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  SuspendVendorPayload
>;

type ReinstateMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  ReinstateVendorPayload
>;

type ApproveMutationOptions = UseMutationOptions<
  ApiResponse<VendorDetail>,
  Error,
  VendorApproveRequest
>;

type RejectMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  VendorRejectRequest
>;

type SuspendMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  SuspendVendorPayload
>;

type ReinstateMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  ReinstateVendorPayload
>;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/vendors/admin";

const adminVendorsApi = {
  list: (
    filters?: AdminVendorFilters,
  ): Promise<PaginatedResponse<VendorListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;
    if (filters?.business_type) params.business_type = filters.business_type;
    if (filters?.state) params.state = filters.state;
    if (filters?.page) params.page = filters.page;
    return apiGet<PaginatedResponse<VendorListItem>>(`${BASE}/`, { params });
  },

  detail: (id: string): Promise<ApiResponse<VendorDetail>> =>
    apiGet<ApiResponse<VendorDetail>>(`${BASE}/${id}/`),

  pending: (): Promise<PaginatedResponse<VendorListItem>> =>
    apiGet<PaginatedResponse<VendorListItem>>(`${BASE}/pending/`),

  approve: (
    payload: VendorApproveRequest,
  ): Promise<ApiResponse<VendorDetail>> =>
    apiPost<ApiResponse<VendorDetail>>(
      `${BASE}/${payload.vendor_id}/approve/`,
      {},
    ),

  reject: (
    payload: VendorRejectRequest,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> =>
    apiPost<ApiResponse<{ success: boolean; message: string }>>(
      `${BASE}/${payload.vendor_id}/reject/`,
      { reason: payload.reason },
    ),

  suspend: (
    payload: SuspendVendorPayload,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> =>
    apiPost<ApiResponse<{ success: boolean; message: string }>>(
      `${BASE}/${payload.vendor_id}/suspend/`,
      { reason: payload.reason },
    ),

  reinstate: (
    payload: ReinstateVendorPayload,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> =>
    apiPost<ApiResponse<{ success: boolean; message: string }>>(
      `${BASE}/${payload.vendor_id}/reinstate/`,
      {},
    ),

  analytics: (id: string): Promise<ApiResponse<VendorAnalytics>> =>
    apiGet<ApiResponse<VendorAnalytics>>(`${BASE}/${id}/analytics/`),
};

// ─────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────

function useIsAdmin(): boolean {
  return useAuthStore((s) => s.isAdmin());
}

// ─────────────────────────────────────────────────────────────
// List all vendors
// ─────────────────────────────────────────────────────────────

export function useAdminVendors(
  filters?: AdminVendorFilters,
  options?: Partial<UseQueryOptions<PaginatedResponse<VendorListItem>>>
): UseQueryResult<PaginatedResponse<VendorListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  QK.admin.vendors(filters as object),
    queryFn:   () => adminVendorsApi.list(filters),
    staleTime: STALE.DEFAULT,
    enabled:   isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Single vendor detail
// ─────────────────────────────────────────────────────────────

export function useAdminVendorDetail(
  id:       string,
  options?: Partial<UseQueryOptions<ApiResponse<VendorDetail>>>
): UseQueryResult<ApiResponse<VendorDetail>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  QK.admin.vendor(id),
    queryFn:   () => adminVendorsApi.detail(id),
    staleTime: STALE.DEFAULT,
    enabled:   isAdmin && !!id,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Pending vendors
// ─────────────────────────────────────────────────────────────

export function useAdminPendingVendors(
  options?: Partial<UseQueryOptions<PaginatedResponse<VendorListItem>>>
): UseQueryResult<PaginatedResponse<VendorListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  QK.admin.pendingVendors(),
    queryFn:   adminVendorsApi.pending,
    staleTime: STALE.REALTIME,
    enabled:   isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Approve vendor
// ─────────────────────────────────────────────────────────────

export function useAdminApproveVendor(
  options?: ApproveMutationOptions
): ApproveMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: VendorApproveRequest) =>
      adminVendorsApi.approve(payload),

    onSuccess: (_data, vars) => {
      toast.success("Vendor approved successfully.");
      qc.invalidateQueries({ queryKey: QK.admin.vendor(vars.vendor_id) });
      qc.invalidateQueries({ queryKey: QK.admin.vendors()              });
      qc.invalidateQueries({ queryKey: QK.admin.pendingVendors()       });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Reject vendor
// ─────────────────────────────────────────────────────────────

export function useAdminRejectVendor(
  options?: RejectMutationOptions
): RejectMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: VendorRejectRequest) =>
      adminVendorsApi.reject(payload),

    onSuccess: (_data, vars) => {
      toast.success("Vendor application rejected.");
      qc.invalidateQueries({ queryKey: QK.admin.vendor(vars.vendor_id) });
      qc.invalidateQueries({ queryKey: QK.admin.vendors()              });
      qc.invalidateQueries({ queryKey: QK.admin.pendingVendors()       });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Suspend vendor
// ─────────────────────────────────────────────────────────────

export function useAdminSuspendVendor(
  options?: SuspendMutationOptions
): SuspendMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: SuspendVendorPayload) =>
      adminVendorsApi.suspend(payload),

    onSuccess: (_data, vars) => {
      toast.success("Vendor suspended.");
      qc.invalidateQueries({ queryKey: QK.admin.vendor(vars.vendor_id) });
      qc.invalidateQueries({ queryKey: QK.admin.vendors()              });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Reinstate vendor
// ─────────────────────────────────────────────────────────────

export function useAdminReinstateVendor(
  options?: ReinstateMutationOptions
): ReinstateMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReinstateVendorPayload) =>
      adminVendorsApi.reinstate(payload),

    onSuccess: (_data, vars) => {
      toast.success("Vendor reinstated.");
      qc.invalidateQueries({ queryKey: QK.admin.vendor(vars.vendor_id) });
      qc.invalidateQueries({ queryKey: QK.admin.vendors()              });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

export function useAdminVendorAnalytics(
  id: string,
  options?: Partial<UseQueryOptions<ApiResponse<VendorAnalytics>>>,
): UseQueryResult<ApiResponse<VendorAnalytics>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.admin.vendorAnalytics(id),
    queryFn: () =>
      apiGet<ApiResponse<VendorAnalytics>>(`${BASE}/${id}/analytics/`),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin && !!id,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — admin vendors page
// ─────────────────────────────────────────────────────────────

interface AdminVendorsDashboard {
  vendors:    UseQueryResult<PaginatedResponse<VendorListItem>>;
  pending:    UseQueryResult<PaginatedResponse<VendorListItem>>;
  approve:    ApproveMutationResult;
  reject:     RejectMutationResult;
  suspend:    SuspendMutationResult;
  reinstate:  ReinstateMutationResult;
  isLoading:  boolean;
  isError:    boolean;
  isFetching: boolean;
}

export function useAdminVendorsDashboard(
  filters?: AdminVendorFilters
): AdminVendorsDashboard {
  const vendors   = useAdminVendors(filters);
  const pending   = useAdminPendingVendors();
  const approve   = useAdminApproveVendor();
  const reject    = useAdminRejectVendor();
  const suspend   = useAdminSuspendVendor();
  const reinstate = useAdminReinstateVendor();

  return {
    vendors,
    pending,
    approve,
    reject,
    suspend,
    reinstate,
    isLoading:  vendors.isLoading  || pending.isLoading,
    isError:    vendors.isError    || pending.isError,
    isFetching: vendors.isFetching || pending.isFetching,
  };
}