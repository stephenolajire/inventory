// src/pages/vendor/storekeeper/components/CartItemRow.tsx

import { Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "../../../../lib/utils";
import type { CartItem } from "../../../../types";

interface CartItemRowProps {
  item: CartItem;
  onIncrement: (item: CartItem) => void;
  onDecrement: (item: CartItem) => void;
  onRemove: (item: CartItem) => void;
  isUpdating: boolean;
}

export function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  isUpdating,
}: CartItemRowProps) {
  // Derive pre-tax line total on the frontend.
  // item.line_total from the backend already includes tax,
  // so we recompute it as unit_price × quantity to avoid showing
  // the inflated figure here (tax is shown separately below).
  const lineSubtotal = parseFloat(item.unit_price) * item.quantity;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0 group">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {item.product_name}
        </div>
        <div className="text-xs text-text-muted mt-0.5">
          {formatCurrency(item.unit_price)} each
          {parseFloat(item.tax_rate) > 0 && (
            <span className="ml-2 text-[10px] text-text-muted">
              +{item.tax_rate}% tax
            </span>
          )}
        </div>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onDecrement(item)}
          disabled={isUpdating}
          className="
            w-6 h-6 rounded-lg border border-border
            flex items-center justify-center
            text-text-muted hover:text-error hover:border-error-muted hover:bg-error-subtle
            transition-all duration-150 disabled:opacity-40
          "
        >
          <Minus size={11} />
        </button>

        <span className="w-7 text-center text-sm font-semibold text-text-primary">
          {item.quantity}
        </span>

        <button
          onClick={() => onIncrement(item)}
          disabled={isUpdating}
          className="
            w-6 h-6 rounded-lg border border-border
            flex items-center justify-center
            text-text-muted hover:text-success hover:border-success-muted hover:bg-success-subtle
            transition-all duration-150 disabled:opacity-40
          "
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Line total — pre-tax (unit_price × quantity) */}
      <div className="text-sm font-bold text-text-primary shrink-0 w-20 text-right">
        {formatCurrency(lineSubtotal)}
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item)}
        disabled={isUpdating}
        className="
          w-6 h-6 rounded-lg flex items-center justify-center
          text-text-muted hover:text-error
          opacity-0 group-hover:opacity-100
          transition-all duration-150 disabled:opacity-40
          shrink-0
        "
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
