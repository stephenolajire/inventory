import { Link } from "react-router-dom";
import {
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Barcode,
  Package,
} from "lucide-react";
import { cn, formatCurrency, getStatusBadgeClass } from "../../../../lib/utils";
import type { ProductListItem } from "../../../../types";

interface ProductsTableProps {
  products: ProductListItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  isDeleting: boolean;
  isToggling: boolean;
  isLoading: boolean;
}

async function printBarcode(imageUrl: string, productName: string) {
  let src = imageUrl;

  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    // fall back to the original URL if fetch fails
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Barcode – ${productName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'Courier New', monospace;
      background: #fff;
      padding: 16px;
    }
    img {
      max-width: 240px;
      width: 100%;
      height: auto;
      display: block;
    }
    p {
      margin-top: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #000;
      text-align: center;
      letter-spacing: 0.05em;
    }
    @media print {
      body { min-height: unset; padding: 0; }
      @page { size: auto; margin: 8mm; }
    }
  </style>
</head>
<body>
  <img src="${src}" alt="Barcode" />
  <p>${productName}</p>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:-10000px;left:-10000px;width:1px;height:1px;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const win = iframe.contentWindow;
  if (!win) {
    iframe.remove();
    return;
  }

  win.addEventListener("load", () => {
    win.focus();
    win.print();
    setTimeout(() => iframe.remove(), 1500);
  });
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-bg-muted rounded-full" />
        </td>
      ))}
    </tr>
  );
}

export function ProductsTable({
  products,
  onEdit,
  onDelete,
  onToggle,
  isDeleting,
  isToggling,
  isLoading,
}: ProductsTableProps) {
  if (!isLoading && products.length === 0) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-16 flex flex-col items-center gap-3">
        <Package size={36} className="text-text-muted opacity-30" />
        <p className="text-sm text-text-muted">No products found</p>
        <Link
          to="/dashboard/products/new"
          className="text-xs text-primary font-semibold hover:underline"
        >
          Add your first product →
        </Link>
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
                "Category",
                "Price",
                "Stock",
                "Status",
                "Barcode",
                "Actions",
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
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : products.map((product) => {
                  const isLowStock = product.is_low_stock;
                  const hasDiscount =
                    parseFloat(product.effective_price) <
                    parseFloat(product.selling_price);
                  const isProcessing =
                    product.processing_status === "processing";

                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors duration-150",
                        "hover:bg-bg-subtle",
                        !product.is_active && "opacity-60",
                      )}
                    >
                      {/* Product name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-bg-subtle border border-border flex items-center justify-center shrink-0">
                            <Package size={14} className="text-text-muted" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-text-primary truncate max-w-45">
                              {product.name}
                            </div>
                            {isProcessing && (
                              <div className="text-[10px] text-info font-medium">
                                Processing...
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-muted">
                          {product.category_name}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-text-primary">
                            {formatCurrency(product.effective_price)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-text-muted line-through">
                              {formatCurrency(product.selling_price)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isLowStock && (
                            <AlertTriangle
                              size={12}
                              className="text-warning shrink-0"
                            />
                          )}
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isLowStock
                                ? "text-warning"
                                : product.quantity_in_stock === 0
                                  ? "text-error"
                                  : "text-text-primary",
                            )}
                          >
                            {product.quantity_in_stock}
                          </span>
                          <span className="text-xs text-text-muted">units</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                            getStatusBadgeClass(
                              product.is_active ? "active" : "cancelled",
                            ),
                          )}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Barcode */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-text-muted">
                            {product.barcode ?? "—"}
                          </span>
                          {product.barcode_image ? (
                            <button
                              onClick={() =>
                                void printBarcode(
                                  product.barcode_image!,
                                  product.name,
                                )
                              }
                              title="Print barcode"
                              className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary-muted hover:bg-primary-subtle transition-all duration-150 shrink-0"
                            >
                              <Barcode size={12} />
                            </button>
                          ) : (
                            <span
                              title="Barcode not ready yet"
                              className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-text-muted opacity-30 cursor-not-allowed shrink-0"
                            >
                              <Barcode size={12} />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onEdit(product.id)}
                            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary-muted hover:bg-primary-subtle transition-all duration-150"
                            title="Edit"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() =>
                              onToggle(product.id, !product.is_active)
                            }
                            disabled={isToggling}
                            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-info hover:border-info-muted hover:bg-info-subtle transition-all duration-150 disabled:opacity-50"
                            title={
                              product.is_active ? "Deactivate" : "Activate"
                            }
                          >
                            {product.is_active ? (
                              <ToggleLeft size={13} />
                            ) : (
                              <ToggleRight size={13} />
                            )}
                          </button>
                          <button
                            onClick={() => onDelete(product.id)}
                            disabled={isDeleting}
                            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-error hover:border-error-muted hover:bg-error-subtle transition-all duration-150 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
