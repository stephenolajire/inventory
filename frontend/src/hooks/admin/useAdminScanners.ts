// src/hooks/admin/useAdminScanners.ts

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
  ScannerListItem,
  ScannerDetail,
  ScannerVendorView,
  ScannerPoolStats,
  RegisterScannerRequest,
  BulkRegisterScannerRequest,
  BulkRegisterResult,
  RevokeScannerRequest,
  ReassignScannerRequest,
  ScannerFilters,
  ApiResponse,
  PaginatedResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface RevokePayload extends RevokeScannerRequest {
  scanner_id: string;
}

interface ReassignPayload extends ReassignScannerRequest {
  scanner_id: string;
}

interface RetirePayload {
  scanner_id: string;
}

type RegisterMutationResult = UseMutationResult<
  ApiResponse<ScannerDetail>,
  Error,
  RegisterScannerRequest
>;

type BulkRegisterMutationResult = UseMutationResult<
  ApiResponse<BulkRegisterResult>,
  Error,
  BulkRegisterScannerRequest
>;

type RevokeMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  RevokePayload
>;

type ReassignMutationResult = UseMutationResult<
  ApiResponse<ScannerDetail>,
  Error,
  ReassignPayload
>;

type RetireMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  RetirePayload
>;

type RegisterMutationOptions = UseMutationOptions<
  ApiResponse<ScannerDetail>,
  Error,
  RegisterScannerRequest
>;

type BulkRegisterMutationOptions = UseMutationOptions<
  ApiResponse<BulkRegisterResult>,
  Error,
  BulkRegisterScannerRequest
>;

type RevokeMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  RevokePayload
>;

type ReassignMutationOptions = UseMutationOptions<
  ApiResponse<ScannerDetail>,
  Error,
  ReassignPayload
>;

type RetireMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  RetirePayload
>;

// ─────────────────────────────────────────────────────────────
// Local query keys
// ─────────────────────────────────────────────────────────────

const SCANNER_QK = {
  vendorScanner: () => ["vendor", "scanner"] as const,
} as const;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/scanners";

const scannersApi = {
  // ── Admin ──

  adminList: (
    filters?: ScannerFilters,
  ): Promise<PaginatedResponse<ScannerListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.search) params.search = filters.search;
    if (filters?.brand) params.brand = filters.brand;
    return apiGet<PaginatedResponse<ScannerListItem>>(`${BASE}/`, { params });
  },

  /**
   * Returns enriched detail: vendor object (with profile + subscription)
   * and registered_by object instead of plain ID strings.
   */
  adminDetail: (id: string): Promise<ApiResponse<ScannerDetail>> =>
    apiGet<ApiResponse<ScannerDetail>>(`${BASE}/${id}/`),

  available: (): Promise<ApiResponse<ScannerListItem[]>> =>
    apiGet<ApiResponse<ScannerListItem[]>>(`${BASE}/pool/available/`),

  stats: (): Promise<ApiResponse<ScannerPoolStats>> =>
    apiGet<ApiResponse<ScannerPoolStats>>(`${BASE}/stats/`),

  register: (
    data: RegisterScannerRequest,
  ): Promise<ApiResponse<ScannerDetail>> =>
    apiPost<ApiResponse<ScannerDetail>>(`${BASE}/register/`, data),

  bulkRegister: (
    data: BulkRegisterScannerRequest,
  ): Promise<ApiResponse<BulkRegisterResult>> =>
    apiPost<ApiResponse<BulkRegisterResult>>(`${BASE}/register/bulk/`, data),

  revoke: (
    payload: RevokePayload,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> =>
    apiPost<ApiResponse<{ success: boolean; message: string }>>(
      `${BASE}/${payload.scanner_id}/revoke/`,
      { revoke_reason: payload.revoke_reason },
    ),

  reassign: (payload: ReassignPayload): Promise<ApiResponse<ScannerDetail>> =>
    apiPost<ApiResponse<ScannerDetail>>(
      `${BASE}/${payload.scanner_id}/reassign/`,
      { vendor_id: payload.vendor_id },
    ),

  retire: (
    payload: RetirePayload,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> =>
    apiPost<ApiResponse<{ success: boolean; message: string }>>(
      `${BASE}/${payload.scanner_id}/retire/`,
      {},
    ),

  // ── Vendor ──

  vendorScanner: (): Promise<ApiResponse<ScannerVendorView>> =>
    apiGet<ApiResponse<ScannerVendorView>>(`${BASE}/me/`),
};

// ─────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────

function useIsAdmin(): boolean {
  return useAuthStore((s) => s.isAdmin());
}

// ─────────────────────────────────────────────────────────────
// Admin — list scanners
// ─────────────────────────────────────────────────────────────

export function useAdminScanners(
  filters?: ScannerFilters,
  options?: Partial<UseQueryOptions<PaginatedResponse<ScannerListItem>>>,
): UseQueryResult<PaginatedResponse<ScannerListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.scanners.list(filters as object),
    queryFn: () => scannersApi.adminList(filters),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Admin — single scanner detail (enriched)
// ─────────────────────────────────────────────────────────────

export function useAdminScannerDetail(
  id: string,
  options?: Partial<UseQueryOptions<ApiResponse<ScannerDetail>>>,
): UseQueryResult<ApiResponse<ScannerDetail>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.scanners.detail(id),
    queryFn: () => scannersApi.adminDetail(id),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin && !!id,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Admin — available pool
// ─────────────────────────────────────────────────────────────

export function useAdminAvailableScanners(
  options?: Partial<UseQueryOptions<ApiResponse<ScannerListItem[]>>>,
): UseQueryResult<ApiResponse<ScannerListItem[]>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.scanners.available(),
    queryFn: scannersApi.available,
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Admin — pool stats
// ─────────────────────────────────────────────────────────────

export function useAdminScannerStats(
  options?: Partial<UseQueryOptions<ApiResponse<ScannerPoolStats>>>,
): UseQueryResult<ApiResponse<ScannerPoolStats>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.scanners.stats(),
    queryFn: scannersApi.stats,
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Admin — register single scanner
// ─────────────────────────────────────────────────────────────

export function useAdminRegisterScanner(
  options?: RegisterMutationOptions,
): RegisterMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterScannerRequest) => scannersApi.register(data),

    onSuccess: () => {
      toast.success("Scanner registered.");
      qc.invalidateQueries({ queryKey: QK.scanners.all() });
      qc.invalidateQueries({ queryKey: QK.scanners.available() });
      qc.invalidateQueries({ queryKey: QK.scanners.stats() });
    },

    onError: (err: Error) => toast.error(getApiErrorMessage(err)),

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Admin — bulk register scanners
// ─────────────────────────────────────────────────────────────

export function useAdminBulkRegisterScanners(
  options?: BulkRegisterMutationOptions,
): BulkRegisterMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkRegisterScannerRequest) =>
      scannersApi.bulkRegister(data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.scanners.all() });
      qc.invalidateQueries({ queryKey: QK.scanners.available() });
      qc.invalidateQueries({ queryKey: QK.scanners.stats() });
    },

    onError: (err: Error) => toast.error(getApiErrorMessage(err)),

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Admin — revoke scanner
// ─────────────────────────────────────────────────────────────

export function useAdminRevokeScanner(
  options?: RevokeMutationOptions,
): RevokeMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: RevokePayload) => scannersApi.revoke(payload),

    onSuccess: (_data, vars) => {
      toast.success("Scanner revoked.");
      qc.invalidateQueries({ queryKey: QK.scanners.detail(vars.scanner_id) });
      qc.invalidateQueries({ queryKey: QK.scanners.all() });
      qc.invalidateQueries({ queryKey: QK.scanners.available() });
      qc.invalidateQueries({ queryKey: QK.scanners.stats() });
    },

    onError: (err: Error) => toast.error(getApiErrorMessage(err)),

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Admin — reassign scanner
// ─────────────────────────────────────────────────────────────

export function useAdminReassignScanner(
  options?: ReassignMutationOptions,
): ReassignMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReassignPayload) => scannersApi.reassign(payload),

    onSuccess: (_data, vars) => {
      toast.success("Scanner reassigned.");
      qc.invalidateQueries({ queryKey: QK.scanners.detail(vars.scanner_id) });
      qc.invalidateQueries({ queryKey: QK.scanners.all() });
      qc.invalidateQueries({ queryKey: QK.scanners.available() });
      qc.invalidateQueries({ queryKey: QK.scanners.stats() });
    },

    onError: (err: Error) => toast.error(getApiErrorMessage(err)),

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Admin — retire scanner
// ─────────────────────────────────────────────────────────────

export function useAdminRetireScanner(
  options?: RetireMutationOptions,
): RetireMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: RetirePayload) => scannersApi.retire(payload),

    onSuccess: (_data, vars) => {
      toast.success("Scanner retired.");
      qc.invalidateQueries({ queryKey: QK.scanners.detail(vars.scanner_id) });
      qc.invalidateQueries({ queryKey: QK.scanners.all() });
      qc.invalidateQueries({ queryKey: QK.scanners.stats() });
    },

    onError: (err: Error) => toast.error(getApiErrorMessage(err)),

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Vendor — view assigned scanner
// ─────────────────────────────────────────────────────────────

export function useVendorScanner(
  options?: Partial<UseQueryOptions<ApiResponse<ScannerVendorView>>>,
): UseQueryResult<ApiResponse<ScannerVendorView>> {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: SCANNER_QK.vendorScanner(),
    queryFn: scannersApi.vendorScanner,
    staleTime: STALE.STATIC,
    enabled: isAuthenticated,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — admin scanners page
// ─────────────────────────────────────────────────────────────

interface AdminScannersDashboard {
  scanners: UseQueryResult<PaginatedResponse<ScannerListItem>>;
  available: UseQueryResult<ApiResponse<ScannerListItem[]>>;
  stats: UseQueryResult<ApiResponse<ScannerPoolStats>>;
  register: RegisterMutationResult;
  bulkRegister: BulkRegisterMutationResult;
  revoke: RevokeMutationResult;
  reassign: ReassignMutationResult;
  retire: RetireMutationResult;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
}

export function useAdminScannersDashboard(
  filters?: ScannerFilters,
): AdminScannersDashboard {
  const scanners = useAdminScanners(filters);
  const available = useAdminAvailableScanners();
  const stats = useAdminScannerStats();
  const register = useAdminRegisterScanner();
  const bulkRegister = useAdminBulkRegisterScanners();
  const revoke = useAdminRevokeScanner();
  const reassign = useAdminReassignScanner();
  const retire = useAdminRetireScanner();

  return {
    scanners,
    available,
    stats,
    register,
    bulkRegister,
    revoke,
    reassign,
    retire,
    isLoading: scanners.isLoading || stats.isLoading,
    isError: scanners.isError || stats.isError,
    isFetching: scanners.isFetching || stats.isFetching,
  };
}
