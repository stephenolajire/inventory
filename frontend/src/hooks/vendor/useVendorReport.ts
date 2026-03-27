// src/hooks/useVendorReports.ts

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
import { apiGet, apiPost, apiDelete, getApiErrorMessage } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import toast from "react-hot-toast";
import type {
  ReportListItem,
  ReportDetail,
  GenerateReportRequest,
  ReportFilters,
  ReportDownloadResponse,
  ApiResponse,
  PaginatedResponse,
} from "../../types";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface GenerateWeeklyPayload {
  period_start: string;
  period_end:   string;
}

interface GenerateMonthlyPayload {
  period_start: string;
  period_end:   string;
}

interface DeleteReportPayload {
  id: string;
}

type GenerateMutationResult = UseMutationResult<
  ApiResponse<ReportDetail>,
  Error,
  GenerateReportRequest
>;

type GenerateWeeklyMutationResult = UseMutationResult<
  ApiResponse<ReportDetail>,
  Error,
  GenerateWeeklyPayload
>;

type GenerateMonthlyMutationResult = UseMutationResult<
  ApiResponse<ReportDetail>,
  Error,
  GenerateMonthlyPayload
>;

type DeleteMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  DeleteReportPayload
>;

type GenerateMutationOptions = UseMutationOptions<
  ApiResponse<ReportDetail>,
  Error,
  GenerateReportRequest
>;

type GenerateWeeklyMutationOptions = UseMutationOptions<
  ApiResponse<ReportDetail>,
  Error,
  GenerateWeeklyPayload
>;

type GenerateMonthlyMutationOptions = UseMutationOptions<
  ApiResponse<ReportDetail>,
  Error,
  GenerateMonthlyPayload
>;

type DeleteMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean }>,
  Error,
  DeleteReportPayload
>;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/reports";

const reportsApi = {

  list: (
    filters?: ReportFilters
  ): Promise<PaginatedResponse<ReportListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.report_type) params.report_type = filters.report_type;
    if (filters?.status)      params.status      = filters.status;
    if (filters?.page)        params.page        = filters.page;
    return apiGet<PaginatedResponse<ReportListItem>>(
      `${BASE}/`,
      { params }
    );
  },

  detail: (id: string): Promise<ApiResponse<ReportDetail>> =>
    apiGet<ApiResponse<ReportDetail>>(`${BASE}/${id}/`),

  generate: (
    data: GenerateReportRequest
  ): Promise<ApiResponse<ReportDetail>> =>
    apiPost<ApiResponse<ReportDetail>>(`${BASE}/generate/`, data),

  generateWeekly: (
    data: GenerateWeeklyPayload
  ): Promise<ApiResponse<ReportDetail>> =>
    apiPost<ApiResponse<ReportDetail>>(`${BASE}/generate/weekly/`, data),

  generateMonthly: (
    data: GenerateMonthlyPayload
  ): Promise<ApiResponse<ReportDetail>> =>
    apiPost<ApiResponse<ReportDetail>>(`${BASE}/generate/monthly/`, data),

  download: (id: string): Promise<ReportDownloadResponse> =>
    apiGet<ReportDownloadResponse>(`${BASE}/${id}/download/`),

  delete: (id: string): Promise<ApiResponse<{ success: boolean }>> =>
    apiDelete<ApiResponse<{ success: boolean }>>(`${BASE}/${id}/`),
};

// ─────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────

function useIsApproved(): boolean {
  return useAuthStore((s) => s.isApproved());
}

function useHasReports(): boolean {
  return useAuthStore((s) => s.hasReports());
}

// ─────────────────────────────────────────────────────────────
// Reports list
// ─────────────────────────────────────────────────────────────

export function useReportsList(
  filters?:  ReportFilters,
  options?:  Partial<UseQueryOptions<PaginatedResponse<ReportListItem>>>
): UseQueryResult<PaginatedResponse<ReportListItem>> {
  const isApproved  = useIsApproved();
  const hasReports  = useHasReports();

  return useQuery({
    queryKey:  QK.reports.list(filters as object),
    queryFn:   () => reportsApi.list(filters),
    staleTime: STALE.DEFAULT,
    enabled:   isApproved && hasReports,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Report detail
// ─────────────────────────────────────────────────────────────

export function useReportDetail(
  id:       string,
  options?: Partial<UseQueryOptions<ApiResponse<ReportDetail>>>
): UseQueryResult<ApiResponse<ReportDetail>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey:  QK.reports.detail(id),
    queryFn:   () => reportsApi.detail(id),
    staleTime: STALE.DEFAULT,
    enabled:   isApproved && !!id,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Generate report (custom range)
// ─────────────────────────────────────────────────────────────

export function useGenerateReport(
  options?: GenerateMutationOptions
): GenerateMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateReportRequest) =>
      reportsApi.generate(data),

    onSuccess: () => {
      toast.success("Report generation started. We will notify you when it is ready.");
      qc.invalidateQueries({ queryKey: QK.reports.list() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Generate weekly report
// ─────────────────────────────────────────────────────────────

export function useGenerateWeeklyReport(
  options?: GenerateWeeklyMutationOptions
): GenerateWeeklyMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateWeeklyPayload) =>
      reportsApi.generateWeekly(data),

    onSuccess: () => {
      toast.success("Weekly report generation started.");
      qc.invalidateQueries({ queryKey: QK.reports.list() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Generate monthly report
// ─────────────────────────────────────────────────────────────

export function useGenerateMonthlyReport(
  options?: GenerateMonthlyMutationOptions
): GenerateMonthlyMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateMonthlyPayload) =>
      reportsApi.generateMonthly(data),

    onSuccess: () => {
      toast.success("Monthly report generation started.");
      qc.invalidateQueries({ queryKey: QK.reports.list() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Delete report
// ─────────────────────────────────────────────────────────────

export function useDeleteReport(
  options?: DeleteMutationOptions
): DeleteMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteReportPayload) =>
      reportsApi.delete(payload.id),

    onSuccess: () => {
      toast.success("Report deleted.");
      qc.invalidateQueries({ queryKey: QK.reports.list() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Download report — fires the download directly
// ─────────────────────────────────────────────────────────────

import { apiGetBlob } from "../../lib/axios";
export function useDownloadReport() {
  const [downloading, setDownloading] = useState<string | null>(null);

  async function download(report: ReportListItem) {
    if (downloading) return;
    setDownloading(report.id);
    try {
      const blob = await apiGetBlob(`/reports/${report.id}/download/`);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `stocksense-${report.report_type}-${report.period_start}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
    } catch {
      toast.error("Failed to download report. Please try again.");
    } finally {
      setDownloading(null);
    }
  }
  return { download, downloading };
}

// ─────────────────────────────────────────────────────────────
// Composite hook
// ─────────────────────────────────────────────────────────────

interface VendorReportsHook {
  list:             UseQueryResult<PaginatedResponse<ReportListItem>>;
  generate:         GenerateMutationResult;
  generateWeekly:   GenerateWeeklyMutationResult;
  generateMonthly:  GenerateMonthlyMutationResult;
  deleteReport:     DeleteMutationResult;
  download:         (report: ReportListItem) => Promise<void>;
  downloading:      string | null;
  hasReports:       boolean;
  isLoading:        boolean;
  isError:          boolean;
}

export function useVendorReports(
  filters?: ReportFilters
): VendorReportsHook {
  const hasReports       = useHasReports();
  const list             = useReportsList(filters);
  const generate         = useGenerateReport();
  const generateWeekly   = useGenerateWeeklyReport();
  const generateMonthly  = useGenerateMonthlyReport();
  const deleteReport     = useDeleteReport();
  const { download, downloading } = useDownloadReport();

  return {
    list,
    generate,
    generateWeekly,
    generateMonthly,
    deleteReport,
    download,
    downloading,
    hasReports,
    isLoading: list.isLoading,
    isError:   list.isError,
  };
}