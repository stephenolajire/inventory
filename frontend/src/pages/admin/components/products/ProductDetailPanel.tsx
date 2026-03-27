// src/pages/admin/products/components/ProductDetailPanel.tsx

import { useState } from "react";
import {
  X,
  Package,
  Power,
  Trash2,
  Edit3,
  Loader2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  useAdminProductDetail,
  useAdminToggleProductActive,
  useAdminDeleteProduct,
  useAdminUpdateProductStock,
} from "../../../../hooks/admin/useAdminProduct";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  cn,
} from "../../../../lib/utils";
import { ActiveBadge, ProcessingBadge, StockLevel } from "./ProductBadges";

interface ProductDetailPanelProps {
  productId: string;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────
// Section / row helpers
// ─────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
        {title}
      </p>
      <div className="bg-bg-subtle rounded-xl border border-border divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <span className="text-xs text-text-muted shrink-0">{label}</span>
      <div className="text-xs font-medium text-text-primary text-right">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Update stock form
// ─────────────────────────────────────────────────────────────

function UpdateStockForm({
  productId,
  currentQty,
  onDone,
}: {
  productId: string;
  currentQty: number;
  onDone: () => void;
}) {
  const [qty, setQty] = useState(String(currentQty));
  const updateStock = useAdminUpdateProductStock({ onSuccess: onDone });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseInt(qty, 10);
    if (isNaN(num) || num < 0) return;
    updateStock.mutate({ product_id: productId, quantity_in_stock: num });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1.5">
          New quantity <span className="text-error">*</span>
        </label>
        <input
          type="number"
          min={0}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="input h-9 text-sm w-full"
          required
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="
            flex-1 py-2 rounded-xl border border-border
            text-xs font-medium text-text-muted
            hover:text-text-primary hover:bg-bg-surface
            transition-all duration-150
          "
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={updateStock.isPending}
          className="
            flex-1 inline-flex items-center justify-center gap-1.5
            py-2 rounded-xl bg-primary text-white
            text-xs font-semibold
            hover:bg-primary-hover shadow-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          {updateStock.isPending ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Saving…
            </>
          ) : (
            "Update stock"
          )}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Delete confirmation
// ─────────────────────────────────────────────────────────────

function DeleteConfirm({
  productId,
  productName,
  onDone,
  onDeleted,
}: {
  productId: string;
  productName: string;
  onDone: () => void;
  onDeleted: () => void;
}) {
  const remove = useAdminDeleteProduct({ onSuccess: onDeleted });

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-error-subtle border border-error-muted">
        <AlertTriangle size={14} className="text-error shrink-0 mt-0.5" />
        <p className="text-xs text-error leading-relaxed">
          Permanently deletes <strong>"{productName}"</strong> and all
          associated data. This cannot be undone.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="
            flex-1 py-2 rounded-xl border border-border
            text-xs font-medium text-text-muted
            hover:text-text-primary hover:bg-bg-surface
            transition-all duration-150
          "
        >
          Cancel
        </button>
        <button
          onClick={() => remove.mutate({ product_id: productId })}
          disabled={remove.isPending}
          className="
            flex-1 inline-flex items-center justify-center gap-1.5
            py-2 rounded-xl bg-error text-white
            text-xs font-semibold hover:bg-error/90
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          {remove.isPending ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Deleting…
            </>
          ) : (
            <>
              <Trash2 size={12} /> Delete
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────

type PanelAction = "none" | "stock" | "delete";

export function ProductDetailPanel({
  productId,
  onClose,
}: ProductDetailPanelProps) {
  const [action, setAction] = useState<PanelAction>("none");

  const { data, isLoading } = useAdminProductDetail(productId);
  const toggle = useAdminToggleProductActive();
  const product = data?.data;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="
        fixed right-0 top-0 bottom-0 z-50
        w-full sm:w-110
        bg-bg-surface border-l border-border
        flex flex-col shadow-2xl
        animate-in slide-in-from-right duration-200
      "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <Package size={15} className="text-primary" />
            <span className="font-heading font-bold text-sm text-text-primary">
              Product detail
            </span>
          </div>
          <button
            onClick={onClose}
            className="
              w-7 h-7 rounded-lg border border-border
              flex items-center justify-center
              text-text-muted hover:text-text-primary hover:bg-bg-subtle
              transition-all duration-150
            "
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 bg-bg-muted rounded-xl" />
              ))}
            </div>
          ) : !product ? (
            <p className="text-sm text-text-muted text-center py-10">
              Product not found
            </p>
          ) : (
            <div className="space-y-5">
              {/* ── Image + name hero ── */}
              <div className="flex items-center gap-4">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center shrink-0">
                    <Package size={24} className="text-text-muted" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary leading-tight">
                    {product.name}
                  </p>
                  {product.brand && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {product.brand}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <ActiveBadge active={product.is_active} />
                    <ProcessingBadge status={product.processing_status} />
                  </div>
                </div>
              </div>

              {/* ── Pricing ── */}
              <Section title="Pricing">
                <DetailRow label="Selling price">
                  {formatCurrency(product.selling_price)}
                </DetailRow>
                {product.cost_price && (
                  <DetailRow label="Cost price">
                    {formatCurrency(product.cost_price)}
                  </DetailRow>
                )}
                {product.discount_price && (
                  <DetailRow label="Discount price">
                    {formatCurrency(product.discount_price)}
                  </DetailRow>
                )}
                <DetailRow label="Effective price">
                  <span className="font-bold">
                    {formatCurrency(product.effective_price)}
                  </span>
                </DetailRow>
                <DetailRow label="Tax rate">{product.tax_rate}%</DetailRow>
              </Section>

              {/* ── Stock ── */}
              <Section title="Stock">
                <DetailRow label="In stock">
                  <StockLevel
                    quantity={product.quantity_in_stock}
                    isLow={product.is_low_stock}
                  />
                </DetailRow>
                <DetailRow label="Low stock threshold">
                  {product.low_stock_threshold}
                </DetailRow>
                <DetailRow label="Total sold">
                  {product.total_sold.toLocaleString()}
                </DetailRow>
              </Section>

              {/* ── Identity ── */}
              <Section title="Identity">
                <DetailRow label="Category">
                  {product.category?.name ?? "—"}
                </DetailRow>
                <DetailRow label="Unit">
                  <span className="capitalize">{product.unit}</span>
                </DetailRow>
                {product.sku && (
                  <DetailRow label="SKU">
                    <span className="font-mono text-[10px]">{product.sku}</span>
                  </DetailRow>
                )}
                {product.barcode && (
                  <DetailRow label="Barcode">
                    <span className="font-mono text-[10px]">
                      {product.barcode}
                    </span>
                  </DetailRow>
                )}
                <DetailRow label="Created">
                  {formatDate(product.created_at)}
                </DetailRow>
                <DetailRow label="Updated">
                  {formatDateTime(product.updated_at)}
                </DetailRow>
              </Section>

              {/* ── Admin actions ── */}
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Admin actions
                </p>
                <div className="space-y-2">
                  {/* Toggle active */}
                  <button
                    onClick={() =>
                      toggle.mutate({
                        product_id: product.id,
                        active: !product.is_active,
                      })
                    }
                    disabled={toggle.isPending}
                    className={cn(
                      "w-full flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold transition-all duration-150",
                      product.is_active
                        ? "border-warning-muted bg-warning-subtle text-warning hover:bg-warning-subtle/80"
                        : "border-success-muted bg-success-subtle text-success hover:bg-success-subtle/80",
                    )}
                  >
                    {toggle.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Power size={14} />
                    )}
                    {product.is_active
                      ? "Deactivate product"
                      : "Activate product"}
                  </button>

                  {/* Update stock */}
                  <div className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() =>
                        setAction(action === "stock" ? "none" : "stock")
                      }
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 text-xs font-semibold transition-colors duration-150",
                        action === "stock"
                          ? "bg-primary-subtle text-primary"
                          : "text-text-primary hover:bg-bg-subtle",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Edit3 size={13} />
                        Update stock quantity
                      </span>
                      <ChevronDown
                        size={13}
                        className={cn(
                          "transition-transform duration-200",
                          action === "stock" && "rotate-180",
                        )}
                      />
                    </button>
                    {action === "stock" && (
                      <div className="px-4 py-4 border-t border-border bg-bg-subtle">
                        <UpdateStockForm
                          productId={product.id}
                          currentQty={product.quantity_in_stock}
                          onDone={() => setAction("none")}
                        />
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  <div className="border border-error-muted rounded-xl overflow-hidden">
                    <button
                      onClick={() =>
                        setAction(action === "delete" ? "none" : "delete")
                      }
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 text-xs font-semibold transition-colors duration-150",
                        action === "delete"
                          ? "bg-error-subtle text-error"
                          : "text-error hover:bg-error-subtle",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Trash2 size={13} />
                        Delete product
                      </span>
                      <ChevronDown
                        size={13}
                        className={cn(
                          "transition-transform duration-200",
                          action === "delete" && "rotate-180",
                        )}
                      />
                    </button>
                    {action === "delete" && (
                      <div className="px-4 py-4 border-t border-error-muted bg-error-subtle">
                        <DeleteConfirm
                          productId={product.id}
                          productName={product.name}
                          onDone={() => setAction("none")}
                          onDeleted={onClose}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
