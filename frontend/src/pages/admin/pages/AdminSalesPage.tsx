// src/pages/admin/sales/AdminSalesPage.tsx

import { useState, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  TrendingUp,
  ShoppingBag,
  Store,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Receipt,
} from "lucide-react";
import {
  useAdminSales,
  useAdminSalesSummary,
  useAdminSaleDetail,
} from "../../../hooks/admin/useAdminSales";
import { formatCurrency, formatDateTime, cn } from "../../../lib/utils";
import type { AdminSaleListItem } from "../../../types";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: "", label: "All methods" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "transfer", label: "Bank Transfer" },
];

const METHOD_PILL: Record<string, string> = {
  cash: "bg-success-subtle text-success border-success-muted",
  card: "bg-info-subtle text-info border-info-muted",
  transfer: "bg-warning-subtle text-warning border-warning-muted",
};

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

// ── Stat card ──
function StatCard({
  label,
  value,
  sub,
  icon,
  loading,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-4 sm:p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary-subtle border border-primary-muted flex items-center justify-center shrink-0">
        <span className="text-primary">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-muted mb-1">{label}</p>
        {loading ? (
          <div className="space-y-1.5 animate-pulse">
            <div className="h-5 w-24 bg-bg-muted rounded-full" />
            <div className="h-3 w-16 bg-bg-muted rounded-full" />
          </div>
        ) : (
          <>
            <p className="font-heading font-extrabold text-lg sm:text-xl text-text-primary truncate">
              {value}
            </p>
            <p className="text-xs text-text-muted mt-0.5">{sub}</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Payment method badge ──
function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize",
        METHOD_PILL[method] ?? "bg-bg-subtle text-text-muted border-border",
      )}
    >
      {method === "transfer" ? "Transfer" : method}
    </span>
  );
}

// ── Detail panel ──
function SaleDetailPanel({
  saleId,
  onClose,
}: {
  saleId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useAdminSaleDetail(saleId);
  const sale = data?.data;

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
        w-full sm:w-96 xl:w-105
        bg-bg-surface border-l border-border
        flex flex-col shadow-2xl
        animate-in slide-in-from-right duration-200
      "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <Receipt size={15} className="text-primary" />
            <span className="font-heading font-bold text-sm text-text-primary">
              Sale detail
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all duration-150"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-bg-muted rounded-xl" />
              ))}
            </div>
          ) : !sale ? (
            <p className="text-sm text-text-muted text-center py-10">
              Sale not found
            </p>
          ) : (
            <div className="space-y-5">
              {/* ID + timestamps */}
              <div className="bg-bg-subtle rounded-xl border border-border divide-y divide-border">
                {[
                  { label: "Sale ID", value: sale.id.slice(0, 16) + "…" },
                  { label: "Sold at", value: formatDateTime(sale.sold_at) },
                  {
                    label: "Created at",
                    value: formatDateTime(sale.created_at),
                  },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <span className="text-xs text-text-muted">{r.label}</span>
                    <span className="text-xs font-medium text-text-primary font-mono">
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Product */}
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Product
                </p>
                <div className="bg-bg-subtle rounded-xl border border-border divide-y divide-border">
                  {[
                    { label: "Name", value: sale.product_name },
                    {
                      label: "Unit price",
                      value: formatCurrency(sale.unit_price),
                    },
                    { label: "Quantity", value: String(sale.quantity) },
                    { label: "Tax rate", value: `${sale.tax_rate}%` },
                    {
                      label: "Tax amount",
                      value: formatCurrency(sale.tax_amount),
                    },
                    {
                      label: "Line total",
                      value: formatCurrency(sale.line_total),
                    },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <span className="text-xs text-text-muted">{r.label}</span>
                      <span className="text-xs font-semibold text-text-primary">
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Payment
                </p>
                <div className="bg-bg-subtle rounded-xl border border-border divide-y divide-border">
                  {[
                    {
                      label: "Method",
                      value: sale.payment_method,
                      badge: true,
                    },
                    { label: "Currency", value: sale.currency },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <span className="text-xs text-text-muted">{r.label}</span>
                      {r.badge ? (
                        <MethodBadge method={r.value} />
                      ) : (
                        <span className="text-xs font-semibold text-text-primary">
                          {r.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Vendor */}
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Vendor
                </p>
                <div className="bg-bg-subtle rounded-xl border border-border px-4 py-2.5">
                  <span className="text-xs font-medium text-text-primary">
                    {(sale as any).vendor_email ?? "—"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Skeleton row ──
function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3 bg-bg-muted rounded-full animate-pulse"
            style={{ width: `${50 + ((i * 13) % 40)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function AdminSalesPage() {
  // ── Filter state ──
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [vendor, setVendor] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Queries ──
  const filters = {
    ...(search && { search }),
    ...(paymentMethod && { payment_method: paymentMethod }),
    ...(fromDate && { from_date: fromDate }),
    ...(toDate && { to_date: toDate }),
    ...(vendor && { vendor }),
    page,
  };

  const salesQuery = useAdminSales(filters);
  const summaryQuery = useAdminSalesSummary();

  const sales = salesQuery.data?.results ?? [];
  const total = salesQuery.data?.count ?? 0;
  const next = salesQuery.data?.next;
  const previous = salesQuery.data?.previous;
  const summary = summaryQuery.data?.data;

  const totalPages = Math.ceil(total / 20); // Django default page_size = 20
  const activeFilters = [
    search,
    paymentMethod,
    fromDate,
    toDate,
    vendor,
  ].filter(Boolean).length;

  // ── Handlers ──
  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  function clearFilters() {
    setSearch("");
    setPaymentMethod("");
    setFromDate("");
    setToDate("");
    setVendor("");
    setPage(1);
  }

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-xl text-text-primary">
            Sales
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Platform-wide transaction history
          </p>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-subtle border border-border">
            <ArrowUpRight size={13} className="text-text-muted" />
            <span className="text-xs font-semibold text-text-primary">
              {total.toLocaleString()} total
            </span>
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Today's revenue"
          value={
            summary?.today.revenue ? formatCurrency(summary.today.revenue) : "—"
          }
          sub={`${summary?.today.orders ?? 0} orders · ${summary?.today.vendors ?? 0} vendors`}
          icon={<TrendingUp size={17} />}
          loading={summaryQuery.isLoading}
        />
        <StatCard
          label="This month"
          value={
            summary?.this_month.revenue
              ? formatCurrency(summary.this_month.revenue)
              : "—"
          }
          sub={`${summary?.this_month.orders ?? 0} orders · ${summary?.this_month.vendors ?? 0} vendors`}
          icon={<ShoppingBag size={17} />}
          loading={summaryQuery.isLoading}
        />
        <StatCard
          label="All time"
          value={
            summary?.all_time.revenue
              ? formatCurrency(summary.all_time.revenue)
              : "—"
          }
          sub={`${summary?.all_time.orders ?? 0} orders · ${summary?.all_time.vendors ?? 0} vendors`}
          icon={<Store size={17} />}
          loading={summaryQuery.isLoading}
        />
      </div>

      {/* ── Filters ── */}
      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
        {/* Search + filter toggle row */}
        <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-border">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search product, vendor…"
              className="input pl-9 pr-4 h-9 text-sm w-full"
            />
            {search && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 h-9 rounded-xl border text-xs font-semibold transition-all duration-150 shrink-0",
              showFilters || activeFilters > 0
                ? "bg-primary-subtle border-primary-muted text-primary"
                : "border-border text-text-muted hover:border-primary-muted hover:text-text-primary",
            )}
          >
            <SlidersHorizontal size={13} />
            Filters
            {activeFilters > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>

          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 h-9 rounded-xl border border-border text-xs text-text-muted hover:text-error hover:border-error-muted transition-all duration-150 shrink-0"
            >
              <X size={12} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="px-3 sm:px-4 py-4 border-b border-border bg-bg-subtle">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Payment method */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Payment method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setPage(1);
                  }}
                  className="input h-9 text-sm w-full"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* From date */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  From date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="input h-9 text-sm w-full"
                />
              </div>

              {/* To date */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  To date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="input h-9 text-sm w-full"
                />
              </div>

              {/* Vendor email */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Vendor email
                </label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => {
                    setVendor(e.target.value);
                    setPage(1);
                  }}
                  placeholder="vendor@example.com"
                  className="input h-9 text-sm w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-160">
            <thead>
              <tr className="border-b border-border bg-bg-subtle">
                {[
                  "Date",
                  "Vendor",
                  "Product",
                  "Qty",
                  "Method",
                  "Total",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {salesQuery.isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center">
                        <ShoppingBag
                          size={22}
                          className="text-text-muted opacity-40"
                        />
                      </div>
                      <p className="text-sm font-semibold text-text-primary">
                        No sales found
                      </p>
                      <p className="text-xs text-text-muted">
                        {activeFilters > 0
                          ? "Try adjusting your filters"
                          : "Sales will appear here once vendors start transacting"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale: AdminSaleListItem) => (
                  <tr
                    key={sale.id}
                    onClick={() => setSelectedId(sale.id)}
                    className={cn(
                      "border-b border-border transition-colors duration-100 cursor-pointer",
                      selectedId === sale.id
                        ? "bg-primary-subtle"
                        : "hover:bg-bg-subtle",
                    )}
                  >
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                      {formatDateTime(sale.sold_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-primary max-w-35 truncate">
                      {sale.vendor_email}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-primary max-w-35 truncate font-medium">
                      {sale.product_name}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted text-center">
                      {sale.quantity}
                    </td>
                    <td className="px-4 py-3">
                      <MethodBadge method={sale.payment_method} />
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-text-primary whitespace-nowrap">
                      {formatCurrency(sale.line_total)}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      <ArrowUpRight size={13} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-subtle">
            <p className="text-xs text-text-muted">
              Page{" "}
              <span className="font-semibold text-text-primary">{page}</span> of{" "}
              <span className="font-semibold text-text-primary">
                {totalPages || 1}
              </span>
              <span className="hidden sm:inline">
                {" "}
                · {total.toLocaleString()} results
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!previous || salesQuery.isFetching}
                className="
                  flex items-center gap-1 px-3 py-1.5 rounded-xl
                  border border-border text-xs font-medium text-text-muted
                  hover:text-text-primary hover:bg-bg-surface
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-150
                "
              >
                <ChevronLeft size={13} />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!next || salesQuery.isFetching}
                className="
                  flex items-center gap-1 px-3 py-1.5 rounded-xl
                  border border-border text-xs font-medium text-text-muted
                  hover:text-text-primary hover:bg-bg-surface
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-150
                "
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail panel ── */}
      {selectedId && (
        <SaleDetailPanel
          saleId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
