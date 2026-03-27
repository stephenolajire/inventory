// src/pages/admin/vendors/components/VendorActionModal.tsx

import { useState, useEffect } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { VendorListItem } from "../../../../types";

type ModalMode = "approve" | "reject" | "suspend" | "reinstate";

interface VendorActionModalProps {
  open: boolean;
  mode: ModalMode | null;
  vendor: VendorListItem | null;
  isLoading: boolean;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

const MODE_CONFIG: Record<
  ModalMode,
  {
    title: string;
    description: (name: string) => string;
    icon: React.ReactNode;
    iconBg: string;
    confirmLabel: string;
    confirmClass: string;
    needsReason: boolean;
    reasonLabel: string;
  }
> = {
  approve: {
    title: "Approve Vendor",
    description: (n) => `Approve ${n} and give them access to the platform?`,
    icon: <CheckCircle size={20} />,
    iconBg: "bg-success-subtle text-success",
    confirmLabel: "Approve",
    confirmClass: "bg-success hover:opacity-90 text-white",
    needsReason: false,
    reasonLabel: "",
  },
  reject: {
    title: "Reject Application",
    description: (n) =>
      `Reject the application from ${n}. They will be notified.`,
    icon: <XCircle size={20} />,
    iconBg: "bg-error-subtle text-error",
    confirmLabel: "Reject",
    confirmClass: "bg-error hover:opacity-90 text-white",
    needsReason: true,
    reasonLabel: "Reason for rejection",
  },
  suspend: {
    title: "Suspend Vendor",
    description: (n) => `Suspend ${n} and revoke their platform access.`,
    icon: <PauseCircle size={20} />,
    iconBg: "bg-warning-subtle text-warning",
    confirmLabel: "Suspend",
    confirmClass: "bg-warning hover:opacity-90 text-white",
    needsReason: true,
    reasonLabel: "Reason for suspension",
  },
  reinstate: {
    title: "Reinstate Vendor",
    description: (n) => `Reinstate ${n} and restore their platform access?`,
    icon: <PlayCircle size={20} />,
    iconBg: "bg-info-subtle text-info",
    confirmLabel: "Reinstate",
    confirmClass: "bg-info hover:opacity-90 text-white",
    needsReason: false,
    reasonLabel: "",
  },
};

export function VendorActionModal({
  open,
  mode,
  vendor,
  isLoading,
  onConfirm,
  onClose,
}: VendorActionModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Reset reason when modal opens/changes mode
  useEffect(() => {
    setReason("");
    setError("");
  }, [open, mode]);

  if (!open || !mode || !vendor) return null;

  const config = MODE_CONFIG[mode];
  const displayName = vendor.business_name || vendor.email;

  function handleConfirm() {
    if (config.needsReason && !reason.trim()) {
      setError(`${config.reasonLabel} is required.`);
      return;
    }
    onConfirm(reason.trim() || undefined);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="
          fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          z-50 w-full max-w-md
          bg-bg-surface rounded-2xl border border-border shadow-2xl
          p-6
        "
      >
        {/* Close */}
        <button
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all"
        >
          <X size={16} />
        </button>

        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              config.iconBg,
            )}
          >
            {config.icon}
          </div>
          <div>
            <h2
              id="modal-title"
              className="font-heading font-bold text-base text-text-primary"
            >
              {config.title}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {config.description(displayName)}
            </p>
          </div>
        </div>

        {/* Vendor info pill */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-bg-subtle border border-border mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-text-primary truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-text-muted truncate">
              {vendor.email}
            </p>
          </div>
        </div>

        {/* Reason textarea */}
        {config.needsReason && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              {config.reasonLabel}
              <span className="text-error ml-0.5">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder={`Enter ${config.reasonLabel.toLowerCase()}…`}
              className={cn(
                "w-full px-3 py-2.5 rounded-xl resize-none",
                "bg-bg-base border text-sm text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                "transition-all duration-150",
                error ? "border-error" : "border-border",
              )}
            />
            {error && (
              <p className="flex items-center gap-1 text-xs text-error mt-1.5">
                <AlertTriangle size={11} />
                {error}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-text-muted hover:text-text-primary hover:bg-bg-subtle border border-border transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed",
              config.confirmClass,
            )}
          >
            {isLoading ? "Processing…" : config.confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
