// src/pages/vendor/storekeeper/components/CartSummary.tsx

import { formatCurrency } from "../../../../lib/utils";
import type { Cart, CartItem } from "../../../../types";

interface CartSummaryProps {
  cart: Cart;
}

export function CartSummary({ cart }: CartSummaryProps) {
  // ── Derive correct totals from line items ──────────────────────────────
  // cart.subtotal and cart.total_amount from the backend double-count tax
  // (line_total already includes tax, then tax_total is added on top).
  // We recompute everything from the raw item fields instead.
  const subtotal = cart.items.reduce(
    (sum, item: CartItem) => sum + parseFloat(item.unit_price) * item.quantity,
    0,
  );
  const totalTax = cart.items.reduce(
    (sum, item: CartItem) => sum + parseFloat(item.tax_amount ?? "0"),
    0,
  );
  const correctTotal = subtotal + totalTax;
  const hasTax = totalTax > 0;

  return (
    <div className="border-t border-border pt-3 space-y-2">
      {/* Subtotal */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      {/* Tax */}
      {hasTax && (
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Tax</span>
          <span>{formatCurrency(totalTax)}</span>
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-sm font-bold text-text-primary">Total</span>
        <span className="font-heading font-extrabold text-xl text-text-primary">
          {formatCurrency(correctTotal)}
        </span>
      </div>

      {/* Change due — shown after payment set */}
      {cart.change_due !== null && parseFloat(cart.change_due ?? "0") > 0 && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-success-subtle border border-success-muted">
          <span className="text-xs font-semibold text-success">Change due</span>
          <span className="text-sm font-bold text-success">
            {formatCurrency(cart.change_due ?? 0)}
          </span>
        </div>
      )}
    </div>
  );
}
