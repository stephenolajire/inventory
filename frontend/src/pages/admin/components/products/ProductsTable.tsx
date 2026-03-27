// src/pages/admin/products/components/ProductsTable.tsx

import { Package, ArrowUpRight, Power, Trash2 } from "lucide-react";
import { formatCurrency, cn } from "../../../../lib/utils";
import {
  useAdminToggleProductActive,
  useAdminDeleteProduct,
} from "../../../../hooks/admin/useAdminProduct";
import { ActiveBadge, ProcessingBadge, StockLevel } from "./ProductBadges";
import type { ProductListItem } from "../../../../types";

interface ProductsTableProps {
  products: ProductListItem[];
  loading: boolean;
  selectedId: string | null;
  activeFilters: number;
  onSelect: (id: string) => void;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {/* image */}
      <td className="px-4 py-3">
        <div className="w-9 h-9 bg-bg-muted rounded-xl animate-pulse" />
      </td>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3 bg-bg-muted rounded-full animate-pulse"
            style={{ width: `${40 + ((i * 17) % 45)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export function ProductsTable({
  products,
  loading,
  selectedId,
  activeFilters,
  onSelect,
}: ProductsTableProps) {
  const toggle = useAdminToggleProductActive();
  const remove = useAdminDeleteProduct();

  function handleToggle(e: React.MouseEvent, product: ProductListItem) {
    e.stopPropagation();
    toggle.mutate({ product_id: product.id, active: !product.is_active });
  }

  function handleDelete(e: React.MouseEvent, product: ProductListItem) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`))
      return;
    remove.mutate({ product_id: product.id });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-180">
        <thead>
          <tr className="border-b border-border bg-bg-subtle">
            {["", "Product", "Category", "Stock", "Price", "Status", ""].map(
              (h, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center">
                    <Package size={22} className="text-text-muted opacity-40" />
                  </div>
                  <p className="text-sm font-semibold text-text-primary">
                    No products found
                  </p>
                  <p className="text-xs text-text-muted">
                    {activeFilters > 0
                      ? "Try adjusting your filters"
                      : "Products will appear here once vendors add them"}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr
                key={product.id}
                onClick={() => onSelect(product.id)}
                className={cn(
                  "border-b border-border transition-colors duration-100 cursor-pointer group",
                  selectedId === product.id
                    ? "bg-primary-subtle"
                    : "hover:bg-bg-subtle",
                )}
              >
                {/* Thumbnail */}
                <td className="px-4 py-3 w-14">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-9 h-9 rounded-xl object-cover border border-border"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-bg-subtle border border-border flex items-center justify-center">
                      <Package size={14} className="text-text-muted" />
                    </div>
                  )}
                </td>

                {/* Name + barcode */}
                <td className="px-4 py-3 max-w-50">
                  <p className="text-xs font-semibold text-text-primary truncate">
                    {product.name}
                  </p>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5 truncate">
                    {product.barcode || "—"}
                  </p>
                </td>

                <td className="px-4 py-3 text-xs text-text-muted">
                  {product.category_name || "—"}
                </td>

                <td className="px-4 py-3">
                  <StockLevel
                    quantity={product.quantity_in_stock}
                    isLow={product.is_low_stock}
                  />
                </td>

                <td className="px-4 py-3 text-xs font-bold text-text-primary whitespace-nowrap">
                  {formatCurrency(product.effective_price)}
                </td>

                {/* Active + processing */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <ActiveBadge active={product.is_active} />
                    {product.processing_status !== "active" && (
                      <ProcessingBadge status={product.processing_status} />
                    )}
                  </div>
                </td>

                {/* Inline actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {/* Toggle active */}
                    <button
                      onClick={(e) => handleToggle(e, product)}
                      disabled={toggle.isPending}
                      title={product.is_active ? "Deactivate" : "Activate"}
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150",
                        product.is_active
                          ? "text-text-muted hover:text-warning hover:bg-warning-subtle"
                          : "text-text-muted hover:text-success hover:bg-success-subtle",
                      )}
                    >
                      <Power size={13} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDelete(e, product)}
                      disabled={remove.isPending}
                      title="Delete product"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-error hover:bg-error-subtle transition-all duration-150"
                    >
                      <Trash2 size={13} />
                    </button>

                    <ArrowUpRight
                      size={13}
                      className="text-text-muted ml-0.5"
                    />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
