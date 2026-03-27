// src/pages/admin/products/AdminProductsPage.tsx

import { useState, useCallback } from "react";
import { Package } from "lucide-react";
import { useAdminProducts } from "../../../hooks/admin/useAdminProduct";
import { LowStockAlert } from "../components/products/LowStockAlert";
import {
  ProductsFiltersBar,
  type ProductFiltersState,
} from "../components/products/ProductsFiltersBar";
import { ProductsTable } from "../components/products/ProductsTable";
import { ProductsPagination } from "../components/products/ProductsPagination";
import { ProductDetailPanel } from "../components/products/ProductDetailPanel";
import type { ProductListItem } from "../../../types";

// ─────────────────────────────────────────────────────────────

const EMPTY_FILTERS: ProductFiltersState = {
  search: "",
  category: "",
  is_active: "",
  low_stock: false,
  ordering: "",
  vendor: "",
};

export default function AdminProductsPage() {
  const [filters, setFilters] = useState<ProductFiltersState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Build query params ──
  const queryFilters = {
    ...(filters.search && { search: filters.search }),
    ...(filters.category && { category: filters.category }),
    ...(filters.is_active && { is_active: filters.is_active === "true" }),
    ...(filters.low_stock && { low_stock: true }),
    ...(filters.ordering && { ordering: filters.ordering }),
    ...(filters.vendor && { vendor: filters.vendor }),
    page,
  };

  // ── Query ──
  const productsQuery = useAdminProducts(queryFilters);

  const products = productsQuery.data?.results ?? ([] as ProductListItem[]);
  const total = productsQuery.data?.count ?? 0;
  const totalPages = Math.ceil(total / 20);
  const activeFilters = [
    filters.category,
    filters.is_active,
    filters.low_stock ? "low" : "",
    filters.ordering,
    filters.vendor,
  ].filter(Boolean).length;

  // ── Handlers ──
  const handleFilterChange = useCallback(
    (patch: Partial<ProductFiltersState>) => {
      setFilters((prev) => ({ ...prev, ...patch }));
      setPage(1);
    },
    [],
  );

  function handleClear() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  // ─────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-xl text-text-primary">
            Products
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Platform-wide product catalogue
          </p>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-subtle border border-border">
            <Package size={13} className="text-text-muted" />
            <span className="text-xs font-semibold text-text-primary">
              {total.toLocaleString()} total
            </span>
          </div>
        )}
      </div>

      {/* ── Low stock alert ── */}
      <LowStockAlert onSelect={setSelectedId} />

      {/* ── Table card ── */}
      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
        <ProductsFiltersBar
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClear}
          showFilters={showFilters}
          onToggle={() => setShowFilters((v) => !v)}
        />

        <ProductsTable
          products={products}
          loading={productsQuery.isLoading}
          selectedId={selectedId}
          activeFilters={activeFilters}
          onSelect={setSelectedId}
        />

        <ProductsPagination
          page={page}
          totalPages={totalPages}
          total={total}
          hasNext={!!productsQuery.data?.next}
          hasPrev={!!productsQuery.data?.previous}
          isFetching={productsQuery.isFetching}
          onNext={() => setPage((p) => p + 1)}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
        />
      </div>

      {/* ── Detail panel ── */}
      {selectedId && (
        <ProductDetailPanel
          productId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
