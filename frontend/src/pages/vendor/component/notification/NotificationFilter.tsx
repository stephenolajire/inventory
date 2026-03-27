// src/pages/vendor/notifications/components/NotificationsFilter.tsx

import { X } from "lucide-react";
import { cn } from "../../../../lib/utils";
// import type { NotificationType } from "../../../../types";

interface NotificationsFilterProps {
  isOpen: boolean;
  selectedType: string;
  isRead: string;
  onType: (v: string) => void;
  onIsRead: (v: string) => void;
  onReset: () => void;
  activeCount: number;
}

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All types" },
  { value: "low_stock", label: "Low stock" },
  { value: "daily_summary", label: "Daily summary" },
  { value: "product_ready", label: "Product ready" },
  { value: "product_failed", label: "Product failed" },
  { value: "subscription_activated", label: "Subscription" },
  { value: "subscription_expired", label: "Subscription expired" },
  { value: "plan_upgraded", label: "Plan upgrade" },
  { value: "account_approved", label: "Account approved" },
  { value: "system", label: "System" },
];

const READ_OPTIONS = [
  { value: "", label: "All" },
  { value: "false", label: "Unread only" },
  { value: "true", label: "Read only" },
];

export function NotificationsFilter({
  isOpen,
  selectedType,
  isRead,
  onType,
  onIsRead,
  onReset,
  activeCount,
}: NotificationsFilterProps) {
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
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Type
            </label>
            <select
              value={selectedType}
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

          {/* Read status */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Status
            </label>
            <select
              value={isRead}
              onChange={(e) => onIsRead(e.target.value)}
              className="input text-sm h-9 w-full"
            >
              {READ_OPTIONS.map((opt) => (
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
