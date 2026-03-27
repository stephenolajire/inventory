// src/pages/vendor/sales/components/SalesPagination.tsx

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface SalesPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPage: (p: number) => void;
  isLoading: boolean;
}

export function SalesPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPage,
  isLoading,
}: SalesPaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  function getPages(): (number | "...")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="flex items-center justify-between mt-5">
      <span className="text-xs text-text-muted">
        Showing {from}–{to} of {totalCount.toLocaleString()}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1 || isLoading}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          <ChevronLeft size={15} />
        </button>

        {getPages().map((p, i) =>
          p === "..." ? (
            <span
              key={`e-${i}`}
              className="w-8 h-8 flex items-center justify-center text-xs text-text-muted"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              disabled={isLoading}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-medium transition-all duration-150",
                p === page
                  ? "bg-primary text-white shadow-md"
                  : "border border-border text-text-muted hover:text-text-primary hover:bg-bg-subtle",
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages || isLoading}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
