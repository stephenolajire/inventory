// src/pages/admin/reports/components/GenerateReportModal.tsx

import { useState } from "react";
import { X, Loader2, FilePlus } from "lucide-react";
import { useAdminGenerateReportForVendor } from "../../../../hooks/admin/useAdminReports";
import type { ReportType } from "../../../../types";

interface GenerateReportModalProps {
  onClose: () => void;
}

export function GenerateReportModal({ onClose }: GenerateReportModalProps) {
  const [vendorId, setVendorId] = useState("");
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const generate = useAdminGenerateReportForVendor({
    onSuccess: onClose,
  });

  const canSubmit =
    vendorId.trim() &&
    periodStart &&
    periodEnd &&
    periodEnd >= periodStart &&
    !generate.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    generate.mutate({
      vendor_id: vendorId.trim(),
      report_type: reportType,
      period_start: periodStart,
      period_end: periodEnd,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <FilePlus size={15} className="text-primary" />
            <span className="font-heading font-bold text-sm text-text-primary">
              Generate report
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {/* Vendor ID */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Vendor ID <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              placeholder="e.g. a1b2c3d4-…"
              className="input h-9 text-sm w-full font-mono"
              required
            />
          </div>

          {/* Report type */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Report type <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["weekly", "monthly"] as ReportType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setReportType(t)}
                  className={`
                    py-2 rounded-xl border-2 text-xs font-semibold capitalize
                    transition-all duration-150
                    ${
                      reportType === t
                        ? "border-primary bg-primary-subtle text-primary"
                        : "border-border text-text-muted hover:border-primary-muted"
                    }
                  `}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Period start <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="input h-9 text-sm w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Period end <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                min={periodStart || undefined}
                className="input h-9 text-sm w-full"
                required
              />
            </div>
          </div>

          {periodStart && periodEnd && periodEnd < periodStart && (
            <p className="text-xs text-error -mt-1">
              End date must be after start date
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 py-2.5 rounded-xl border border-border
                text-xs font-medium text-text-muted
                hover:text-text-primary hover:bg-bg-subtle
                transition-all duration-150
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="
                flex-1 inline-flex items-center justify-center gap-1.5
                py-2.5 rounded-xl bg-primary text-white
                text-xs font-semibold
                hover:bg-primary-hover shadow-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150
              "
            >
              {generate.isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <FilePlus size={13} /> Generate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
