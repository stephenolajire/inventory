// src/pages/vendor/storekeeper/components/ScanInput.tsx

import { useRef, useEffect, useState } from "react";
import { Scan, X, Scale } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface ScanInputProps {
  onScan: (barcode: string, measuredQuantity?: number) => void;
  isScanning: boolean;
  lastScanned: string | null;
  lastScannedMeasuredQty?: number;
  disabled: boolean;
}

export function ScanInput({
  onScan,
  isScanning,
  lastScanned,
  lastScannedMeasuredQty,
  disabled,
}: ScanInputProps) {
  const [barcode, setBarcode] = useState("");
  const [isWeighed, setIsWeighed] = useState(false);
  const [measuredQty, setMeasuredQty] = useState("");

  const barcodeRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode input when cart becomes active
  useEffect(() => {
    if (!disabled) barcodeRef.current?.focus();
  }, [disabled]);

  // When weighed mode toggles on, focus the qty field first
  useEffect(() => {
    if (isWeighed) qtyRef.current?.focus();
    else barcodeRef.current?.focus();
  }, [isWeighed]);

  function canSubmit() {
    if (!barcode.trim()) return false;
    if (isWeighed) {
      const n = parseFloat(measuredQty);
      return !isNaN(n) && n > 0;
    }
    return true;
  }

  function fire() {
    if (!canSubmit()) return;
    const qty = isWeighed ? parseFloat(measuredQty) : undefined;
    onScan(barcode.trim(), qty);
    setBarcode("");
    setMeasuredQty("");
    // Keep isWeighed on — cashier likely scanning more weighed items
    barcodeRef.current?.focus();
  }

  function handleBarcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") fire();
  }

  function handleQtyKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      // Move focus to barcode so cashier can scan
      barcodeRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fire();
  }

  return (
    <div className="space-y-2">
      {/* Scan success flash banner */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          lastScanned ? "max-h-10 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-success-subtle border border-success-muted rounded-xl">
          <Scan size={13} className="text-success" />
          <span className="text-xs font-medium text-success truncate">
            Scanned: {lastScanned}
          </span>
        </div>
      </div>

      {/* Failed weighed scan banner — only shown when backend returns an error */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          lastScannedMeasuredQty !== undefined
            ? "max-h-10 opacity-100"
            : "max-h-0 opacity-0",
        )}
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-danger-subtle border border-danger-muted rounded-xl">
          <Scale size={13} className="text-danger" />
          <span className="text-xs font-medium text-danger truncate">
            Scan failed — measured qty: {lastScannedMeasuredQty}
          </span>
        </div>
      </div>

      {/* Weighed-item toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {isWeighed
            ? "Weighed item mode — enter qty then scan"
            : "Scan barcode or type and press Enter"}
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsWeighed((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium",
            "transition-all duration-150 disabled:opacity-40",
            isWeighed
              ? "bg-primary text-white border-primary"
              : "bg-bg-subtle text-text-muted border-border hover:border-primary-muted hover:text-primary",
          )}
        >
          <Scale size={12} />
          Weighed
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* Quantity input — only visible in weighed mode */}
        {isWeighed && (
          <div className="relative w-28 shrink-0">
            <input
              ref={qtyRef}
              type="number"
              min={0.001}
              step="0.001"
              value={measuredQty}
              onChange={(e) => setMeasuredQty(e.target.value)}
              onKeyDown={handleQtyKeyDown}
              placeholder="0.000"
              disabled={disabled}
              className={cn(
                "input h-11 text-sm w-full text-center font-semibold pr-1",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            />
          </div>
        )}

        {/* Barcode input */}
        <div className="relative flex-1">
          <Scan
            size={16}
            className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150",
              isScanning ? "text-primary animate-pulse" : "text-text-muted",
            )}
          />
          <input
            ref={barcodeRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
            placeholder={
              disabled ? "Select or open a cart first" : "Scan barcode..."
            }
            disabled={disabled}
            className={cn(
              "input pl-10 pr-10 h-11 text-sm w-full",
              "focus:border-primary focus:ring-1 focus:ring-primary",
              disabled && "opacity-50 cursor-not-allowed",
              isScanning && "border-primary bg-primary-subtle",
            )}
          />
          {barcode && (
            <button
              type="button"
              onClick={() => {
                setBarcode("");
                barcodeRef.current?.focus();
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
