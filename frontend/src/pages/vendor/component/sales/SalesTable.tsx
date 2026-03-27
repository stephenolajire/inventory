// src/pages/vendor/sales/components/SalesTable.tsx

import { ShoppingCart } from "lucide-react";
import {
  cn,
  formatCurrency,
  formatDate,
  formatTime,
  timeAgo,
} from "../../../../lib/utils";
import type { SaleListItem } from "../../../../types";

interface SalesTableProps {
  sales: SaleListItem[];
  isLoading: boolean;
  onSelect: (sale: SaleListItem) => void;
}

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  transfer: "Transfer",
};

const METHOD_CLASS: Record<string, string> = {
  cash: "bg-success-subtle text-success border-success-muted",
  card: "bg-info-subtle    text-info    border-info-muted",
  transfer: "bg-primary-subtle text-primary border-primary-muted",
};

function SkeletonRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3 bg-bg-muted rounded-full" />
        </td>
      ))}
    </tr>
  );
}

export function SalesTable({ sales, isLoading, onSelect }: SalesTableProps) {
  if (!isLoading && sales.length === 0) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-16 flex flex-col items-center gap-3">
        <ShoppingCart size={32} className="text-text-muted opacity-30" />
        <p className="text-sm text-text-muted">No sales found</p>
        <p className="text-xs text-text-muted">
          Try adjusting your filters or date range
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-subtle">
              {[
                "Product",
                "Qty",
                "Unit price",
                "Total",
                "Method",
                "Date & time",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              : sales.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => onSelect(sale)}
                    className="border-b border-border last:border-0 hover:bg-bg-subtle transition-colors duration-150 cursor-pointer"
                  >
                    {/* Product */}
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-medium text-text-primary max-w-50 truncate">
                        {sale.product_name}
                      </div>
                    </td>

                    {/* Qty */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-text-secondary">
                        ×{sale.quantity}
                      </span>
                    </td>

                    {/* Unit price */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-text-secondary">
                        {formatCurrency(sale.unit_price)}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-text-primary">
                        {formatCurrency(sale.line_total)}
                      </span>
                    </td>

                    {/* Method */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          METHOD_CLASS[sale.payment_method] ??
                            "bg-bg-subtle text-text-muted border-border",
                        )}
                      >
                        {METHOD_LABEL[sale.payment_method] ??
                          sale.payment_method}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5">
                      <div className="text-xs text-text-secondary whitespace-nowrap">
                        {formatDate(sale.sold_at)}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        {formatTime(sale.sold_at)} · {timeAgo(sale.sold_at)}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
