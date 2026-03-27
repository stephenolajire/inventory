// src/pages/vendor/reports/components/GenerateReportModal.tsx

import { useState } from "react";
import { X, FileText, Loader2, Calendar } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type {
  GenerateWeeklyMutationResult,
  GenerateMonthlyMutationResult,
} from "../../pages/ReportPage";

type ReportType = "weekly" | "monthly";

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  generateWeekly: GenerateWeeklyMutationResult;
  generateMonthly: GenerateMonthlyMutationResult;
}

// ── Get Monday of the week containing a given date ──
function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

// ── Get start/end of a calendar month ──
function getMonthRange(
  year: number,
  month: number,
): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

// ── Build last N weeks as options ──
function getWeekOptions(n: number) {
  const options: { label: string; start: string; end: string }[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 7);
    const { start, end } = getWeekRange(d);
    const label = i === 0 ? `This week (${start})` : `Week of ${start}`;
    options.push({ label, start, end });
  }
  return options;
}

// ── Build last N months as options ──
function getMonthOptions(n: number) {
  const options: {
    label: string;
    start: string;
    end: string;
    display: string;
  }[] = [];
  const today = new Date();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  for (let i = 0; i < n; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const { start, end } = getMonthRange(year, month);
    const display = `${months[month]} ${year}`;
    options.push({
      label: i === 0 ? `This month (${display})` : display,
      start,
      end,
      display,
    });
  }
  return options;
}

export function GenerateReportModal({
  isOpen,
  onClose,
  generateWeekly,
  generateMonthly,
}: GenerateReportModalProps) {
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(0);

  const weekOptions = getWeekOptions(12);
  const monthOptions = getMonthOptions(24);

  const isPending = generateWeekly.isPending || generateMonthly.isPending;

  function handleGenerate() {
    if (reportType === "weekly") {
      const { start, end } = weekOptions[selectedWeek];
      generateWeekly.mutate(
        { period_start: start, period_end: end },
        { onSuccess: onClose },
      );
    } else {
      const { start, end } = monthOptions[selectedMonth];
      generateMonthly.mutate(
        { period_start: start, period_end: end },
        { onSuccess: onClose },
      );
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-bg-surface rounded-3xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-subtle border border-primary-muted flex items-center justify-center">
              <FileText size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-text-primary">
                Generate report
              </h3>
              <p className="text-xs text-text-muted">
                PDF will be ready in a few minutes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Report type toggle */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">
              Report type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["weekly", "monthly"] as ReportType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={cn(
                    "py-3 rounded-xl border-2 text-sm font-semibold capitalize",
                    "transition-all duration-150",
                    reportType === type
                      ? "border-primary bg-primary-subtle text-primary"
                      : "border-border text-text-muted hover:border-primary-muted hover:text-text-primary",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Period selector */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">
              <Calendar size={11} className="inline mr-1" />
              Select period
            </label>

            {reportType === "weekly" ? (
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="input text-sm h-10 w-full"
              >
                {weekOptions.map((opt, i) => (
                  <option key={opt.start} value={i}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="input text-sm h-10 w-full"
              >
                {monthOptions.map((opt, i) => (
                  <option key={opt.start} value={i}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {/* Selected range preview */}
            <div className="mt-2 flex items-center gap-2 text-xs text-text-muted px-1">
              <span>Period:</span>
              <span className="font-mono text-text-secondary">
                {reportType === "weekly"
                  ? `${weekOptions[selectedWeek].start} → ${weekOptions[selectedWeek].end}`
                  : `${monthOptions[selectedMonth].start} → ${monthOptions[selectedMonth].end}`}
              </span>
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-info-subtle border border-info-muted">
            <div className="w-1.5 h-1.5 rounded-full bg-info mt-1.5 shrink-0" />
            <p className="text-xs text-info leading-relaxed">
              Report generation runs in the background. You will receive a
              notification and can download the PDF from this page once ready.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all duration-150 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-md transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText size={15} />
                Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
