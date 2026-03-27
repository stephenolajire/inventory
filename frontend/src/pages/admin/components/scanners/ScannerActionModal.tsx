// src/pages/admin/scanners/components/ScannerActionModals.tsx

import { useState } from "react";
import { X, AlertTriangle, RefreshCw } from "lucide-react";
import type { ScannerListItem } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Revoke Modal
// ─────────────────────────────────────────────────────────────

interface RevokeModalProps {
  open: boolean;
  scanner: ScannerListItem | null;
  isLoading: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export function RevokeScannerModal({
  open,
  scanner,
  isLoading,
  onConfirm,
  onClose,
}: RevokeModalProps) {
  const [reason, setReason] = useState("");

  if (!open || !scanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-bg-surface rounded-2xl border border-border shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center">
              <AlertTriangle size={16} className="text-warning" />
            </div>
            <h2 className="font-heading font-bold text-base text-text-primary">
              Revoke Scanner
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-subtle transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-sm text-text-muted mb-4">
          Revoke{" "}
          <span className="font-semibold text-text-primary font-mono">
            {scanner.serial_number}
          </span>{" "}
          from{" "}
          <span className="font-semibold text-text-primary">
            {scanner.vendor_email ?? "this vendor"}
          </span>
          ? The scanner will return to available state.
        </p>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-muted mb-1.5">
            Reason{" "}
            <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Why is this scanner being revoked?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-bg-subtle border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-warning/30 focus:border-warning transition-all resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:bg-bg-subtle transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-warning text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-warning/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Revoke
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Retire Modal
// ─────────────────────────────────────────────────────────────

interface RetireModalProps {
  open: boolean;
  scanner: ScannerListItem | null;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function RetireScannerModal({
  open,
  scanner,
  isLoading,
  onConfirm,
  onClose,
}: RetireModalProps) {
  if (!open || !scanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-bg-surface rounded-2xl border border-border shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-danger/10 flex items-center justify-center">
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <h2 className="font-heading font-bold text-base text-text-primary">
              Retire Scanner
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-subtle transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-sm text-text-muted mb-6">
          Permanently retire{" "}
          <span className="font-semibold text-text-primary font-mono">
            {scanner.serial_number}
          </span>
          ? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:bg-bg-subtle transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Retire
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Reassign Modal
// ─────────────────────────────────────────────────────────────

interface ReassignModalProps {
  open: boolean;
  scanner: ScannerListItem | null;
  isLoading: boolean;
  onConfirm: (vendorId: string) => void;
  onClose: () => void;
}

export function ReassignScannerModal({
  open,
  scanner,
  isLoading,
  onConfirm,
  onClose,
}: ReassignModalProps) {
  const [vendorId, setVendorId] = useState("");

  if (!open || !scanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-bg-surface rounded-2xl border border-border shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-info/10 flex items-center justify-center">
              <RefreshCw size={16} className="text-info" />
            </div>
            <h2 className="font-heading font-bold text-base text-text-primary">
              Reassign Scanner
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-subtle transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-sm text-text-muted mb-4">
          Reassigning{" "}
          <span className="font-semibold text-text-primary font-mono">
            {scanner.serial_number}
          </span>
          . Enter the ID of the vendor to assign this scanner to.
        </p>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-muted mb-1.5">
            Vendor ID <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 2c2ee1ce-d4be-4af5-ab40-..."
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-bg-subtle border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-info/30 focus:border-info transition-all font-mono"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:bg-bg-subtle transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(vendorId.trim())}
            disabled={!vendorId.trim() || isLoading}
            className="flex-1 py-2.5 rounded-xl bg-info text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-info/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Reassign
          </button>
        </div>
      </div>
    </div>
  );
}
