// src/pages/vendor/storekeeper/components/MeasuredQtyModal.tsx
import { useState, useEffect, useRef } from "react";
import { Scale, X, ArrowRight } from "lucide-react";

interface Props {
  productName: string;
  barcode: string;
  onConfirm: (barcode: string, qty: number) => void;
  onClose: () => void;
}

export function MeasuredQtyModal({
  productName,
  barcode,
  onConfirm,
  onClose,
}: Props) {
  const [qty, setQty] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(qty);
    if (isNaN(n) || n <= 0) return;
    onConfirm(barcode, n);
  }

  const parsed = parseFloat(qty);
  const valid = !isNaN(parsed) && parsed > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm rounded-2xl bg-bg-surface border border-border shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-warning-subtle border border-warning-muted flex items-center justify-center">
                <Scale size={15} className="text-warning" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Enter Measured Quantity
                </p>
                <p className="text-xs text-text-muted">Sold by weight</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <div className="px-4 py-3 rounded-xl bg-warning-subtle border border-warning-muted">
              <p className="text-xs font-medium text-warning">
                <span className="font-bold">{productName}</span> is sold by kg.
                Please enter the measured weight before scanning.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">
                Measured Quantity (kg)
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="number"
                  min={0.001}
                  step="0.001"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0.000"
                  className="input h-12 text-lg font-semibold text-center w-full pr-12 focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-text-muted">
                  kg
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-text-muted hover:text-text-primary hover:border-border-strong transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!valid}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
              >
                Confirm & Scan
                <ArrowRight size={14} />
              </button>
            </div>

            <p className="text-center text-xs text-text-muted -mt-1">
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-bg-subtle border border-border text-xs">
                Enter
              </kbd>{" "}
              to confirm
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
