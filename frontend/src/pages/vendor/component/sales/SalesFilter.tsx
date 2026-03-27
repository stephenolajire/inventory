// src/pages/vendor/sales/components/SalesFilter.tsx

import { X } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface SalesFilterProps {
  isOpen: boolean;
  paymentMethod: string;
  fromDate: string;
  toDate: string;
  onPaymentMethod: (v: string) => void;
  onFromDate: (v: string) => void;
  onToDate: (v: string) => void;
  onReset: () => void;
  activeCount: number;
}

const METHOD_OPTIONS = [
  { value: "", label: "All methods" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "transfer", label: "Transfer" },
];

export function SalesFilter({
  isOpen,
  paymentMethod,
  fromDate,
  toDate,
  onPaymentMethod,
  onFromDate,
  onToDate,
  onReset,
  activeCount,
}: SalesFilterProps) {
  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-60 opacity-100 mb-5" : "max-h-0 opacity-0",
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
          {/* Payment method */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Payment method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => onPaymentMethod(e.target.value)}
              className="input text-sm h-9 w-full"
            >
              {METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* From date */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              From date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDate(e.target.value)}
              className="input text-sm h-9 w-full"
            />
          </div>

          {/* To date */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              To date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToDate(e.target.value)}
              className="input text-sm h-9 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
