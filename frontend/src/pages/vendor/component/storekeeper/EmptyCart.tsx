// src/pages/vendor/storekeeper/components/EmptyCart.tsx

import { Scan, ShoppingCart } from "lucide-react";

interface EmptyCartProps {
  hasCart: boolean;
}

export function EmptyCart({ hasCart }: EmptyCartProps) {
  if (!hasCart) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center">
          <ShoppingCart size={28} className="text-text-muted opacity-40" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary mb-1">
            No cart open
          </p>
          <p className="text-xs text-text-muted">
            Click "New cart" to start a new sale
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center">
        <Scan size={28} className="text-text-muted opacity-40 animate-pulse" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary mb-1">
          Cart is empty
        </p>
        <p className="text-xs text-text-muted">
          Scan a barcode or type it above and press Enter
        </p>
      </div>
    </div>
  );
}
