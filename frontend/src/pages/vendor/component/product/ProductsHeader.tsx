// src/pages/vendor/products/components/ProductsHeader.tsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { ROUTES } from "../../../../constants/routes";
import { cn } from "../../../../lib/utils";
import { debounce } from "../../../../lib/utils";

interface ProductsHeaderProps {
  search: string;
  onSearch: (v: string) => void;
  onToggleFilter: () => void;
  filterOpen: boolean;
  totalCount: number;
  isLoading: boolean;
}

export function ProductsHeader({
  search,
  onSearch,
  onToggleFilter,
  filterOpen,
  totalCount,
  isLoading,
}: ProductsHeaderProps) {
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
            Products
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            {isLoading
              ? "Loading..."
              : `${totalCount.toLocaleString()} products`}
          </p>
        </div>

        <Link
          to={`${ROUTES.PRODUCTS}/new`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-md transition-all duration-150 active:scale-95"
        >
          <Plus size={15} />
          Add product
        </Link>
      </div>

      {/* Search + filter row */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={localSearch}
            onChange={handleChange}
            placeholder="Search products by name or barcode..."
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

        {/* Filter toggle */}
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
