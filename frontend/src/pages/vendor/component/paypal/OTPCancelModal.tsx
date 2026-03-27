// src/pages/vendor/settings/paypal/components/OtpCancelModal.tsx

import { useState, useRef, useEffect } from "react";
import { X, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { UseMutationResult } from "@tanstack/react-query";
import type { ApiResponse } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// OTP input — 6 boxes
// ─────────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  function handleChange(i: number, char: string) {
    const cleaned = char.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[i] = cleaned || " ";
    const next = arr.join("").trimEnd();
    onChange(next);
    if (cleaned && i < 5) refs[i + 1].current?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      const arr = value.padEnd(6, " ").split("");
      arr[i] = " ";
      onChange(arr.join("").trimEnd());
      if (i > 0) refs[i - 1].current?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(text);
    e.preventDefault();
    refs[Math.min(text.length, 5)].current?.focus();
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            "w-10 h-12 text-center text-base font-bold rounded-xl border",
            "bg-bg-surface text-text-primary transition-all focus:outline-none",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            value[i] ? "border-primary bg-primary-subtle" : "border-border",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────

interface Props {
  cancelMutation: UseMutationResult<
    ApiResponse<{ success: boolean; message: string }>,
    Error,
    { otp_code: string }
  >;
  onClose: () => void;
}

export function OtpCancelModal({ cancelMutation, onClose }: Props) {
  const [otp, setOtp] = useState("");

  // Close on success
  useEffect(() => {
    if (cancelMutation.isSuccess) onClose();
  }, [cancelMutation.isSuccess]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) return;
    await cancelMutation.mutateAsync({ otp_code: otp });
  }

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-overlay">
      <div
        className="bg-bg-surface rounded-2xl border border-border shadow-xl w-full max-w-sm scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-error-subtle border border-error-muted flex items-center justify-center">
              <ShieldAlert size={15} className="text-error" />
            </div>
            <h3
              id="cancel-modal-title"
              className="font-heading font-bold text-sm text-text-primary"
            >
              Cancel PayPal subscription
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-xs text-text-muted"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Warning */}
          <div className="flex gap-2.5 p-3 rounded-xl bg-error-subtle border border-error-muted text-xs text-error">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <p>
              Your PayPal subscription will be{" "}
              <strong>cancelled immediately</strong>. You keep access to current
              features until the end of the billing period.
            </p>
          </div>

          {/* OTP instructions */}
          <div className="text-center space-y-2">
            <p className="text-xs text-text-muted">
              Enter the 6-digit OTP sent to your email to confirm cancellation.
            </p>
            <OtpInput
              value={otp}
              onChange={setOtp}
              disabled={cancelMutation.isPending}
            />
          </div>

          {/* API error */}
          {cancelMutation.isError && (
            <p className="text-xs text-error text-center">
              {cancelMutation.error?.message ?? "Something went wrong."}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-surface btn-sm flex-1"
              disabled={cancelMutation.isPending}
            >
              Keep subscription
            </button>
            <button
              type="submit"
              disabled={otp.length < 6 || cancelMutation.isPending}
              className="btn btn-danger btn-sm flex-1"
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Confirm cancel"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
