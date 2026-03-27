import { useState } from "react";
import {
  X,
  CheckCircle2,
  Loader2,
  CreditCard,
  Banknote,
  ArrowLeftRight,
} from "lucide-react";
import { formatCurrency, cn } from "../../../../lib/utils";
import type { Cart, PaymentMethod } from "../../../../types";

interface PaymentPanelProps {
  cart: Cart;
  onPay: (method: PaymentMethod, tendered?: number) => void;
  onClose: () => void;
  isPaying: boolean;
}

const METHODS: {
  value: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "cash", label: "Cash", icon: <Banknote size={18} /> },
  { value: "card", label: "Card", icon: <CreditCard size={18} /> },
  {
    value: "transfer",
    label: "Bank Transfer",
    icon: <ArrowLeftRight size={18} />,
  },
];

export function PaymentPanel({
  cart,
  onPay,
  onClose,
  isPaying,
}: PaymentPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [tendered, setTendered] = useState<string>("");

  const total = parseFloat(cart.total_amount);
  const tenderedNum = parseFloat(tendered) || 0;
  const changeDue = method === "cash" ? Math.max(0, tenderedNum - total) : 0;

  // ── Fix: cash requires a valid tendered amount; card/transfer can always proceed ──
  const canPay =
    method === "cash" ? tenderedNum >= total && tenderedNum > 0 : true;

  function handlePay() {
    if (!canPay || isPaying) return;
    onPay(method, method === "cash" ? tenderedNum : undefined);
  }

  // Quick amount suggestions
  const quickAmounts = [
    total,
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 20) * 20,
  ]
    .filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-bg-surface rounded-3xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-heading font-bold text-base text-text-primary">
              Collect payment
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Total: {formatCurrency(cart.total_amount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Method selector */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-xs font-medium text-text-muted mb-2.5 uppercase tracking-wider">
            Payment method
          </p>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  setMethod(m.value);
                  setTendered(""); // reset tendered when switching methods
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2",
                  "text-xs font-semibold transition-all duration-150",
                  method === m.value
                    ? "border-primary bg-primary-subtle text-primary"
                    : "border-border text-text-muted hover:border-primary-muted hover:text-text-primary",
                )}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cash input */}
        {method === "cash" && (
          <div className="px-5 pb-3">
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
              Amount tendered
            </label>
            <input
              type="number"
              min={total}
              step="0.01"
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              placeholder={`e.g. ${formatCurrency(Math.ceil(total / 5) * 5)}`}
              autoFocus
              className="input text-sm h-11 w-full"
            />

            {/* Quick amounts */}
            {quickAmounts.length > 0 && (
              <div className="flex items-center gap-2 mt-2.5">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTendered(String(amount))}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150",
                      tendered === String(amount)
                        ? "border-primary bg-primary-subtle text-primary"
                        : "border-border text-text-muted hover:text-primary hover:border-primary-muted hover:bg-primary-subtle",
                    )}
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
            )}

            {/* Change preview */}
            {tenderedNum > 0 && tenderedNum >= total && (
              <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-success-subtle border border-success-muted">
                <span className="text-xs font-semibold text-success">
                  Change due
                </span>
                <span className="text-base font-extrabold text-success font-heading">
                  {formatCurrency(changeDue)}
                </span>
              </div>
            )}

            {/* Under-tendered warning */}
            {tenderedNum > 0 && tenderedNum < total && (
              <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-danger-subtle border border-danger-muted">
                <span className="text-xs font-semibold text-danger">
                  Short by
                </span>
                <span className="text-base font-extrabold text-danger font-heading">
                  {formatCurrency(total - tenderedNum)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Card / transfer info */}
        {method !== "cash" && (
          <div className="px-5 pb-3">
            <div className="p-3.5 rounded-xl bg-info-subtle border border-info-muted">
              <p className="text-xs text-info leading-relaxed">
                {method === "card"
                  ? "Ask the customer to tap or insert their card, then confirm payment below."
                  : "Confirm the bank transfer has been received before marking as paid."}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 pb-5 pt-2">
          <button
            onClick={handlePay}
            disabled={isPaying || !canPay}
            className="
              w-full inline-flex items-center justify-center gap-2
              py-3.5 rounded-xl text-sm font-semibold
              bg-primary text-white hover:bg-primary-hover
              shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150 active:scale-95
            "
          >
            {isPaying ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Processing…
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> Mark as paid ·{" "}
                {formatCurrency(cart.total_amount)}
              </>
            )}
          </button>

          {/* Helper text when cash amount not entered */}
          {method === "cash" && !canPay && (
            <p className="text-center text-xs text-text-muted mt-2">
              Enter the amount received to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
