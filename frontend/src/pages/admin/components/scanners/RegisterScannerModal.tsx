// src/pages/admin/scanners/components/RegisterScannerModal.tsx

import { useState } from "react";
import { X, ScanLine, Plus } from "lucide-react";
import type { RegisterScannerRequest } from "../../../../types";

interface Props {
  open: boolean;
  isLoading: boolean;
  onConfirm: (data: RegisterScannerRequest) => void;
  onClose: () => void;
}

export function RegisterScannerModal({
  open,
  isLoading,
  onConfirm,
  onClose,
}: Props) {
  const [form, setForm] = useState<RegisterScannerRequest>({
    serial_number: "",
    brand: "",
    model: "",
    notes: "",
  });

  if (!open) return null;

  function handleSubmit() {
    if (!form.serial_number.trim()) return;
    onConfirm({
      serial_number: form.serial_number.trim(),
      brand: form.brand?.trim() || undefined,
      model: form.model?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-bg-surface rounded-2xl border border-border shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <ScanLine size={16} className="text-primary" />
            </div>
            <h2 className="font-heading font-bold text-base text-text-primary">
              Register Scanner
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-subtle transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">
              Serial Number <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. SN-2024-001"
              value={form.serial_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, serial_number: e.target.value }))
              }
              className="w-full px-3 py-2.5 rounded-xl bg-bg-subtle border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                Brand
              </label>
              <input
                type="text"
                placeholder="e.g. Honeywell"
                value={form.brand}
                onChange={(e) =>
                  setForm((f) => ({ ...f, brand: e.target.value }))
                }
                className="w-full px-3 py-2.5 rounded-xl bg-bg-subtle border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                Model
              </label>
              <input
                type="text"
                placeholder="e.g. Voyager 1200g"
                value={form.model}
                onChange={(e) =>
                  setForm((f) => ({ ...f, model: e.target.value }))
                }
                className="w-full px-3 py-2.5 rounded-xl bg-bg-subtle border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">
              Notes
            </label>
            <textarea
              placeholder="Optional notes about this scanner…"
              value={form.notes}
              rows={2}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              className="w-full px-3 py-2.5 rounded-xl bg-bg-subtle border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:bg-bg-subtle transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.serial_number.trim() || isLoading}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
