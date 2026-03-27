// src/pages/admin/reports/components/ReportsFiltersBar.tsx

import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { ReportType, ReportStatus } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ReportFiltersState {
  report_type: ReportType | "";
  status: ReportStatus | "";
}

interface ReportsFiltersBarProps {
  filters: ReportFiltersState;
  onChange: (patch: Partial<ReportFiltersState>) => void;
  onClear: () => void;
  showFilters: boolean;
  onToggle: () => void;
}

// ─────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "generating", label: "Generating" },
  { value: "ready", label: "Ready" },
  { value: "failed", label: "Failed" },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function ReportsFiltersBar({
  filters,
  onChange,
  onClear,
  showFilters,
  onToggle,
}: ReportsFiltersBarProps) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      {/* ── Toggle row ── */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-border">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          All reports
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={cn(
              "flex items-center gap-1.5 px-3 h-8 rounded-xl border text-xs font-semibold transition-all duration-150",
              showFilters || activeCount > 0
                ? "bg-primary-subtle border-primary-muted text-primary"
                : "border-border text-text-muted hover:border-primary-muted hover:text-text-primary",
            )}
          >
            <SlidersHorizontal size={12} />
            Filters
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          {activeCount > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 px-2.5 h-8 rounded-xl border border-border text-xs text-text-muted hover:text-error hover:border-error-muted transition-all duration-150"
            >
              <X size={12} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded panel ── */}
      {showFilters && (
        <div className="px-3 sm:px-4 py-4 border-b border-border bg-bg-subtle">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Report type
              </label>
              <select
                value={filters.report_type}
                onChange={(e) =>
                  onChange({ report_type: e.target.value as ReportType | "" })
                }
                className="input h-9 text-sm w-full"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  onChange({ status: e.target.value as ReportStatus | "" })
                }
                className="input h-9 text-sm w-full"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
