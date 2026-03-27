// src/pages/admin/scanners/components/ScannerTable.tsx

import {
  ScanLine,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Archive,
  RefreshCw,
  Plus,
  Eye,
} from "lucide-react";
import { cn, formatDate } from "../../../../lib/utils";
import { ScannerStatusBadge } from "./ScannerStatueBadge";
import type {
  ScannerListItem,
  ScannerStatus,
  ScannerFilters,
} from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ActionMode = "revoke" | "retire" | "reassign";

interface ScannerTableProps {
  scanners: ScannerListItem[];
  isLoading: boolean;
  filters: ScannerFilters;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  onFilterChange: (filters: ScannerFilters) => void;
  onPageNext: () => void;
  onPagePrev: () => void;
  onAction: (mode: ActionMode, scanner: ScannerListItem) => void;
  onView: (scannerId: string) => void;
  onRegister: () => void;
}

// ─────────────────────────────────────────────────────────────
// Status filter options
// ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ScannerStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "revoked", label: "Revoked" },
  { value: "retired", label: "Retired" },
];

// ─────────────────────────────────────────────────────────────
// Table skeleton
// ─────────────────────────────────────────────────────────────

function ScannerTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-3 px-4 py-3.5 animate-pulse"
        >
          <div className="col-span-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-bg-muted shrink-0" />
            <div className="h-3 bg-bg-muted rounded-full flex-1" />
          </div>
          <div className="col-span-2 flex items-center">
            <div className="h-3 bg-bg-muted rounded-full w-3/4" />
          </div>
          <div className="col-span-2 flex items-center">
            <div className="h-3 bg-bg-muted rounded-full w-2/3" />
          </div>
          <div className="col-span-2 flex items-center">
            <div className="h-5 bg-bg-muted rounded-full w-16" />
          </div>
          <div className="col-span-2 flex items-center">
            <div className="h-3 bg-bg-muted rounded-full w-3/4" />
          </div>
          <div className="col-span-1 flex items-center justify-end gap-1">
            <div className="w-7 h-7 bg-bg-muted rounded-lg" />
            <div className="w-7 h-7 bg-bg-muted rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main table
// ─────────────────────────────────────────────────────────────

export function ScannerTable({
  scanners,
  isLoading,
  filters,
  page,
  hasNext,
  hasPrev,
  onFilterChange,
  onPageNext,
  onPagePrev,
  onAction,
  onView,
  onRegister,
}: ScannerTableProps) {
  const hasFilters = !!(filters.search || filters.status || filters.brand);

  return (
    <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-border">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search serial number or brand…"
            value={filters.search ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                search: e.target.value || undefined,
              })
            }
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-bg-subtle border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <select
            value={filters.status ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: (e.target.value as ScannerStatus) || undefined,
              })
            }
            className="pl-8 pr-8 py-2.5 rounded-xl appearance-none bg-bg-subtle border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Register button */}
        <button
          onClick={onRegister}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shrink-0"
        >
          <Plus size={14} />
          Register Scanner
        </button>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <div className="min-w-175">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border bg-bg-subtle">
            <span className="col-span-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Serial Number
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Brand / Model
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Status
            </span>
            <span className="col-span-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Assigned To
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right">
              Actions
            </span>
          </div>

          {/* Rows */}
          {isLoading ? (
            <ScannerTableSkeleton rows={8} />
          ) : scanners.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <ScanLine size={32} className="text-text-muted opacity-30" />
              <p className="text-sm text-text-muted">No scanners found</p>
              {hasFilters && (
                <button
                  onClick={() => onFilterChange({})}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {scanners.map((scanner) => (
                <ScannerRow
                  key={scanner.id}
                  scanner={scanner}
                  onAction={onAction}
                  onView={onView}
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
// Scanner row
// ─────────────────────────────────────────────────────────────

interface ScannerRowProps {
  scanner: ScannerListItem;
  onAction: (mode: ActionMode, scanner: ScannerListItem) => void;
  onView: (scannerId: string) => void;
}

function ScannerRow({ scanner, onAction, onView }: ScannerRowProps) {
  const isAssigned = scanner.status === "assigned";
  const isAvailable = scanner.status === "available";
  const isRetired = scanner.status === "retired";
  const isRevoked = scanner.status === "revoked";

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-bg-subtle transition-colors duration-100">
      {/* Serial */}
      <div className="col-span-3 flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <ScanLine size={14} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary font-mono truncate">
            {scanner.serial_number}
          </p>
          <p className="text-xs text-text-muted">
            Added {formatDate(scanner.created_at)}
          </p>
        </div>
      </div>

      {/* Brand / Model */}
      <div className="col-span-2 min-w-0">
        <p className="text-sm text-text-primary truncate">
          {scanner.brand || "—"}
        </p>
        <p className="text-xs text-text-muted truncate">
          {scanner.model || "—"}
        </p>
      </div>

      {/* Status */}
      <div className="col-span-2">
        <ScannerStatusBadge status={scanner.status} />
      </div>

      {/* Assigned to */}
      <div className="col-span-3 min-w-0">
        {scanner.vendor_email ? (
          <>
            <p className="text-sm text-text-primary truncate">
              {scanner.vendor_email}
            </p>
            {scanner.assigned_at && (
              <p className="text-xs text-text-muted">
                Since {formatDate(scanner.assigned_at)}
              </p>
            )}
          </>
        ) : (
          <span className="text-xs text-text-muted">—</span>
        )}
      </div>

      {/* Actions */}
      <div className="col-span-2 flex items-center justify-end gap-1">
        {/* View detail */}
        <ActionBtn
          label="View details"
          icon={<Eye size={13} />}
          onClick={() => onView(scanner.id)}
          className="hover:bg-primary/10 hover:text-primary"
        />

        {/* Revoke — only when assigned */}
        <ActionBtn
          label="Revoke"
          icon={<XCircle size={13} />}
          onClick={() => onAction("revoke", scanner)}
          disabled={!isAssigned}
          className="hover:bg-warning/10 hover:text-warning"
        />

        {/* Reassign — when available or revoked */}
        <ActionBtn
          label="Reassign"
          icon={<RefreshCw size={13} />}
          onClick={() => onAction("reassign", scanner)}
          disabled={!isAvailable && !isRevoked}
          className="hover:bg-info/10 hover:text-info"
        />

        {/* Retire — not when already retired */}
        <ActionBtn
          label="Retire"
          icon={<Archive size={13} />}
          onClick={() => onAction("retire", scanner)}
          disabled={isRetired}
          className="hover:bg-danger/10 hover:text-danger"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Action button
// ─────────────────────────────────────────────────────────────

interface ActionBtnProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className: string;
}

function ActionBtn({
  label,
  icon,
  onClick,
  disabled,
  className,
}: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center",
        "text-text-muted transition-all duration-150",
        disabled ? "opacity-30 cursor-not-allowed" : className,
      )}
    >
      {icon}
    </button>
  );
}
