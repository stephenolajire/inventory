// src/pages/vendor/subscription/pages/CancelSubscriptionPage.tsx
import { useState } from "react";
import { useVendorSubscription } from "../../../hooks/vendor/useVendorSubscription";
import {
  XCircle,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// What the vendor loses — derived from subscription
// ─────────────────────────────────────────────────────────────

function LossItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-red-700">
      <XCircle size={13} className="text-red-400 shrink-0" />
      {label}
    </li>
  );
}

export default function CancelSubscriptionPage() {
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"warn" | "otp" | "done">("warn");
  const [confirmed, setConfirmed] = useState(false);

  const { subscription, cancel } = useVendorSubscription();
  const sub = subscription.data?.data;

  if (!sub || !["active", "past_due"].includes(sub.status)) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
        <CheckCircle2 size={24} className="text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700">
          No active subscription to cancel
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Your subscription is already cancelled or expired.
        </p>
      </div>
    );
  }

  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "end of billing period";

  const losses: string[] = [
    `Access to ${sub.product_limit.toLocaleString()} product slots`,
    ...(sub.has_analytics ? ["Analytics dashboard"] : []),
    ...(sub.has_reports ? ["Reporting tools"] : []),
    "All active product listings",
    "Priority support",
  ];

  const handleCancel = () => {
    if (!otpCode.trim()) return;
    cancel.mutate(
      { otp_code: otpCode },
      {
        onSuccess: () => setStep("done"),
      },
    );
  };

  // ── Done state ──
  if (step === "done") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={24} className="text-slate-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Cancellation scheduled
        </h3>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Your{" "}
          <span className="font-semibold text-slate-700">
            {sub.plan_display_name}
          </span>{" "}
          plan will remain active until{" "}
          <span className="font-semibold text-slate-700">{periodEnd}</span>.
          After that your account will revert to free access.
        </p>
      </div>
    );
  }

  // ── OTP step ──
  if (step === "otp") {
    return (
      <div className="space-y-5">
        <div className="bg-white border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <KeyRound size={16} className="text-red-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Enter verification code
            </h2>
          </div>

          <p className="text-sm text-slate-500 mb-5">
            We've sent a one-time code to your registered email address. Enter
            it below to confirm cancellation.
          </p>

          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              OTP Code
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-2xl font-bold tracking-[0.5em] text-center focus:ring-2 focus:ring-red-400 outline-none transition-all"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={otpCode.length < 6 || cancel.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {cancel.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <XCircle size={14} />
              )}
              Confirm cancellation
            </button>
            <button
              onClick={() => setStep("warn")}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Warning step (default) ──
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-red-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <ShieldAlert size={16} className="text-red-600" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Cancel subscription
          </h2>
        </div>
        <p className="text-sm text-slate-500 ml-11">
          This will schedule your{" "}
          <span className="font-semibold text-slate-700">
            {sub.plan_display_name}
          </span>{" "}
          plan to end on{" "}
          <span className="font-semibold text-slate-700">{periodEnd}</span>.
        </p>
      </div>

      {/* What you'll lose */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-2.5 mb-4">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-800">
              You'll lose access to:
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Effective from {periodEnd}
            </p>
          </div>
        </div>
        <ul className="space-y-2 pl-1">
          {losses.map((l) => (
            <LossItem key={l} label={l} />
          ))}
        </ul>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          What happens next
        </h3>
        <div className="space-y-3">
          {[
            {
              step: "1",
              title: "You stay on your current plan",
              detail: `All features remain until ${periodEnd}`,
            },
            {
              step: "2",
              title: "Plan ends on billing date",
              detail: `Your subscription ends on ${periodEnd}`,
            },
            {
              step: "3",
              title: "Account reverts to free",
              detail: "You can resubscribe any time",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {item.title}
                </p>
                <p className="text-xs text-slate-500">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm and proceed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-red-600"
          />
          <span className="text-xs text-slate-600">
            I understand that cancelling will end my access to paid features on{" "}
            {periodEnd}.
          </span>
        </label>

        <button
          onClick={() => setStep("otp")}
          disabled={!confirmed}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          <XCircle size={14} />
          Continue to cancellation
        </button>
      </div>
    </div>
  );
}
