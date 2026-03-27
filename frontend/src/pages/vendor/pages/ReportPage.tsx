// src/pages/vendor/reports/ReportsPage.tsx

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QK } from "../../../lib/queryClient";
import {
  useReportsList,
  useGenerateWeeklyReport,
  useGenerateMonthlyReport,
  useDeleteReport,
  useDownloadReport,
} from "../../../hooks/vendor/useVendorReport";
import { useAuthStore } from "../../../store/auth.store";
import type { ReportType, ReportStatus } from "../../../types";

// ── Sub-components ──
import { ReportsHeader } from "../component/report/ReportHeader";
import { ReportsFilter } from "../component/report/ReportFilter";
import { ReportCard } from "../component/report/ReportCard";
import { ReportsEmpty } from "../component/report/ReportEmpty";
import { ReportsSkeleton } from "../component/report/ReportSkeleton";
import { ReportsPagination } from "../component/report/ReportPagination";
import { GenerateReportModal } from "../component/report/GenerateReportModal";

// ── Types exported for use in GenerateReportModal ──
export type GenerateWeeklyMutationResult = ReturnType<
  typeof useGenerateWeeklyReport
>;
export type GenerateMonthlyMutationResult = ReturnType<
  typeof useGenerateMonthlyReport
>;

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const qc = useQueryClient();
  const hasReports = useAuthStore((s) => s.hasReports());

  // ── Filter state ──
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Active filter count ──
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (reportType) count++;
    if (status) count++;
    return count;
  }, [reportType, status]);

  // ── Filters ──
  const filters = useMemo(
    () => ({
      report_type: (reportType || undefined) as ReportType | undefined,
      status: (status || undefined) as ReportStatus | undefined,
      page,
    }),
    [reportType, status, page],
  );

  // ── Data hooks ──
  const list = useReportsList(filters);
  const generateWeekly = useGenerateWeeklyReport();
  const generateMonthly = useGenerateMonthlyReport();
  const deleteReport = useDeleteReport();
  const { download, downloading } = useDownloadReport();

  // ── Derived ──
  const reports = list.data?.results ?? [];
  const totalCount = list.data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasFilters = activeFilterCount > 0;

  // ── Handlers ──

  function handleTypeChange(v: string) {
    setReportType(v as ReportType | "");
    setPage(1);
  }

  function handleStatusChange(v: string) {
    setStatus(v as ReportStatus | "");
    setPage(1);
  }

  function handleReset() {
    setReportType("");
    setStatus("");
    setPage(1);
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    setDeletingId(id);
    deleteReport.mutate({ id }, { onSettled: () => setDeletingId(null) });
  }

  function handleRefresh() {
    qc.invalidateQueries({ queryKey: QK.reports.list() });
  }

  return (
    <div className="p-6 lg:p-8 max-w-8xl mx-auto">
      {/* Header */}
      <ReportsHeader
        totalCount={totalCount}
        isLoading={list.isLoading}
        onGenerateOpen={() => setGenerateOpen(true)}
        onRefresh={handleRefresh}
        isFetching={list.isFetching}
      />

      {/* Filter toggle */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className={`
            h-9 px-3.5 rounded-xl border text-xs font-medium
            flex items-center gap-2 transition-all duration-150
            ${
              filterOpen
                ? "bg-primary-subtle text-primary border-primary-muted"
                : "bg-bg-surface text-text-muted border-border hover:text-text-primary"
            }
          `}
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Live status note */}
        {reports.some(
          (r) => r.status === "generating" || r.status === "pending",
        ) && (
          <p className="text-xs text-warning flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            Reports are being generated. This page auto-refreshes.
          </p>
        )}
      </div>

      {/* Filters */}
      <ReportsFilter
        isOpen={filterOpen}
        reportType={reportType}
        status={status}
        onType={handleTypeChange}
        onStatus={handleStatusChange}
        onReset={handleReset}
        activeCount={activeFilterCount}
      />

      {/* Content */}
      {list.isLoading ? (
        <ReportsSkeleton />
      ) : reports.length === 0 ? (
        <ReportsEmpty
          hasFilters={hasFilters}
          onGenerate={() => setGenerateOpen(true)}
          isPlanLocked={!hasReports}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onDownload={download}
              onDelete={handleDelete}
              isDownloading={downloading === report.id}
              isDeleting={deletingId === report.id && deleteReport.isPending}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <ReportsPagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPage={setPage}
        isLoading={list.isLoading}
      />

      {/* Generate modal */}
      <GenerateReportModal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        generateWeekly={generateWeekly}
        generateMonthly={generateMonthly}
      />
    </div>
  );
}
