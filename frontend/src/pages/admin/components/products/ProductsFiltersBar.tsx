// src/pages/admin/products/components/ProductsFiltersBar.tsx

import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "../../../../lib/utils";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ProductFiltersState {
  search: string;
  category: string;
  is_active: "true" | "false" | "";
  low_stock: boolean;
  ordering: string;
  vendor: string;
}

interface ProductsFiltersBarProps {
  filters: ProductFiltersState;
  onChange: (patch: Partial<ProductFiltersState>) => void;
  onClear: () => void;
  showFilters: boolean;
  onToggle: () => void;
}

// ─────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const ORDERING_OPTIONS = [
  { value: "", label: "Default" },
  { value: "name", label: "Name A–Z" },
  { value: "-name", label: "Name Z–A" },
  { value: "selling_price", label: "Price low–high" },
  { value: "-selling_price", label: "Price high–low" },
  { value: "quantity_in_stock", label: "Stock low–high" },
  { value: "-quantity_in_stock", label: "Stock high–low" },
  { value: "-created_at", label: "Newest first" },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function ProductsFiltersBar({
  filters,
  onChange,
  onClear,
  showFilters,
  onToggle,
}: ProductsFiltersBarProps) {
  const activeCount = [
    filters.category,
    filters.is_active,
    filters.low_stock ? "low" : "",
    filters.ordering,
    filters.vendor,
  ].filter(Boolean).length;

  return (
    <>
      {/* ── Search + toggle row ── */}
      <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-border">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search products, barcodes…"
            className="input pl-9 pr-4 h-9 text-sm w-full"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Low stock quick toggle */}
        <button
          onClick={() => onChange({ low_stock: !filters.low_stock })}
          className={cn(
            "flex items-center gap-1.5 px-3 h-9 rounded-xl border text-xs font-semibold transition-all duration-150 shrink-0",
            filters.low_stock
              ? "bg-warning-subtle border-warning-muted text-warning"
              : "border-border text-text-muted hover:border-warning-muted hover:text-warning",
          )}
        >
          Low stock
        </button>

        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-1.5 px-3 h-9 rounded-xl border text-xs font-semibold transition-all duration-150 shrink-0",
            showFilters || activeCount > 0
              ? "bg-primary-subtle border-primary-muted text-primary"
              : "border-border text-text-muted hover:border-primary-muted hover:text-text-primary",
          )}
        >
          <SlidersHorizontal size={13} />
          Filters
          {activeCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {(activeCount > 0 || filters.search) && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-2.5 h-9 rounded-xl border border-border text-xs text-text-muted hover:text-error hover:border-error-muted transition-all duration-150 shrink-0"
          >
            <X size={12} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* ── Expanded panel ── */}
      {showFilters && (
        <div className="px-3 sm:px-4 py-4 border-b border-border bg-bg-subtle">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => onChange({ category: e.target.value })}
                placeholder="e.g. Beverages"
                className="input h-9 text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Status
              </label>
              <select
                value={filters.is_active}
                onChange={(e) =>
                  onChange({
                    is_active: e.target.value as "true" | "false" | "",
                  })
                }
                className="input h-9 text-sm w-full"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Sort by
              </label>
              <select
                value={filters.ordering}
                onChange={(e) => onChange({ ordering: e.target.value })}
                className="input h-9 text-sm w-full"
              >
                {ORDERING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Vendor email
              </label>
              <input
                type="text"
                value={filters.vendor}
                onChange={(e) => onChange({ vendor: e.target.value })}
                placeholder="vendor@example.com"
                className="input h-9 text-sm w-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
