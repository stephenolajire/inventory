// src/pages/admin/products/components/ProductsPagination.tsx

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
  isFetching: boolean;
  onNext: () => void;
  onPrev: () => void;
}

export function ProductsPagination({
  page,
  totalPages,
  total,
  hasNext,
  hasPrev,
  isFetching,
  onNext,
  onPrev,
}: ProductsPaginationProps) {
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-subtle">
      <p className="text-xs text-text-muted">
        Page <span className="font-semibold text-text-primary">{page}</span> of{" "}
        <span className="font-semibold text-text-primary">
          {totalPages || 1}
        </span>
        <span className="hidden sm:inline">
          {" "}
          · {total.toLocaleString()} products
        </span>
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={!hasPrev || isFetching}
          className="
            flex items-center gap-1 px-3 py-1.5 rounded-xl
            border border-border text-xs font-medium text-text-muted
            hover:text-text-primary hover:bg-bg-surface
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          <ChevronLeft size={13} />
          <span className="hidden sm:inline">Prev</span>
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext || isFetching}
          className="
            flex items-center gap-1 px-3 py-1.5 rounded-xl
            border border-border text-xs font-medium text-text-muted
            hover:text-text-primary hover:bg-bg-surface
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
