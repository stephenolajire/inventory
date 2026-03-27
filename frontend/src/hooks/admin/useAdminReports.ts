// src/hooks/admin/useAdminReports.ts

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
  ReportListItem,
  ReportDetail,
  ReportFilters,
  ApiResponse,
  PaginatedResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface GenerateForVendorPayload {
  vendor_id:    string;
  report_type:  "weekly" | "monthly";
  period_start: string;
  period_end:   string;
}

type GenerateMutationResult = UseMutationResult<
  ApiResponse<ReportDetail>,
  Error,
  GenerateForVendorPayload
>;

type GenerateMutationOptions = UseMutationOptions<
  ApiResponse<ReportDetail>,
  Error,
  GenerateForVendorPayload
>;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/reports/admin";

const adminReportsApi = {

  list: (filters?: ReportFilters): Promise<PaginatedResponse<ReportListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.report_type) params.report_type = filters.report_type;
    if (filters?.status)      params.status      = filters.status;
    if (filters?.page)        params.page        = filters.page;
    return apiGet<PaginatedResponse<ReportListItem>>(`${BASE}/`, { params });
  },

  detail: (id: string): Promise<ApiResponse<ReportDetail>> =>
    apiGet<ApiResponse<ReportDetail>>(`${BASE}/${id}/`),

  generateForVendor: (
    payload: GenerateForVendorPayload
  ): Promise<ApiResponse<ReportDetail>> =>
    apiPost<ApiResponse<ReportDetail>>(
      `/reports/admin/generate/${payload.vendor_id}/`,
      {
        report_type:  payload.report_type,
        period_start: payload.period_start,
        period_end:   payload.period_end,
      }
    ),

  failed: (page?: number): Promise<PaginatedResponse<ReportListItem>> =>
    apiGet<PaginatedResponse<ReportListItem>>(
      `${BASE}/failed/`,
      { params: page ? { page } : undefined }
    ),
};

// ─────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────

function useIsAdmin(): boolean {
  return useAuthStore((s) => s.isAdmin());
}

// ─────────────────────────────────────────────────────────────
// List all reports
// ─────────────────────────────────────────────────────────────

export function useAdminReports(
  filters?: ReportFilters,
  options?: Partial<UseQueryOptions<PaginatedResponse<ReportListItem>>>
): UseQueryResult<PaginatedResponse<ReportListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  QK.admin.reports(filters),
    queryFn:   () => adminReportsApi.list(filters),
    staleTime: STALE.DEFAULT,
    enabled:   isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Single report detail
// ─────────────────────────────────────────────────────────────

export function useAdminReportDetail(
  id:       string,
  options?: Partial<UseQueryOptions<ApiResponse<ReportDetail>>>
): UseQueryResult<ApiResponse<ReportDetail>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  QK.reports.detail(id),
    queryFn:   () => adminReportsApi.detail(id),
    staleTime: STALE.DEFAULT,
    enabled:   isAdmin && !!id,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Failed reports
// ─────────────────────────────────────────────────────────────

export function useAdminFailedReports(
  page?:    number,
  options?: Partial<UseQueryOptions<PaginatedResponse<ReportListItem>>>
): UseQueryResult<PaginatedResponse<ReportListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  QK.admin.failedReports(),
    queryFn:   () => adminReportsApi.failed(page),
    staleTime: STALE.REALTIME,
    enabled:   isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Generate report for a specific vendor
// ─────────────────────────────────────────────────────────────

export function useAdminGenerateReportForVendor(
  options?: GenerateMutationOptions
): GenerateMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateForVendorPayload) =>
      adminReportsApi.generateForVendor(payload),

    onSuccess: () => {
      toast.success("Report generation started.");
      qc.invalidateQueries({ queryKey: QK.admin.reports() });
      qc.invalidateQueries({ queryKey: QK.admin.failedReports() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook
// ─────────────────────────────────────────────────────────────

interface AdminReportsDashboard {
  reports:       UseQueryResult<PaginatedResponse<ReportListItem>>;
  failedReports: UseQueryResult<PaginatedResponse<ReportListItem>>;
  generate:      GenerateMutationResult;
  isLoading:     boolean;
  isError:       boolean;
  isFetching:    boolean;
}

export function useAdminReportsDashboard(
  filters?: ReportFilters
): AdminReportsDashboard {
  const reports       = useAdminReports(filters);
  const failedReports = useAdminFailedReports();
  const generate      = useAdminGenerateReportForVendor();

  return {
    reports,
    failedReports,
    generate,
    isLoading:  reports.isLoading  || failedReports.isLoading,
    isError:    reports.isError    || failedReports.isError,
    isFetching: reports.isFetching || failedReports.isFetching,
  };
}