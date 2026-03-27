// src/pages/vendor/products/ProductsPage.tsx

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../../../hooks/vendor/useVendorProduct";
import { useCategories } from "../../../hooks/useCategories";
import {
  useToggleProductActive,
  useDeleteProduct,
} from "../../../hooks/useProductActions";
import { ROUTES } from "../../../constants/routes";

import { ProductsHeader } from "../component/product/ProductsHeader";
import { ProductsFilter } from "../component/product/ProductFilter";
import { ProductCard } from "../component/product/ProductCard";
import { ProductsTable } from "../component/product/ProductTable";
import { ProductsPagination } from "../component/product/ProductPagination";
import { ProductsViewToggle } from "../component/product/ProductsViewToggle";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ViewMode = "grid" | "table";

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const navigate = useNavigate();

  // ── Filter state ──
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [ordering, setOrdering] = useState("");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");

  // ── Active filter count ──
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryId) count++;
    if (lowStock) count++;
    if (ordering) count++;
    return count;
  }, [categoryId, lowStock, ordering]);

  // ── Filters object ──
  const filters = useMemo(
    () => ({
      search: search || undefined,
      category: categoryId || undefined,
      low_stock: lowStock || undefined,
      ordering: ordering || undefined,
      page,
    }),
    [search, categoryId, lowStock, ordering, page],
  );

  // ── Data hooks ──
  const products = useProducts(filters);
  const categories = useCategories();
  const toggleActive = useToggleProductActive();
  const deleteProduct = useDeleteProduct();

  // ── Derived ──
  const productList = products.data?.results ?? [];
  const totalCount = products.data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const categoryList = categories.data?.results ?? [];

  // ── Handlers ──
  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function handleCategory(v: string) {
    setCategoryId(v);
    setPage(1);
  }

  function handleLowStock(v: boolean) {
    setLowStock(v);
    setPage(1);
  }

  function handleOrdering(v: string) {
    setOrdering(v);
    setPage(1);
  }

  function handleReset() {
    setCategoryId("");
    setLowStock(false);
    setOrdering("");
    setPage(1);
  }

  function handleEdit(id: string) {
    navigate(`${ROUTES.PRODUCTS}/${id}/edit`);
  }

  function handleDelete(id: string) {
    if (window.confirm("Delete this product? This action cannot be undone.")) {
      deleteProduct.mutate({ id });
    }
  }

  function handleToggle(id: string, active: boolean) {
    toggleActive.mutate({ id, active });
  }

  return (
    <div className="p-6 lg:p-8 max-w-8xl mx-auto">
      {/* Header */}
      <ProductsHeader
        search={search}
        onSearch={handleSearch}
        onToggleFilter={() => setFilterOpen((v) => !v)}
        filterOpen={filterOpen}
        totalCount={totalCount}
        isLoading={products.isLoading}
      />

      {/* Filters */}
      <ProductsFilter
        isOpen={filterOpen}
        categories={categoryList}
        categoryId={categoryId}
        lowStock={lowStock}
        ordering={ordering}
        onCategory={handleCategory}
        onLowStock={handleLowStock}
        onOrdering={handleOrdering}
        onReset={handleReset}
        activeCount={activeFilterCount}
      />

      {/* View toggle row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-text-muted">
          {products.isLoading
            ? "Loading..."
            : `${productList.length} of ${totalCount} shown`}
        </span>
        <ProductsViewToggle view={view} onChange={setView} />
      </div>

      {/* Grid view */}
      {view === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-bg-surface rounded-2xl border border-border animate-pulse overflow-hidden"
                >
                  <div className="aspect-square bg-bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-bg-muted rounded-full" />
                    <div className="h-2.5 bg-bg-muted rounded-full w-2/3" />
                    <div className="h-3 bg-bg-muted rounded-full w-1/2" />
                  </div>
                </div>
              ))
            : productList.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  isDeleting={deleteProduct.isPending}
                  isToggling={toggleActive.isPending}
                />
              ))}
        </div>
      )}

      {/* Table view */}
      {view === "table" && (
        <ProductsTable
          products={productList}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
          isDeleting={deleteProduct.isPending}
          isToggling={toggleActive.isPending}
          isLoading={products.isLoading}
        />
      )}

      {/* Pagination */}
      <ProductsPagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPage={setPage}
        isLoading={products.isLoading}
      />
    </div>
  );
}
