// src/pages/vendor/reports/components/ReportCard.tsx

import {
  FileText,
  Download,
  Trash2,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import {
  cn,
  formatDate,
  getStatusBadgeClass,
  toTitleCase,
} from "../../../../lib/utils";
import type { ReportListItem } from "../../../../types";

interface ReportCardProps {
  report: ReportListItem;
  onDownload: (report: ReportListItem) => void;
  onDelete: (id: string) => void;
  isDownloading: boolean;
  isDeleting: boolean;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  ready: <CheckCircle2 size={13} />,
  generating: <Loader2 size={13} className="animate-spin" />,
  pending: <Clock size={13} />,
  failed: <AlertCircle size={13} />,
};

export function ReportCard({
  report,
  onDownload,
  onDelete,
  isDownloading,
  isDeleting,
}: ReportCardProps) {
  const isReady = report.status === "ready";
  const isGenerating =
    report.status === "generating" || report.status === "pending";
  const isFailed = report.status === "failed";

  return (
    <div
      className={cn(
        "bg-bg-surface rounded-2xl border transition-all duration-200",
        "hover:shadow-md group",
        isReady
          ? "border-border hover:border-primary-muted"
          : isFailed
            ? "border-error-muted"
            : isGenerating
              ? "border-warning-muted"
              : "border-border",
      )}
    >
      <div className="p-5">
        {/* Top row — icon + type + status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* File icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0",
                isReady
                  ? "bg-error-subtle border-error-muted text-error"
                  : "bg-bg-subtle border-border text-text-muted",
              )}
            >
              <FileText size={18} />
            </div>

            <div>
              {/* Report type badge */}
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full",
                  "text-[10px] font-semibold border capitalize",
                  report.report_type === "monthly"
                    ? "bg-primary-subtle text-primary border-primary-muted"
                    : "bg-info-subtle text-info border-info-muted",
                )}
              >
                {report.report_type}
              </span>

              {/* Period */}
              <p className="text-sm font-semibold text-text-primary mt-1">
                {formatDate(report.period_start, "default")} –{" "}
                {formatDate(report.period_end, "default")}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-semibold border",
              getStatusBadgeClass(report.status),
            )}
          >
            {STATUS_ICON[report.status]}
            {toTitleCase(report.status)}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-text-muted mb-4">
          <span>
            {report.file_size_kb > 0 ? `${report.file_size_kb} KB` : "—"}
          </span>
          <span>
            {report.generated_at
              ? `Generated ${formatDate(report.generated_at, "short")}`
              : isGenerating
                ? "Generating..."
                : "—"}
          </span>
        </div>

        {/* Progress bar for generating */}
        {isGenerating && (
          <div className="mb-4 h-1 bg-bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-warning rounded-full animate-pulse w-2/3" />
          </div>
        )}

        {/* Failed message */}
        {isFailed && (
          <div className="mb-4 flex items-center gap-2 p-2.5 rounded-xl bg-error-subtle border border-error-muted">
            <AlertCircle size={12} className="text-error shrink-0" />
            <span className="text-xs text-error">
              Generation failed. Try generating again.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Download */}
          <button
            onClick={() => onDownload(report)}
            disabled={!isReady || isDownloading}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2",
              "py-2.5 rounded-xl text-xs font-semibold",
              "transition-all duration-150 disabled:cursor-not-allowed",
              isReady && !isDownloading
                ? "bg-primary text-white hover:bg-primary-hover shadow-sm active:scale-95"
                : "bg-bg-subtle text-text-muted border border-border opacity-60",
            )}
          >
            {isDownloading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Downloading...
              </>
            ) : isGenerating ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download size={13} />
                {isReady ? "Download PDF" : toTitleCase(report.status)}
              </>
            )}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(report.id)}
            disabled={isDeleting || isGenerating}
            aria-label="Delete report"
            className="
              w-9 h-9 rounded-xl border border-border
              flex items-center justify-center shrink-0
              text-text-muted hover:text-error hover:border-error-muted hover:bg-error-subtle
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            {isDeleting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
