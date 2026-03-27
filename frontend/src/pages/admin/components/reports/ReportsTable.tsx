// src/pages/admin/reports/components/ReportsTable.tsx

import { FileText, ArrowUpRight } from "lucide-react";
import { formatDate, cn } from "../../../../lib/utils";
import { ReportStatusBadge } from "./ReportStatusBadge";
import type { ReportListItem } from "../../../../types";

interface ReportsTableProps {
  reports: ReportListItem[];
  loading: boolean;
  selectedId: string | null;
  activeFilters: number;
  onSelect: (id: string) => void;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3 bg-bg-muted rounded-full animate-pulse"
            style={{ width: `${40 + ((i * 19) % 50)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export function ReportsTable({
  reports,
  loading,
  selectedId,
  activeFilters,
  onSelect,
}: ReportsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-145">
        <thead>
          <tr className="border-b border-border bg-bg-subtle">
            {["Type", "Period", "Status", "Size", "Generated", ""].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : reports.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center">
                    <FileText
                      size={22}
                      className="text-text-muted opacity-40"
                    />
                  </div>
                  <p className="text-sm font-semibold text-text-primary">
                    No reports found
                  </p>
                  <p className="text-xs text-text-muted">
                    {activeFilters > 0
                      ? "Try adjusting your filters"
                      : "Reports will appear here once generated"}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            reports.map((report) => (
              <tr
                key={report.id}
                onClick={() => onSelect(report.id)}
                className={cn(
                  "border-b border-border transition-colors duration-100 cursor-pointer",
                  selectedId === report.id
                    ? "bg-primary-subtle"
                    : "hover:bg-bg-subtle",
                )}
              >
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-primary capitalize">
                    <FileText size={12} className="text-text-muted" />
                    {report.report_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                  {formatDate(report.period_start)} –{" "}
                  {formatDate(report.period_end)}
                </td>
                <td className="px-4 py-3">
                  <ReportStatusBadge status={report.status} />
                </td>
                <td className="px-4 py-3 text-xs text-text-muted">
                  {report.file_size_kb > 0 ? `${report.file_size_kb} KB` : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                  {report.generated_at ? formatDate(report.generated_at) : "—"}
                </td>
                <td className="px-4 py-3 text-text-muted">
                  <ArrowUpRight size={13} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
