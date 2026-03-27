// src/pages/vendor/products/components/ProductsFilter.tsx

import { X } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { Category } from "../../../../types";

interface ProductsFilterProps {
  isOpen: boolean;
  categories: Category[];
  categoryId: string;
  lowStock: boolean;
  ordering: string;
  onCategory: (v: string) => void;
  onLowStock: (v: boolean) => void;
  onOrdering: (v: string) => void;
  onReset: () => void;
  activeCount: number;
}

const ORDER_OPTIONS = [
  { value: "", label: "Default" },
  { value: "name", label: "Name A–Z" },
  { value: "-name", label: "Name Z–A" },
  { value: "-selling_price", label: "Price: High–Low" },
  { value: "selling_price", label: "Price: Low–High" },
  { value: "-quantity_in_stock", label: "Stock: High–Low" },
  { value: "quantity_in_stock", label: "Stock: Low–High" },
  { value: "-created_at", label: "Newest first" },
  { value: "created_at", label: "Oldest first" },
];

export function ProductsFilter({
  isOpen,
  categories,
  categoryId,
  lowStock,
  ordering,
  onCategory,
  onLowStock,
  onOrdering,
  onReset,
  activeCount,
}: ProductsFilterProps) {
  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-100 opacity-100 mb-5" : "max-h-0 opacity-0",
      )}
    >
      <div className="bg-bg-surface rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
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
              Reset filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => onCategory(e.target.value)}
              className="input text-sm h-9 w-full"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Sort by
            </label>
            <select
              value={ordering}
              onChange={(e) => onOrdering(e.target.value)}
              className="input text-sm h-9 w-full"
            >
              {ORDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Low stock toggle */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  checked={lowStock}
                  onChange={(e) => onLowStock(e.target.checked)}
                  className="sr-only peer"
                />
                <div
                  className="
                    w-9 h-5 rounded-full border-2 border-border
                    peer-checked:bg-warning peer-checked:border-warning
                    group-hover:border-warning-muted
                    transition-all duration-150
                  "
                />
                <div
                  className="
                    absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow
                    peer-checked:translate-x-4
                    transition-transform duration-150
                  "
                />
              </div>
              <span className="text-sm text-text-secondary">
                Low stock only
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
