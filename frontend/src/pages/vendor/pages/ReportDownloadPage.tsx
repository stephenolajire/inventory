import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useReportDetail,
  useDownloadReport,
} from "../../../hooks/vendor/useVendorReport";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  RefreshCw,
} from "lucide-react";

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: "Queued",
    textClass: "text-warning",
    bgClass: "bg-warning-subtle",
    borderClass: "border-[var(--color-warning-muted)]",
    icon: Clock,
    description: "Your report is queued and will begin generating shortly.",
    spin: false,
  },
  generating: {
    label: "Generating",
    textClass: "text-info",
    bgClass: "bg-info-subtle",
    borderClass: "border-[var(--color-info-muted)]",
    icon: Loader2,
    description:
      "Your report is being compiled. This usually takes under a minute.",
    spin: true,
  },
  ready: {
    label: "Ready",
    textClass: "text-success",
    bgClass: "bg-success-subtle",
    borderClass: "border-[var(--color-success-muted)]",
    icon: CheckCircle2,
    description: "Your report is ready to download.",
    spin: false,
  },
  failed: {
    label: "Failed",
    textClass: "text-error",
    bgClass: "bg-error-subtle",
    borderClass: "border-[var(--color-error-muted)]",
    icon: AlertCircle,
    description: "Report generation failed. Please try again.",
    spin: false,
  },
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  monthly: "Monthly Report",
  weekly: "Weekly Report",
  custom: "Custom Report",
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtGenerated(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ReportDownloadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dots, setDots] = useState(".");

  const { data, isLoading, isError } = useReportDetail(id ?? "", {
    refetchInterval: (query) => {
      const s = query.state.data?.data?.status;
      return s === "pending" || s === "generating" ? 3000 : false;
    },
  });

  const { download, downloading } = useDownloadReport();

  const report = data?.data;
  const status = (report?.status ?? "pending") as keyof typeof STATUS_CONFIG;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  useEffect(() => {
    if (status !== "generating" && status !== "pending") return;
    const t = setInterval(
      () => setDots((d) => (d.length >= 3 ? "." : d + ".")),
      500,
    );
    return () => clearInterval(t);
  }, [status]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] font-sans">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-anim { to { transform: rotate(360deg); } }
        @keyframes progressPulse {
          0%   { width: 10%; }
          50%  { width: 72%; }
          100% { width: 88%; }
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1);    opacity: 0.45; }
          50%       { transform: scale(1.22); opacity: 0.1;  }
        }
        .anim-fu   { animation: fadeUp 0.4s ease both; }
        .anim-fu-1 { animation: fadeUp 0.4s 0.07s ease both; }
        .anim-fu-2 { animation: fadeUp 0.4s 0.14s ease both; }
        .anim-fu-3 { animation: fadeUp 0.4s 0.21s ease both; }
        .anim-fu-4 { animation: fadeUp 0.4s 0.28s ease both; }
        .spin      { animation: spin-anim 1s linear infinite; }
        .spin-slow { animation: spin-anim 3s linear infinite; }
        .progress  { animation: progressPulse 7s ease-in-out infinite alternate; }
        .ring      { animation: ringPulse 1.8s ease-in-out infinite; }
      `}</style>

      {/* Green top accent strip */}
      <div className="h-0.75 bg-primary" />

      <main className="flex items-start justify-center px-4 py-14 sm:py-20">
        <div className="w-full max-w-135">
          {/* ── Loading ── */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 size={26} className="spin text-primary" />
              <p className="text-sm text-muted">Loading report…</p>
            </div>
          )}

          {/* ── Error ── */}
          {isError && !isLoading && (
            <div className="anim-fu flex flex-col items-center text-center py-20 gap-5">
              <div className="w-14 h-14 rounded-full bg-error-subtle border border-[var(--color-error-muted)] flex items-center justify-center">
                <AlertCircle size={24} className="text-error" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-extrabold text-primary tracking-tight mb-1.5">
                  Report not found
                </h2>
                <p className="text-sm text-muted max-w-xs leading-relaxed">
                  This report doesn't exist or you don't have access to it.
                </p>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="btn btn-surface btn-sm"
              >
                <ArrowLeft size={13} />
                Go back
              </button>
            </div>
          )}

          {/* ── Report card ── */}
          {report && !isLoading && (
            <>
              {/* Back */}
              <button
                onClick={() => navigate(-1)}
                className="anim-fu inline-flex items-center gap-1.5 text-sm text-muted hover:text-[var(--color-primary)] transition-base mb-8 bg-transparent border-none cursor-pointer p-0"
              >
                <ArrowLeft size={13} />
                Back to Reports
              </button>

              {/* Card */}
              <div className="anim-fu-1 card p-0 overflow-hidden">
                {/* ── Header ── */}
                <div
                  className="px-8 pt-8 pb-7 border-b border-[var(--color-border)]"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-primary-subtle) 0%, var(--color-bg-surface) 65%)",
                  }}
                >
                  {/* Badge */}
                  <span className="badge badge-primary mb-4">
                    <FileText size={9} />
                    {REPORT_TYPE_LABELS[report.report_type] ??
                      report.report_type}
                  </span>

                  {/* Title */}
                  <h1 className="font-heading text-2xl font-extrabold text-primary tracking-tight mb-1">
                    {REPORT_TYPE_LABELS[report.report_type] ?? "Report"}
                  </h1>
                  <p className="text-sm text-muted">
                    {fmt(report.period_start)} — {fmt(report.period_end)}
                  </p>
                </div>

                {/* ── Status ── */}
                <div className="px-8 py-6 border-b border-[var(--color-border)]">
                  <div
                    className={`flex items-center gap-3 rounded-xl px-4 py-3.5 border ${cfg.bgClass} ${cfg.borderClass}`}
                  >
                    {/* Icon + pulse ring */}
                    <div className="relative flex-shrink-0">
                      {(status === "generating" || status === "pending") && (
                        <span
                          className={`absolute inset-[-7px] rounded-full border ${cfg.borderClass} ring`}
                        />
                      )}
                      <StatusIcon
                        size={17}
                        className={`${cfg.textClass} ${cfg.spin ? "spin" : ""}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${cfg.textClass}`}>
                        {cfg.label}
                        {(status === "generating" || status === "pending") && (
                          <span className="text-[var(--color-accent)] ml-0.5 font-normal">
                            {dots}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted mt-0.5 leading-relaxed">
                        {cfg.description}
                      </p>
                    </div>

                    {(status === "generating" || status === "pending") && (
                      <div className="flex items-center gap-1 text-[10px] text-disabled flex-shrink-0">
                        <RefreshCw size={9} className="spin-slow" />
                        <span>auto-refreshing</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {(status === "generating" || status === "pending") && (
                    <div className="mt-3 h-[3px] bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full progress"
                        style={{ width: "10%" }}
                      />
                    </div>
                  )}
                </div>

                {/* ── Meta cards ── */}
                <div className="px-8 py-6 grid grid-cols-2 gap-3 border-b border-[var(--color-border)]">
                  <div className="bg-[var(--color-bg-subtle)] rounded-xl px-4 py-3.5 flex items-center gap-3">
                    <Calendar
                      size={13}
                      className="text-[var(--color-accent)] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="section-label mb-1">Period Start</p>
                      <p className="text-sm font-medium text-primary truncate">
                        {fmt(report.period_start)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[var(--color-bg-subtle)] rounded-xl px-4 py-3.5 flex items-center gap-3">
                    <Calendar
                      size={13}
                      className="text-[var(--color-accent)] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="section-label mb-1">Period End</p>
                      <p className="text-sm font-medium text-primary truncate">
                        {fmt(report.period_end)}
                      </p>
                    </div>
                  </div>

                  {report.generated_at && (
                    <div className="bg-[var(--color-bg-subtle)] rounded-xl px-4 py-3.5 flex items-center gap-3">
                      <Clock size={13} className="text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="section-label mb-1">Generated</p>
                        <p className="text-sm font-medium text-primary truncate">
                          {fmtGenerated(report.generated_at)}
                        </p>
                      </div>
                    </div>
                  )}

                  {report.file_size_kb && (
                    <div className="bg-[var(--color-bg-subtle)] rounded-xl px-4 py-3.5 flex items-center gap-3">
                      <HardDrive
                        size={13}
                        className="text-muted shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="section-label mb-1">File Size</p>
                        <p className="text-sm font-medium text-primary">
                          {report.file_size_kb} KB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Action ── */}
                <div className="px-8 py-6">
                  {status === "ready" && (
                    <button
                      className="anim-fu-3 btn btn-primary btn-lg w-full shadow-brand-md"
                      onClick={() => download(report)}
                      disabled={!!downloading}
                    >
                      {downloading === report.id ? (
                        <>
                          <Loader2 size={15} className="spin" />
                          Downloading…
                        </>
                      ) : (
                        <>
                          <Download size={15} />
                          Download PDF Report
                        </>
                      )}
                    </button>
                  )}

                  {status === "failed" && (
                    <button
                      className="btn btn-surface btn-lg w-full"
                      onClick={() => navigate("/reports")}
                    >
                      <RefreshCw size={14} />
                      Go to Reports & Retry
                    </button>
                  )}

                  {(status === "generating" || status === "pending") && (
                    <p className="text-center text-xs text-muted">
                      This page refreshes automatically — no need to reload
                    </p>
                  )}
                </div>
              </div>

              {/* Report ID */}
              <p className="anim-fu-4 mt-4 text-center text-[11px] text-disabled font-mono tracking-wide">
                ID: {report.id}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
