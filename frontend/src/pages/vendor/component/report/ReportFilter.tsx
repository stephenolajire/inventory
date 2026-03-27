// src/pages/vendor/reports/components/ReportsFilter.tsx

import { X } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface ReportsFilterProps {
  isOpen: boolean;
  reportType: string;
  status: string;
  onType: (v: string) => void;
  onStatus: (v: string) => void;
  onReset: () => void;
  activeCount: number;
}

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ready", label: "Ready" },
  { value: "generating", label: "Generating" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

export function ReportsFilter({
  isOpen,
  reportType,
  status,
  onType,
  onStatus,
  onReset,
  activeCount,
}: ReportsFilterProps) {
  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-40 opacity-100 mb-5" : "max-h-0 opacity-0",
      )}
    >
      <div className="bg-bg-surface rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Filters
            {activeCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </span>
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs text-error hover:underline"
            >
              <X size={11} />
              Reset
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Report type
            </label>
            <select
              value={reportType}
              onChange={(e) => onType(e.target.value)}
              className="input text-sm h-9 w-full"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => onStatus(e.target.value)}
              className="input text-sm h-9 w-full"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
