// src/pages/admin/reports/AdminReportsPage.tsx

import { useState, useCallback } from "react";
import { FilePlus} from "lucide-react";
import { useAdminReports } from "../../../hooks/admin/useAdminReports";
import {
  ReportsFiltersBar,
  type ReportFiltersState,
} from "../components/reports/ReportsFiltersBar";
import { ReportsTable } from "../components/reports/ReportsTable";
import { ReportsPagination } from "../components/reports/ReportsPagination";
import { FailedReportsPanel } from "../components/reports/FailedReportsPanel";
import { GenerateReportModal } from "../components/reports/GenerateReportModal";
import { ReportDetailPanel } from "../components/reports/ReportDetailPanel";
import type { ReportListItem } from "../../../types";

// ─────────────────────────────────────────────────────────────

const EMPTY_FILTERS: ReportFiltersState = {
  report_type: "",
  status: "",
};

export default function AdminReportsPage() {
  const [filters, setFilters] = useState<ReportFiltersState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);

  // ── Build query params ──
  const queryFilters = {
    ...(filters.report_type && { report_type: filters.report_type }),
    ...(filters.status && { status: filters.status }),
    page,
  };

  // ── Query ──
  const reportsQuery = useAdminReports(queryFilters);

  const reports = reportsQuery.data?.results ?? ([] as ReportListItem[]);
  const total = reportsQuery.data?.count ?? 0;
  const totalPages = Math.ceil(total / 20);
  const activeFilters = Object.values(filters).filter(Boolean).length;

  // ── Handlers ──
  const handleFilterChange = useCallback(
    (patch: Partial<ReportFiltersState>) => {
      setFilters((prev) => ({ ...prev, ...patch }));
      setPage(1);
    },
    [],
  );

  function handleClear() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  // ─────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-xl text-text-primary">
            Reports
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Vendor PDF report generation and history
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="
            flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-primary text-white text-sm font-semibold shrink-0
            hover:bg-primary-hover shadow-sm
            transition-all duration-150 active:scale-95
          "
        >
          <FilePlus size={15} />
          <span className="hidden sm:inline">Generate report</span>
          <span className="sm:hidden">Generate</span>
        </button>
      </div>

      {/* ── Failed reports alert ── */}
      <FailedReportsPanel onSelect={setSelectedId} />

      {/* ── Main table card ── */}
      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
        <ReportsFiltersBar
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClear}
          showFilters={showFilters}
          onToggle={() => setShowFilters((v) => !v)}
        />

        <ReportsTable
          reports={reports}
          loading={reportsQuery.isLoading}
          selectedId={selectedId}
          activeFilters={activeFilters}
          onSelect={setSelectedId}
        />

        <ReportsPagination
          page={page}
          totalPages={totalPages}
          total={total}
          hasNext={!!reportsQuery.data?.next}
          hasPrev={!!reportsQuery.data?.previous}
          isFetching={reportsQuery.isFetching}
          onNext={() => setPage((p) => p + 1)}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
        />
      </div>

      {/* ── Generate modal ── */}
      {showGenerate && (
        <GenerateReportModal onClose={() => setShowGenerate(false)} />
      )}

      {/* ── Detail panel ── */}
      {selectedId && (
        <ReportDetailPanel
          reportId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
