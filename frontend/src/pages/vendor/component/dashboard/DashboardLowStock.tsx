// src/pages/vendor/dashboard/components/DashboardLowStock.tsx

import { Link } from "react-router-dom";
import { AlertTriangle, Package, ArrowRight } from "lucide-react";
import { ROUTES } from "../../../../constants/routes";
import { formatNumber } from "../../../../lib/utils";
import type { ProductListItem } from "../../../../types";

interface DashboardLowStockProps {
  data: ProductListItem[];
  isLoading?: boolean;
}

export function DashboardLowStock({ data, isLoading }: DashboardLowStockProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-4 w-28 bg-bg-muted rounded-full mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-bg-subtle"
            >
              <div className="w-2 h-2 rounded-full bg-bg-muted shrink-0" />
              <div className="flex-1 h-3 bg-bg-muted rounded-full" />
              <div className="w-10 h-3 bg-bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 flex flex-col items-center justify-center gap-2 min-h-40">
        <Package size={24} className="text-success opacity-60" />
        <span className="text-xs text-text-muted text-center">
          All products are well stocked
        </span>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-warning" />
          <h3 className="font-heading font-bold text-sm text-text-primary">
            Low Stock
          </h3>
        </div>
        <Link
          to={ROUTES.PRODUCTS}
          className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
        >
          View all
          <ArrowRight size={11} />
        </Link>
      </div>

      <div className="space-y-2">
        {data.slice(0, 6).map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-warning-subtle border border-warning-muted"
          >
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse shrink-0" />
            <span className="text-xs font-medium text-text-primary flex-1 truncate">
              {product.name}
            </span>
            <span className="text-xs font-bold text-warning shrink-0">
              {formatNumber(product.quantity_in_stock)} left
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
