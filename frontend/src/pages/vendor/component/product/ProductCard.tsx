// src/pages/vendor/products/components/ProductCard.tsx

// import { Link } from "react-router-dom";
import {
  Package,
  MoreVertical,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Scan,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn, formatCurrency} from "../../../../lib/utils";
import type { ProductListItem } from "../../../../types";

interface ProductCardProps {
  product: ProductListItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  isDeleting: boolean;
  isToggling: boolean;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggle,
  isDeleting,
  isToggling,
}: ProductCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isLowStock = product.is_low_stock;
  const isProcessing = product.processing_status === "processing";
  const isFailed = product.processing_status === "failed";
  const hasDiscount =
    parseFloat(product.effective_price) < parseFloat(product.selling_price);

  return (
    <div
      className={cn(
        "bg-bg-surface rounded-2xl border transition-all duration-200 overflow-hidden group",
        "hover:shadow-md hover:border-primary-muted",
        !product.is_active && "opacity-60",
        isLowStock ? "border-warning-muted" : "border-border",
      )}
    >
      {/* Image / placeholder */}
      <div className="relative bg-bg-subtle aspect-square flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain p-4"
          />
        ) : (
          <Package size={36} className="text-text-muted opacity-30" />
        )}

        {/* Status overlays */}
        {isLowStock && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-warning text-white text-[10px] font-semibold shadow-sm">
            <AlertTriangle size={10} />
            Low stock
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 bg-bg-base/70 flex items-center justify-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-text-muted font-medium">
                Processing
              </span>
            </div>
          </div>
        )}
        {isFailed && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error" />
        )}

        {/* Menu button */}
        <div ref={menuRef} className="absolute top-2 right-2">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="
              w-7 h-7 rounded-lg bg-bg-surface/90 border border-border
              flex items-center justify-center
              text-text-muted hover:text-text-primary
              opacity-0 group-hover:opacity-100
              transition-all duration-150
            "
          >
            <MoreVertical size={13} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute top-full right-0 mt-1 w-40 bg-bg-elevated border border-border rounded-xl shadow-xl overflow-hidden z-10">
              <button
                onClick={() => {
                  onEdit(product.id);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-text-secondary hover:bg-bg-subtle hover:text-text-primary transition-colors duration-150"
              >
                <Edit size={13} />
                Edit product
              </button>
              <button
                onClick={() => {
                  onToggle(product.id, !product.is_active);
                  setMenuOpen(false);
                }}
                disabled={isToggling}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-text-secondary hover:bg-bg-subtle hover:text-text-primary transition-colors duration-150 disabled:opacity-50"
              >
                {product.is_active ? (
                  <>
                    <ToggleLeft size={13} /> Deactivate
                  </>
                ) : (
                  <>
                    <ToggleRight size={13} /> Activate
                  </>
                )}
              </button>
              <div className="h-px bg-border mx-2" />
              <button
                onClick={() => {
                  onDelete(product.id);
                  setMenuOpen(false);
                }}
                disabled={isDeleting}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-error hover:bg-error-subtle transition-colors duration-150 disabled:opacity-50"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-2 flex-1">
            {product.name}
          </h3>
        </div>

        <div className="text-xs text-text-muted mb-2 truncate">
          {product.category_name}
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-text-primary">
              {formatCurrency(product.effective_price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-text-muted line-through">
                {formatCurrency(product.selling_price)}
              </span>
            )}
          </div>
        </div>

        {/* Stock row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                isLowStock
                  ? "bg-warning animate-pulse"
                  : product.quantity_in_stock === 0
                    ? "bg-error"
                    : "bg-success",
              )}
            />
            <span
              className={cn(
                "text-xs font-medium",
                isLowStock ? "text-warning" : "text-text-muted",
              )}
            >
              {product.quantity_in_stock} in stock
            </span>
          </div>

          {/* Barcode chip */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-bg-subtle border border-border">
            <Scan size={9} className="text-text-muted" />
            <span className="text-[9px] font-mono text-text-muted truncate max-w-15">
              {product.barcode}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
