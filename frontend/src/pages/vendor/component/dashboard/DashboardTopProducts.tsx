// src/pages/vendor/dashboard/components/DashboardTopProducts.tsx

import { Package } from "lucide-react";
import { formatCurrency, formatNumber } from "../../../../lib/utils";
import type { TopProduct } from "../../../../types";

interface DashboardTopProductsProps {
  data: TopProduct[];
  isLoading?: boolean;
}

export function DashboardTopProducts({
  data,
  isLoading,
}: DashboardTopProductsProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-4 w-28 bg-bg-muted rounded-full mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-bg-muted shrink-0" />
              <div className="flex-1 h-3 bg-bg-muted rounded-full" />
              <div className="w-16 h-3 bg-bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 flex flex-col items-center justify-center gap-2 min-h-50">
        <Package size={28} className="text-text-muted opacity-40" />
        <span className="text-xs text-text-muted">No sales data yet</span>
      </div>
    );
  }

  const maxUnits = Math.max(...data.map((p) => p.total_units));

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-bold text-sm text-text-primary">
          Top Products
        </h3>
        <span className="text-xs text-text-muted">by units sold</span>
      </div>

      <div className="space-y-3">
        {data.map((product, i) => (
          <div key={product.product_id ?? i}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-text-muted w-4 shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs font-medium text-text-primary truncate">
                  {product.product_name}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-xs text-text-muted">
                  {formatNumber(product.total_units)} units
                </span>
                <span className="text-xs font-semibold text-text-primary">
                  {formatCurrency(product.total_revenue)}
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${(product.total_units / maxUnits) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
