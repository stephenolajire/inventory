// src/pages/admin/vendors/AdminVendorsPage.tsx

import { useState, useMemo } from "react";
import { useAdminVendorsDashboard } from "../../../hooks/admin/useAdminVendors";
import { cn } from "../../../lib/utils";
import { Search, Store, Filter, Clock } from "lucide-react";
import type { VendorListItem } from "../../../types";
import { VendorTable } from "../components/vendors/VendorsTable";
import { VendorActionModal } from "../components/vendors/VendorActionModal";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending_approval", label: "Pending" },
  { value: "pending_verification", label: "Unverified" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
  { value: "supermarket", label: "Supermarket" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "food_and_beverage", label: "Food & Beverage" },
  { value: "fashion", label: "Fashion" },
  { value: "electronics", label: "Electronics" },
  { value: "other", label: "Other" },
];

type ModalMode = "approve" | "reject" | "suspend" | "reinstate";

interface ModalState {
  open: boolean;
  mode: ModalMode | null;
  vendor: VendorListItem | null;
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function AdminVendorsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: null,
    vendor: null,
  });

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: status || undefined,
      business_type: businessType || undefined,
      page,
    }),
    [search, status, businessType, page],
  );

  const { vendors, pending, approve, reject, suspend, reinstate } =
    useAdminVendorsDashboard(filters);

  const vendorList = vendors.data?.results ?? [];
  const totalCount = vendors.data?.count ?? 0;
  const hasNext = !!vendors.data?.next;
  const hasPrev = !!vendors.data?.previous;
  const pendingCount = pending.data?.count ?? 0;
  const hasFilters = !!(search || status || businessType);

  // ── Modal helpers ──

  function openModal(mode: ModalMode, vendor: VendorListItem) {
    setModal({ open: true, mode, vendor });
  }
  function closeModal() {
    setModal({ open: false, mode: null, vendor: null });
  }
  function handleConfirm(reason?: string) {
    if (!modal.vendor || !modal.mode) return;
    const id = modal.vendor.id;
    const done = { onSuccess: closeModal };
    switch (modal.mode) {
      case "approve":
        approve.mutate({ vendor_id: id }, done);
        break;
      case "reject":
        reject.mutate({ vendor_id: id, reason: reason ?? "" }, done);
        break;
      case "suspend":
        suspend.mutate({ vendor_id: id, reason: reason ?? "" }, done);
        break;
      case "reinstate":
        reinstate.mutate({ vendor_id: id }, done);
        break;
    }
  }

  const isMutating =
    approve.isPending ||
    reject.isPending ||
    suspend.isPending ||
    reinstate.isPending;

  // ── Filter helpers ──

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }
  function handleStatus(val: string) {
    setStatus(val);
    setPage(1);
  }
  function handleBusinessType(val: string) {
    setBusinessType(val);
    setPage(1);
  }
  function clearFilters() {
    setSearch("");
    setStatus("");
    setBusinessType("");
    setPage(1);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-extrabold text-xl text-text-primary">
            Vendors
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {totalCount} total ·{" "}
            <span
              className={cn(
                "font-semibold",
                pendingCount > 0 ? "text-warning" : "text-text-muted",
              )}
            >
              {pendingCount} pending
            </span>
          </p>
        </div>

        {pendingCount > 0 && (
          <button
            onClick={() => handleStatus("pending_approval")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-warning-subtle border border-warning-muted text-warning text-xs font-semibold hover:bg-warning hover:text-white transition-all duration-150"
          >
            <Clock size={13} />
            Review {pendingCount} pending
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by email or business name…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
          />
        </div>

        <div className="relative">
          <Filter
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <select
            value={status}
            onChange={(e) => handleStatus(e.target.value)}
            className="pl-8 pr-8 py-2.5 rounded-xl appearance-none bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Store
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <select
            value={businessType}
            onChange={(e) => handleBusinessType(e.target.value)}
            className="pl-8 pr-8 py-2.5 rounded-xl appearance-none bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
          >
            {BUSINESS_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <VendorTable
        vendors={vendorList}
        isLoading={vendors.isLoading}
        page={page}
        hasNext={hasNext}
        hasPrev={hasPrev}
        hasFilters={hasFilters}
        onPageNext={() => setPage((p) => p + 1)}
        onPagePrev={() => setPage((p) => p - 1)}
        onClearFilters={clearFilters}
        onAction={openModal}
      />

      {/* ── Action modal ── */}
      <VendorActionModal
        open={modal.open}
        mode={modal.mode}
        vendor={modal.vendor}
        isLoading={isMutating}
        onConfirm={handleConfirm}
        onClose={closeModal}
      />
    </div>
  );
}
