// src/pages/admin/products/components/LowStockAlert.tsx

import { useState } from "react";
import { AlertTriangle, ChevronDown, Package } from "lucide-react";
import { useAdminLowStockProducts } from "../../../../hooks/admin/useAdminProduct";
import { formatCurrency, cn } from "../../../../lib/utils";

interface LowStockAlertProps {
  onSelect: (id: string) => void;
}

export function LowStockAlert({ onSelect }: LowStockAlertProps) {
  const [open, setOpen] = useState(true);
  const { data, isLoading } = useAdminLowStockProducts();

  const items = data?.results ?? [];
  const count = data?.count ?? 0;

  if (!isLoading && count === 0) return null;

  return (
    <div className="border border-warning-muted rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-warning-subtle hover:bg-warning-subtle/80 transition-colors duration-150"
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={14} className="text-warning shrink-0" />
          <span className="text-sm font-semibold text-warning">
            Low stock products
          </span>
          {!isLoading && (
            <span className="w-5 h-5 rounded-full bg-warning text-white text-[10px] font-bold flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "text-warning transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* List */}
      {open && (
        <div className="divide-y divide-warning-muted bg-bg-surface">
          {isLoading ? (
            <div className="px-4 py-3 space-y-2 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-3 bg-bg-muted rounded-full w-3/4" />
              ))}
            </div>
          ) : (
            items.map((product) => (
              <button
                key={product.id}
                onClick={() => onSelect(product.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-warning-subtle transition-colors duration-100 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-7 h-7 rounded-lg object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-bg-subtle border border-border flex items-center justify-center shrink-0">
                      <Package size={12} className="text-text-muted" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {product.name}
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {product.quantity_in_stock} remaining · threshold{" "}
                      {product.low_stock_threshold}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-warning shrink-0 ml-4">
                  {formatCurrency(product.effective_price)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
