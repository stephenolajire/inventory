// src/pages/vendor/products/components/EditProductStockModal.tsx

import { useState } from "react";
import { X, Package, Loader2 } from "lucide-react";
import { useUpdateStock } from "../../../../hooks/vendor/useVendorProduct";
import { formatNumber } from "../../../../lib/utils";
import type { ProductDetail } from "../../../../types";

interface EditProductStockModalProps {
  product: ProductDetail;
  isOpen: boolean;
  onClose: () => void;
}

export function EditProductStockModal({
  product,
  isOpen,
  onClose,
}: EditProductStockModalProps) {
  const [quantity, setQuantity] = useState(String(product.quantity_in_stock));
  const updateStock = useUpdateStock();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) return;
    updateStock.mutate(
      { product_id: product.id, quantity_in_stock: qty },
      { onSuccess: onClose },
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Package size={16} className="text-primary" />
            <h3 className="font-heading font-bold text-sm text-text-primary">
              Update stock
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all duration-150"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">
              {product.name}
            </span>
            <br />
            Current stock:{" "}
            <span className="font-semibold">
              {formatNumber(product.quantity_in_stock)}
            </span>{" "}
            units
          </p>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              New quantity <span className="text-error">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input text-sm h-10 w-full"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStock.isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {updateStock.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                "Update stock"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
