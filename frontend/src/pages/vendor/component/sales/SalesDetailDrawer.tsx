// src/pages/vendor/sales/components/SaleDetailDrawer.tsx

import { X, Receipt, Package, CreditCard, Clock } from "lucide-react";
import {
  cn,
  formatCurrency,
  formatDate,
  formatTime,
} from "../../../../lib/utils";
import type { SaleListItem } from "../../../../types";

interface SaleDetailDrawerProps {
  sale: SaleListItem | null;
  onClose: () => void;
}

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  transfer: "Bank Transfer",
};

const METHOD_CLASS: Record<string, string> = {
  cash: "bg-success-subtle text-success border-success-muted",
  card: "bg-info-subtle    text-info    border-info-muted",
  transfer: "bg-primary-subtle text-primary border-primary-muted",
};

export function SaleDetailDrawer({ sale, onClose }: SaleDetailDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 bg-black/40 transition-opacity duration-300 z-40",
          sale
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-96 z-50",
          "bg-bg-surface border-l border-border shadow-2xl",
          "flex flex-col transition-transform duration-300 ease-out",
          sale ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-subtle border border-primary-muted flex items-center justify-center">
              <Receipt size={15} className="text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-text-primary">
                Sale detail
              </h3>
              <p className="text-[10px] text-text-muted font-mono">
                #{sale?.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {sale && (
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Product info */}
            <div className="bg-bg-subtle rounded-2xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-bg-surface border border-border flex items-center justify-center shrink-0">
                  <Package size={18} className="text-text-muted" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-text-primary leading-snug">
                    {sale.product_name}
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    {sale.quantity} unit{sale.quantity > 1 ? "s" : ""} sold
                  </p>
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-bg-subtle">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Price breakdown
                </span>
              </div>
              <div className="divide-y divide-border">
                {[
                  {
                    label: "Unit price",
                    value: formatCurrency(sale.unit_price),
                  },
                  { label: "Quantity", value: `×${sale.quantity}` },
                  {
                    label: "Line total",
                    value: formatCurrency(sale.line_total),
                    bold: true,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-xs text-text-muted">{row.label}</span>
                    <span
                      className={cn(
                        "text-sm",
                        row.bold
                          ? "font-extrabold text-text-primary font-heading"
                          : "text-text-secondary",
                      )}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment info */}
            <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-bg-subtle">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Payment
                </span>
              </div>
              <div className="px-4 py-4 flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
                    METHOD_CLASS[sale.payment_method] ??
                      "bg-bg-subtle text-text-muted border-border",
                  )}
                >
                  <CreditCard size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    {METHOD_LABEL[sale.payment_method] ?? sale.payment_method}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {sale.currency}
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamp */}
            <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-bg-subtle">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Date & time
                </span>
              </div>
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-bg-subtle border border-border flex items-center justify-center shrink-0">
                  <Clock size={16} className="text-text-muted" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    {formatDate(sale.sold_at, "long")}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {formatTime(sale.sold_at, true)}
                  </div>
                </div>
              </div>
            </div>

            {/* Cart ref */}
            <div className="px-4 py-3 rounded-xl bg-bg-subtle border border-border">
              <p className="text-xs text-text-muted">Cart reference</p>
              <p className="text-xs font-mono text-text-secondary mt-0.5">
                {sale.cart}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
