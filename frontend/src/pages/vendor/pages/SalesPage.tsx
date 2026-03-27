// src/pages/vendor/sales/SalesPage.tsx

import { useState, useMemo } from "react";
import {
  useVendorSalesList,
  useVendorSalesSummary,
  useVendorSalesByProduct,
  useVendorSalesByPaymentMethod,
} from "../../../hooks/vendor/useVendorSales";
import type { SaleListItem, PaymentMethod } from "../../../types";

import { SalesHeader } from "../component/sales/SalesHeader";
import { SalesFilter } from "../component/sales/SalesFilter";
import { SalesStatCards } from "../component/sales/SalesStatCards";
import { SalesTable } from "../component/sales/SalesTable";
import { SaleDetailDrawer } from "../component/sales/SalesDetailDrawer";
import { SalesPagination } from "../component/sales/SalesPagination";
import { SalesPaymentChart } from "../component/sales/SalesPaymentChart";
import { SalesTopProducts } from "../component/sales/SalesTopProduct";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function SalesPage() {
  // ── Filter state ──
  const [search, setSearch] = useState("");
  // Typed as PaymentMethod | "" so it's compatible with SaleFilters
  // when coerced to PaymentMethod | undefined below.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleListItem | null>(null);

  // ── Active filter count ──
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (paymentMethod) count++;
    if (fromDate) count++;
    if (toDate) count++;
    return count;
  }, [paymentMethod, fromDate, toDate]);

  // ── Filter objects ──
  const listFilters = useMemo(
    () => ({
      search: search || undefined,
      // Empty string coerced to undefined — satisfies PaymentMethod | undefined
      payment_method: (paymentMethod || undefined) as PaymentMethod | undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      page,
    }),
    [search, paymentMethod, fromDate, toDate, page],
  );

  const analyticsFilters = useMemo(
    () => ({
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    }),
    [fromDate, toDate],
  );

  // ── Data hooks ──
  const salesList = useVendorSalesList(listFilters);
  const summary = useVendorSalesSummary();
  const byProduct = useVendorSalesByProduct({ ...analyticsFilters, limit: 5 });
  const byMethod = useVendorSalesByPaymentMethod(analyticsFilters);

  // ── Derived ──
  const sales = salesList.data?.results ?? [];
  const totalCount = salesList.data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ── Handlers ──

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function handlePaymentMethod(v: string) {
    // The SalesFilter component passes a plain string from a <select>;
    // cast it to the union type (empty string resets the filter).
    setPaymentMethod(v as PaymentMethod | "");
    setPage(1);
  }

  function handleFromDate(v: string) {
    setFromDate(v);
    setPage(1);
  }

  function handleToDate(v: string) {
    setToDate(v);
    setPage(1);
  }

  function handleReset() {
    setPaymentMethod("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return (
    <div className="p-6 lg:p-8 max-w-8xl mx-auto">
      {/* Header */}
      <SalesHeader
        search={search}
        onSearch={handleSearch}
        onToggleFilter={() => setFilterOpen((v) => !v)}
        filterOpen={filterOpen}
        totalCount={totalCount}
        isLoading={salesList.isLoading}
      />

      {/* Stat cards */}
      <SalesStatCards
        summary={summary.data?.data}
        isLoading={summary.isLoading}
      />

      {/* Filters */}
      <SalesFilter
        isOpen={filterOpen}
        paymentMethod={paymentMethod}
        fromDate={fromDate}
        toDate={toDate}
        onPaymentMethod={handlePaymentMethod}
        onFromDate={handleFromDate}
        onToDate={handleToDate}
        onReset={handleReset}
        activeCount={activeFilterCount}
      />

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2">
          <SalesTopProducts
            data={byProduct.data?.data ?? []}
            isLoading={byProduct.isLoading}
          />
        </div>
        <div>
          <SalesPaymentChart
            data={byMethod.data?.data ?? []}
            isLoading={byMethod.isLoading}
          />
        </div>
      </div>

      {/* Sales table */}
      <SalesTable
        sales={sales}
        isLoading={salesList.isLoading}
        onSelect={setSelectedSale}
      />

      {/* Pagination */}
      <SalesPagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPage={setPage}
        isLoading={salesList.isLoading}
      />

      {/* Sale detail drawer */}
      <SaleDetailDrawer
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  );
}
