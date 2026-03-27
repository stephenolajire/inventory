// src/pages/vendor/products/components/EditProductHeader.tsx

import { ArrowLeft, Loader2, Save, Package, Tag } from "lucide-react";
import { cn, getStatusBadgeClass, toTitleCase } from "../../../../lib/utils";
import type { ProductDetail } from "../../../../types";

interface EditProductHeaderProps {
  product: ProductDetail;
  isSubmitting: boolean;
  isDirty: boolean;
  onBack: () => void;
  onSubmit: () => void;
  onStockOpen: () => void;
  onDiscountOpen: () => void;
}

export function EditProductHeader({
  product,
  isSubmitting,
  isDirty,
  onBack,
  onSubmit,
  onStockOpen,
  onDiscountOpen,
}: EditProductHeaderProps) {
  return (
    <div className="mb-6">
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all duration-150"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="font-heading font-extrabold text-xl text-text-primary">
              Edit product
            </h1>
            <p className="text-xs text-text-muted mt-0.5 truncate max-w-xs">
              {product.name}
            </p>
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={isSubmitting || !isDirty}
          className="
            inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-primary text-white text-sm font-semibold
            hover:bg-primary-hover shadow-md
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150 active:scale-95
          "
        >
          {isSubmitting ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save size={15} /> Save changes
            </>
          )}
        </button>
      </div>

      {/* Status + quick action row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Active status */}
        <span
          className={cn(
            "inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold border",
            getStatusBadgeClass(product.is_active ? "active" : "cancelled"),
          )}
        >
          {product.is_active ? "Active" : "Inactive"}
        </span>

        {/* Processing status */}
        {product.processing_status !== "active" && (
          <span
            className={cn(
              "inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold border",
              getStatusBadgeClass(product.processing_status),
            )}
          >
            {toTitleCase(product.processing_status)}
          </span>
        )}

        {/* Low stock badge */}
        {product.is_low_stock && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-warning-subtle text-warning border-warning-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            Low stock
          </span>
        )}

        <div className="flex-1" />

        {/* Quick actions */}
        <button
          onClick={onStockOpen}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-subtle hover:border-border-strong transition-all duration-150"
        >
          <Package size={12} />
          Update stock
        </button>
        <button
          onClick={onDiscountOpen}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-text-muted hover:text-primary hover:bg-primary-subtle hover:border-primary-muted transition-all duration-150"
        >
          <Tag size={12} />
          {product.discount_price ? "Edit discount" : "Set discount"}
        </button>
      </div>
    </div>
  );
}
