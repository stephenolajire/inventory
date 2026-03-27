// src/pages/vendor/notifications/components/NotificationsPagination.tsx

import { ChevronLeft, ChevronRight } from "lucide-react";

interface NotificationsPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPage: (p: number) => void;
  isLoading: boolean;
}

export function NotificationsPagination({
  page,
  totalPages,
  totalCount,
  onPage,
  isLoading,
}: NotificationsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-5">
      <span className="text-xs text-text-muted">
        Page {page} of {totalPages} · {totalCount.toLocaleString()} total
      </span>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1 || isLoading}
          className="
            w-8 h-8 rounded-xl border border-border
            flex items-center justify-center
            text-text-muted hover:text-text-primary hover:bg-bg-subtle
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          <ChevronLeft size={15} />
        </button>

        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages || isLoading}
          className="
            w-8 h-8 rounded-xl border border-border
            flex items-center justify-center
            text-text-muted hover:text-text-primary hover:bg-bg-subtle
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
