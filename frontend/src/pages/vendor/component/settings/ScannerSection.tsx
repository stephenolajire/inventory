// src/pages/vendor/settings/components/ScannerSection.tsx

import { Scan, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { useVendorScanner } from "../../../../hooks/vendor/useVendor";
import { copyToClipboard, formatDateTime, cn } from "../../../../lib/utils";
import toast from "react-hot-toast";

export function ScannerSection() {
  const scanner = useVendorScanner();
  const data = scanner.data?.data;

  async function handleCopy(text: string) {
    const ok = await copyToClipboard(text);
    if (ok) toast.success("Copied to clipboard");
  }

  if (scanner.isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-bg-muted rounded-full" />
        <div className="h-28 bg-bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="font-heading font-bold text-base text-text-primary mb-0.5">
          Barcode scanner
        </h2>
        <p className="text-xs text-text-muted">
          Your assigned physical scanner details
        </p>
      </div>

      {!data ? (
        <div className="flex flex-col items-center py-10 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center">
            <Scan size={22} className="text-text-muted opacity-40" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              No scanner assigned yet
            </p>
            <p className="text-xs text-text-muted mt-1 max-w-xs">
              A scanner will be assigned to your account when your application
              is approved.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Status banner */}
          <div
            className={cn(
              "flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border",
              data.status === "assigned"
                ? "bg-success-subtle border-success-muted"
                : "bg-error-subtle border-error-muted",
            )}
          >
            {data.status === "assigned" ? (
              <CheckCircle2
                size={15}
                className="text-success shrink-0 mt-0.5"
              />
            ) : (
              <AlertCircle size={15} className="text-error   shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  data.status === "assigned" ? "text-success" : "text-error",
                )}
              >
                {data.status === "assigned"
                  ? "Scanner assigned"
                  : "Scanner not active"}
              </p>
              <p
                className={cn(
                  "text-xs mt-0.5 leading-relaxed",
                  data.status === "assigned" ? "text-success" : "text-error",
                )}
              >
                {data.status === "assigned"
                  ? "Plug into any USB port and start scanning immediately"
                  : "Contact support to get a scanner assigned to your account"}
              </p>
            </div>
          </div>

          {/* Details table */}
          <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-bg-subtle border-b border-border">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Scanner details
              </span>
            </div>
            <div className="divide-y divide-border">
              {[
                {
                  label: "Serial number",
                  value: data.serial_number,
                  copyable: true,
                },
                { label: "Brand", value: data.brand || "—" },
                { label: "Model", value: data.model || "—" },
                { label: "Status", value: data.status },
                {
                  label: "Assigned on",
                  value: data.assigned_at
                    ? formatDateTime(data.assigned_at)
                    : "—",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <span className="text-xs text-text-muted shrink-0">
                    {row.label}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-text-primary font-mono truncate">
                      {row.value}
                    </span>
                    {row.copyable && (
                      <button
                        onClick={() => handleCopy(row.value)}
                        className="
                          w-6 h-6 rounded-lg shrink-0 flex items-center justify-center
                          text-text-muted hover:text-primary hover:bg-primary-subtle
                          transition-all duration-150
                        "
                      >
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How-to steps */}
          <div className="bg-bg-subtle rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-text-secondary mb-3">
              How to use your scanner
            </p>
            <ol className="space-y-2">
              {[
                "Plug the scanner into any USB port on your PC",
                "Open the Storekeeper page in StockSense",
                "Open or create a cart",
                "Point the scanner at any product barcode",
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-primary-subtle border border-primary-muted text-[9px] font-bold text-primary flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-text-muted leading-relaxed">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
