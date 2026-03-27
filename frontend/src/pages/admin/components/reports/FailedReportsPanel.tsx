// src/pages/admin/reports/components/FailedReportsPanel.tsx

import { useState } from "react";
import { AlertTriangle, ChevronDown, FileText } from "lucide-react";
import { useAdminFailedReports } from "../../../../hooks/admin/useAdminReports";
import { formatDate, cn } from "../../../../lib/utils";

interface FailedReportsPanelProps {
  onSelect: (id: string) => void;
}

export function FailedReportsPanel({ onSelect }: FailedReportsPanelProps) {
  const [open, setOpen] = useState(true);
  const { data, isLoading } = useAdminFailedReports();

  const failedReports = data?.results ?? [];
  const count = data?.count ?? 0;

  // Don't render if no failures and not loading
  if (!isLoading && count === 0) return null;

  return (
    <div className="border border-error-muted rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-error-subtle hover:bg-error-subtle/80 transition-colors duration-150"
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={14} className="text-error shrink-0" />
          <span className="text-sm font-semibold text-error">
            Failed reports
          </span>
          {!isLoading && (
            <span className="w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "text-error transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* List */}
      {open && (
        <div className="divide-y divide-error-muted bg-bg-surface">
          {isLoading ? (
            <div className="px-4 py-3 space-y-2 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-3 bg-bg-muted rounded-full w-3/4" />
              ))}
            </div>
          ) : (
            failedReports.map((report) => (
              <button
                key={report.id}
                onClick={() => onSelect(report.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-error-subtle transition-colors duration-100 text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={13} className="text-error shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary capitalize truncate">
                      {report.report_type} report
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {formatDate(report.period_start)} –{" "}
                      {formatDate(report.period_end)}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-text-muted shrink-0 ml-4">
                  View details →
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
