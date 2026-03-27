// src/pages/vendor/dashboard/components/DashboardRecentSales.tsx

import { Link } from "react-router-dom";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { ROUTES } from "../../../../constants/routes";
import { formatCurrency, formatTime, timeAgo } from "../../../../lib/utils";
import { cn } from "../../../../lib/utils";
import type { SaleListItem } from "../../../../types";

interface DashboardRecentSalesProps {
  data: SaleListItem[];
  isLoading?: boolean;
}

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  transfer: "Transfer",
};

const METHOD_CLASS: Record<string, string> = {
  cash: "bg-success-subtle text-success",
  card: "bg-info-subtle    text-info",
  transfer: "bg-primary-subtle text-primary",
};

export function DashboardRecentSales({
  data,
  isLoading,
}: DashboardRecentSalesProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-4 w-28 bg-bg-muted rounded-full mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2 border-b border-border last:border-0"
            >
              <div className="w-8 h-8 rounded-xl bg-bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-bg-muted rounded-full w-32" />
                <div className="h-2.5 bg-bg-muted rounded-full w-20" />
              </div>
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
        <ShoppingCart size={28} className="text-text-muted opacity-40" />
        <span className="text-xs text-text-muted">No sales recorded yet</span>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm text-text-primary">
          Recent Sales
        </h3>
        <Link
          to={ROUTES.DASHBOARD + "/sales"}
          className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
        >
          View all
          <ArrowRight size={11} />
        </Link>
      </div>

      <div className="space-y-1">
        {data.slice(0, 8).map((sale) => (
          <div
            key={sale.id}
            className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
          >
            {/* Method icon */}
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold",
                METHOD_CLASS[sale.payment_method] ??
                  "bg-bg-subtle text-text-muted",
              )}
            >
              {(METHOD_LABEL[sale.payment_method] ?? "?").slice(0, 2)}
            </div>

            {/* Product name + time */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-text-primary truncate">
                {sale.product_name}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">
                {timeAgo(sale.sold_at)} · {formatTime(sale.sold_at)}
              </div>
            </div>

            {/* Amount */}
            <div className="shrink-0 text-right">
              <div className="text-xs font-semibold text-text-primary">
                {formatCurrency(sale.line_total)}
              </div>
              <div className="text-[10px] text-text-muted">
                ×{sale.quantity}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
