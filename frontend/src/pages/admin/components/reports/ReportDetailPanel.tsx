// src/pages/admin/reports/components/ReportDetailPanel.tsx

import { X, FileText, Download, AlertTriangle, Loader2 } from "lucide-react";
import { useAdminReportDetail } from "../../../../hooks/admin/useAdminReports";
import { formatDate, formatDateTime} from "../../../../lib/utils";
import { ReportStatusBadge } from "./ReportStatusBadge";

interface ReportDetailPanelProps {
  reportId: string;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
        {title}
      </p>
      <div className="bg-bg-subtle rounded-xl border border-border divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <span className="text-xs text-text-muted shrink-0">{label}</span>
      <div className="text-xs font-medium text-text-primary text-right">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function ReportDetailPanel({
  reportId,
  onClose,
}: ReportDetailPanelProps) {
  const { data, isLoading } = useAdminReportDetail(reportId);
  const report = data?.data;

  const isFailed = report?.status === "failed";
  const isReady = report?.status === "ready";
  const hasFile = isReady && !!report?.file_url;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="
        fixed right-0 top-0 bottom-0 z-50
        w-full sm:w-100
        bg-bg-surface border-l border-border
        flex flex-col shadow-2xl
        animate-in slide-in-from-right duration-200
      "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText size={15} className="text-primary" />
            <span className="font-heading font-bold text-sm text-text-primary">
              Report detail
            </span>
          </div>
          <button
            onClick={onClose}
            className="
              w-7 h-7 rounded-lg border border-border
              flex items-center justify-center
              text-text-muted hover:text-text-primary hover:bg-bg-subtle
              transition-all duration-150
            "
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-bg-muted rounded-xl" />
              ))}
            </div>
          ) : !report ? (
            <p className="text-sm text-text-muted text-center py-10">
              Report not found
            </p>
          ) : (
            <div className="space-y-5">
              {/* ── Overview ── */}
              <Section title="Overview">
                <DetailRow label="ID">
                  <span className="font-mono text-[10px]">
                    {report.id.slice(0, 20)}…
                  </span>
                </DetailRow>
                <DetailRow label="Type">
                  <span className="capitalize">{report.report_type}</span>
                </DetailRow>
                <DetailRow label="Status">
                  <ReportStatusBadge status={report.status} />
                </DetailRow>
              </Section>

              {/* ── Period ── */}
              <Section title="Period">
                <DetailRow label="Start">
                  {formatDate(report.period_start)}
                </DetailRow>
                <DetailRow label="End">
                  {formatDate(report.period_end)}
                </DetailRow>
              </Section>

              {/* ── File info ── */}
              <Section title="File">
                <DetailRow label="Size">
                  {report.file_size_kb > 0 ? `${report.file_size_kb} KB` : "—"}
                </DetailRow>
                <DetailRow label="Generated at">
                  {report.generated_at
                    ? formatDateTime(report.generated_at)
                    : "—"}
                </DetailRow>
                <DetailRow label="Created at">
                  {formatDateTime(report.created_at)}
                </DetailRow>
              </Section>

              {/* ── Error detail (failed only) ── */}
              {isFailed && report.error_detail && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Error detail
                  </p>
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-error-subtle border border-error-muted">
                    <AlertTriangle
                      size={14}
                      className="text-error shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-error leading-relaxed font-mono break-all">
                      {report.error_detail}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Download button (ready only) ── */}
              {hasFile && (
                <a
                  href={report.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    w-full inline-flex items-center justify-center gap-2
                    py-3 rounded-xl bg-primary text-white
                    text-sm font-semibold
                    hover:bg-primary-hover shadow-sm
                    transition-all duration-150 active:scale-95
                  "
                >
                  <Download size={15} />
                  Download PDF
                </a>
              )}

              {/* Generating state */}
              {report.status === "generating" && (
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-info-subtle border border-info-muted">
                  <Loader2 size={14} className="text-info animate-spin" />
                  <p className="text-xs font-medium text-info">
                    Report is being generated…
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
