// src/pages/vendor/products/components/EditProductDiscountModal.tsx

import { useState } from "react";
import { X, Tag, Loader2, XCircle } from "lucide-react";
import { useUpdateDiscount } from "../../../../hooks/vendor/useVendorProduct";
import { formatCurrency } from "../../../../lib/utils";
import type { ProductDetail } from "../../../../types";

interface EditProductDiscountModalProps {
  product: ProductDetail;
  isOpen: boolean;
  onClose: () => void;
}

export function EditProductDiscountModal({
  product,
  isOpen,
  onClose,
}: EditProductDiscountModalProps) {
  const [price, setPrice] = useState(product.discount_price ?? "");
  const [expiry, setExpiry] = useState(
    product.discount_expires_at?.split("T")[0] ?? "",
  );
  const updateDiscount = useUpdateDiscount();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateDiscount.mutate(
      {
        product_id: product.id,
        discount_price: price ? parseFloat(String(price)) : null,
        discount_expires_at: expiry || null,
      },
      { onSuccess: onClose },
    );
  }

  function handleRemove() {
    updateDiscount.mutate(
      {
        product_id: product.id,
        discount_price: null,
        discount_expires_at: null,
      },
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
            <Tag size={16} className="text-primary" />
            <h3 className="font-heading font-bold text-sm text-text-primary">
              Set discount
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
            Selling price:{" "}
            <span className="font-semibold text-text-primary">
              {formatCurrency(product.selling_price)}
            </span>
          </p>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Discount price (£)
            </label>
            <input
              type="number"
              min={0}
              max={parseFloat(product.selling_price) - 1}
              step="0.01"
              value={String(price)}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="input text-sm h-10 w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Expires on
            </label>
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="input text-sm h-10 w-full"
            />
          </div>

          <div className="flex gap-2 pt-1">
            {/* Remove discount */}
            {product.discount_price && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={updateDiscount.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-error-muted text-error text-xs font-medium hover:bg-error-subtle disabled:opacity-50 transition-all duration-150"
              >
                <XCircle size={13} />
                Remove
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all duration-150"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={updateDiscount.isPending || !price || !expiry}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {updateDiscount.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                "Apply"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
