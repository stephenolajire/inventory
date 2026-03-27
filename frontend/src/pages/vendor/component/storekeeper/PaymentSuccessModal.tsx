// src/pages/vendor/storekeeper/components/PaymentSuccessModal.tsx

import { CheckCircle2, RotateCcw } from "lucide-react";
import { formatCurrency } from "../../../../lib/utils";
import type { Cart, CartItem, MarkPaidResponse } from "../../../../types";

interface PaymentSuccessModalProps {
  result: MarkPaidResponse;
  cart: Cart; // snapshot captured in StorekeeperPage before cart was cleared
  onClose: () => void;
}

export function PaymentSuccessModal({
  result,
  cart,
  onClose,
}: PaymentSuccessModalProps) {
  // ── Derive correct totals on the frontend ──────────────────────────────
  // result.total_paid from the backend double-counts tax
  // (line_total already includes tax, then tax is added again).
  // We recompute it ourselves the same way printReceipt.ts does.
  const subtotal = cart.items.reduce(
    (sum, item: CartItem) => sum + parseFloat(item.unit_price) * item.quantity,
    0,
  );
  const totalTax = cart.items.reduce(
    (sum, item: CartItem) => sum + parseFloat(item.tax_amount ?? "0"),
    0,
  );
  const correctTotal = subtotal + totalTax;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-bg-surface rounded-3xl border border-border shadow-2xl overflow-hidden">
        {/* ── Success animation ── */}
        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <div className="relative w-20 h-20 mb-5">
            <div className="absolute inset-0 rounded-full bg-success-subtle animate-ping opacity-20" />
            <div className="relative w-20 h-20 rounded-full bg-success-subtle border-2 border-success flex items-center justify-center">
              <CheckCircle2 size={36} className="text-success" />
            </div>
          </div>

          <h3 className="font-heading font-extrabold text-xl text-text-primary mb-1">
            Payment complete!
          </h3>
          <p className="text-sm text-text-muted">
            Sale recorded · receipt printing…
          </p>

          {/* ── Amount + change ── */}
          <div className="mt-5 w-full space-y-2.5">
            <div className="flex items-center justify-between px-4 py-3 bg-bg-subtle rounded-xl">
              <span className="text-xs text-text-muted">Total paid</span>
              <span className="text-sm font-bold text-text-primary">
                {formatCurrency(correctTotal)}
              </span>
            </div>
            {parseFloat(result.change_due) > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-success-subtle border border-success-muted rounded-xl">
                <span className="text-xs font-semibold text-success">
                  Change due
                </span>
                <span className="text-lg font-extrabold text-success font-heading">
                  {formatCurrency(result.change_due)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="px-5 pb-5 space-y-2.5">
          <button
            onClick={onClose}
            className="
              w-full inline-flex items-center justify-center gap-2
              py-3 rounded-xl text-sm font-semibold
              bg-primary text-white hover:bg-primary-hover
              shadow-md transition-all duration-150 active:scale-95
            "
          >
            <RotateCcw size={15} />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
