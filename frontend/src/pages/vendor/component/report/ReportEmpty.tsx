// src/pages/vendor/reports/components/ReportsEmpty.tsx

import { FileText, Plus } from "lucide-react";

interface ReportsEmptyProps {
  hasFilters:     boolean;
  onGenerate:     () => void;
  isPlanLocked:   boolean;
}

export function ReportsEmpty({
  hasFilters,
  onGenerate,
  isPlanLocked,
}: ReportsEmptyProps) {
  if (isPlanLocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center">
          <FileText size={28} className="text-text-muted opacity-40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-text-primary mb-1">
            Reports not available on your plan
          </p>
          <p className="text-xs text-text-muted max-w-xs leading-relaxed">
            Upgrade to the Pro or Enterprise plan to generate weekly and
            monthly PDF reports for your business.
          </p>
        </div>
        <a
          href="/dashboard/subscription"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-md transition-all duration-150"
        >
          Upgrade plan
        </a>
      </div>
    );
  }

  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center">
          <FileText size={24} className="text-text-muted opacity-40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-text-primary">
            No reports match your filters
          </p>
          <p className="text-xs text-text-muted mt-1">
            Try resetting the filters above
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center">
        <FileText size={28} className="text-text-muted opacity-40" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-text-primary mb-1">
          No reports yet
        </p>
        <p className="text-xs text-text-muted">
          Generate your first report to get started
        </p>
      </div>
      <button
        onClick={onGenerate}
        className="
          inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
          bg-primary text-white text-sm font-semibold
          hover:bg-primary-hover shadow-md
          transition-all duration-150 active:scale-95
        "
      >
        <Plus size={15} />
        Generate first report
      </button>
    </div>
  );
}