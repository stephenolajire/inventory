// src/pages/vendor/reports/components/ReportsHeader.tsx

import { Plus, RefreshCw } from "lucide-react";

interface ReportsHeaderProps {
  totalCount: number;
  isLoading: boolean;
  onGenerateOpen: () => void;
  onRefresh: () => void;
  isFetching: boolean;
}

export function ReportsHeader({
  totalCount,
  isLoading,
  onGenerateOpen,
  onRefresh,
  isFetching,
}: ReportsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading font-extrabold text-xl text-text-primary">
            Reports
          </h1>
          {!isLoading && (
            <span className="px-2 py-0.5 rounded-full bg-bg-subtle border border-border text-xs font-medium text-text-muted">
              {totalCount}
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted mt-0.5">
          Download weekly and monthly PDF reports
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isFetching}
          aria-label="Refresh reports"
          className="
            w-9 h-9 rounded-xl border border-border
            flex items-center justify-center
            text-text-muted hover:text-text-primary hover:bg-bg-subtle
            disabled:opacity-50 transition-all duration-150
          "
        >
          <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
        </button>

        {/* Generate */}
        <button
          onClick={onGenerateOpen}
          className="
            inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-primary text-white text-sm font-semibold
            hover:bg-primary-hover shadow-md
            transition-all duration-150 active:scale-95
          "
        >
          <Plus size={15} />
          Generate report
        </button>
      </div>
    </div>
  );
}
