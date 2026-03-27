// src/pages/vendor/sales/components/SalesHeader.tsx

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn, debounce } from "../../../../lib/utils";

interface SalesHeaderProps {
  search: string;
  onSearch: (v: string) => void;
  onToggleFilter: () => void;
  filterOpen: boolean;
  totalCount: number;
  isLoading: boolean;
}

export function SalesHeader({
  search,
  onSearch,
  onToggleFilter,
  filterOpen,
  totalCount,
  isLoading,
}: SalesHeaderProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = debounce((v: string) => onSearch(v), 400);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalSearch(e.target.value);
    debouncedSearch(e.target.value);
  }

  function clearSearch() {
    setLocalSearch("");
    onSearch("");
  }

  return (
    <div className="mb-6">
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-heading font-extrabold text-xl text-text-primary">
            Sales history
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            {isLoading
              ? "Loading..."
              : `${totalCount.toLocaleString()} transactions`}
          </p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={localSearch}
            onChange={handleChange}
            placeholder="Search by product name..."
            className="input pl-9 pr-9 text-sm h-10 w-full"
          />
          {localSearch && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors duration-150"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={onToggleFilter}
          className={cn(
            "h-10 px-3.5 rounded-xl border text-sm font-medium",
            "flex items-center gap-2 transition-all duration-150",
            filterOpen
              ? "bg-primary-subtle text-primary border-primary-muted"
              : "bg-bg-surface text-text-muted border-border hover:text-text-primary hover:border-border-strong",
          )}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>
    </div>
  );
}
