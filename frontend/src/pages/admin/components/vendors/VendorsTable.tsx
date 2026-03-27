// src/pages/admin/vendors/components/VendorTable.tsx

import { useNavigate } from "react-router-dom";
import {
  Store,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getInitials, getAvatarColor, cn } from "../../../../lib/utils";
import { VendorStatusBadge } from "./VendorStatusBadge";
import { VendorTableSkeleton } from "./VendorTableSkeleton";
import type { VendorListItem } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ModalMode = "approve" | "reject" | "suspend" | "reinstate";

interface VendorTableProps {
  vendors: VendorListItem[];
  isLoading: boolean;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  hasFilters: boolean;
  onPageNext: () => void;
  onPagePrev: () => void;
  onClearFilters: () => void;
  onAction: (mode: ModalMode, vendor: VendorListItem) => void;
}

// ─────────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────────

export function VendorTable({
  vendors,
  isLoading,
  page,
  hasNext,
  hasPrev,
  hasFilters,
  onPageNext,
  onPagePrev,
  onClearFilters,
  onAction,
}: VendorTableProps) {
  return (
    <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-160">
          {/* ── Table header ── */}
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border bg-bg-subtle">
            <span className="col-span-4 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Vendor
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Type
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Location
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Status
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right">
              Actions
            </span>
          </div>

          {/* ── Rows ── */}
          {isLoading ? (
            <VendorTableSkeleton rows={8} />
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Store size={32} className="text-text-muted opacity-30" />
              <p className="text-sm text-text-muted">No vendors found</p>
              {hasFilters && (
                <button
                  onClick={onClearFilters}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {vendors.map((vendor) => (
                <VendorRow
                  key={vendor.id}
                  vendor={vendor}
                  onAction={onAction}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Pagination ── */}
      {(hasNext || hasPrev) && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-subtle">
          <span className="text-xs text-text-muted">Page {page}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onPagePrev}
              disabled={!hasPrev}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-text-muted hover:text-text-primary hover:bg-bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={onPageNext}
              disabled={!hasNext}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-text-muted hover:text-text-primary hover:bg-bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Vendor row
// ─────────────────────────────────────────────────────────────

interface VendorRowProps {
  vendor: VendorListItem;
  onAction: (mode: ModalMode, vendor: VendorListItem) => void;
}

function VendorRow({ vendor, onAction }: VendorRowProps) {
  const navigate = useNavigate();
  const initials = getInitials(vendor.business_name || vendor.email);
  const avatarColor = getAvatarColor(vendor.email);
  const location =
    [vendor.lga_name, vendor.state_name].filter(Boolean).join(", ") || "—";

  const status = vendor.account_status;

  const isApproved = status === "approved";
  const isSuspended = status === "suspended";
  const isRejected = status === "rejected";
  const isPending =
    status === "pending_approval" || status === "pending_verification";

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-bg-subtle transition-colors duration-100">
      {/* ── Identity — clickable → analytics ── */}
      <button
        onClick={() => navigate(`/admin/vendors/${vendor.id}/analytics`)}
        className="col-span-4 flex items-center gap-3 min-w-0 text-left group"
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
            avatarColor,
          )}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
            {vendor.business_name || "—"}
          </p>
          <p className="text-xs text-text-muted truncate">{vendor.email}</p>
        </div>
      </button>

      {/* ── Type ── */}
      <div className="col-span-2">
        <span className="text-xs text-text-muted capitalize">
          {vendor.business_type ? vendor.business_type.replace(/_/g, " ") : "—"}
        </span>
      </div>

      {/* ── Location ── */}
      <div className="col-span-2">
        <span className="text-xs text-text-muted">{location}</span>
      </div>

      {/* ── Status ── */}
      <div className="col-span-2">
        <VendorStatusBadge status={status} />
      </div>

      {/* ── Actions ── */}
      <div className="col-span-2 flex items-center justify-end gap-1">
        {/* Analytics shortcut */}
        <ActionButton
          label="View Analytics"
          icon={<BarChart2 size={13} />}
          onClick={() => navigate(`/admin/vendors/${vendor.id}/analytics`)}
          className="hover:bg-primary/10 hover:text-primary"
        />

        {/* Approve — hidden once already approved */}
        {!isApproved && !isRejected && (
          <ActionButton
            label="Approve"
            icon={<CheckCircle size={13} />}
            onClick={() => onAction("approve", vendor)}
            className="hover:bg-success/10 hover:text-success"
          />
        )}

        {/* Reject — only while pending */}
        {isPending && (
          <ActionButton
            label="Reject"
            icon={<XCircle size={13} />}
            onClick={() => onAction("reject", vendor)}
            className="hover:bg-error/10 hover:text-error"
          />
        )}

        {/* Suspend — only when approved */}
        {isApproved && (
          <ActionButton
            label="Suspend"
            icon={<PauseCircle size={13} />}
            onClick={() => onAction("suspend", vendor)}
            className="hover:bg-warning/10 hover:text-warning"
          />
        )}

        {/* Reinstate — only when suspended */}
        {isSuspended && (
          <ActionButton
            label="Reinstate"
            icon={<PlayCircle size={13} />}
            onClick={() => onAction("reinstate", vendor)}
            className="hover:bg-info/10 hover:text-info"
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Action button
// ─────────────────────────────────────────────────────────────

interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  className: string;
}

function ActionButton({ label, icon, onClick, className }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center",
        "text-text-muted transition-all duration-150",
        className,
      )}
    >
      {icon}
    </button>
  );
}
