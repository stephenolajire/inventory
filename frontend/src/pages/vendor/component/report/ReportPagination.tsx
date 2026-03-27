// src/pages/vendor/reports/components/ReportsPagination.tsx

import { ChevronLeft, ChevronRight } from "lucide-react";
// import { cn } from "../../../../lib/utils";

interface ReportsPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPage: (p: number) => void;
  isLoading: boolean;
}

export function ReportsPagination({
  page,
  totalPages,
  totalCount,
  onPage,
  isLoading,
}: ReportsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6">
      <span className="text-xs text-text-muted">
        Page {page} of {totalPages} · {totalCount} reports
      </span>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1 || isLoading}
          className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages || isLoading}
          className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
