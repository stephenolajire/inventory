// src/pages/admin/notifications/components/BroadcastForm.tsx

import { useState } from "react";
import { Send, Loader2, Users, User } from "lucide-react";
import { useBroadcastPanel } from "../../../../hooks/admin/useBroadcastNotification";
import { cn } from "../../../../lib/utils";
import type { NotificationChannel } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const CHANNELS: { value: NotificationChannel; label: string; sub: string }[] = [
  { value: "in_app", label: "In-app", sub: "Bell notification only" },
  { value: "email", label: "Email", sub: "Email delivery only" },
  { value: "both", label: "Both", sub: "In-app + email" },
];

type Target = "all" | "single";

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function BroadcastForm() {
  const { toVendor, toAll, isPending } = useBroadcastPanel();

  const [target, setTarget] = useState<Target>("all");
  const [vendorId, setVendorId] = useState("");
  const [channel, setChannel] = useState<NotificationChannel>("in_app");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("");

  function reset() {
    setTitle("");
    setMessage("");
    setVendorId("");
    setActionUrl("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (target === "single") {
      if (!vendorId.trim()) return;
      toVendor.mutate(
        {
          vendor_id: vendorId.trim(),
          title,
          message,
          channel,
          action_url: actionUrl || undefined,
        },
        { onSuccess: reset },
      );
    } else {
      toAll.mutate(
        { title, message, channel, action_url: actionUrl || undefined },
        { onSuccess: reset },
      );
    }
  }

  const canSubmit =
    title.trim() &&
    message.trim() &&
    (target === "all" || vendorId.trim()) &&
    !isPending;

  return (
    <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Send size={15} className="text-primary" />
          <span className="font-heading font-bold text-sm text-text-primary">
            Send notification
          </span>
        </div>
        <p className="text-xs text-text-muted mt-0.5">
          Broadcast a message to one vendor or all vendors
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 sm:px-5 py-5 space-y-5">
        {/* ── Target toggle ── */}
        <div>
          <p className="text-xs font-medium text-text-muted mb-2">Send to</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                {
                  value: "all",
                  label: "All vendors",
                  icon: <Users size={14} />,
                },
                {
                  value: "single",
                  label: "One vendor",
                  icon: <User size={14} />,
                },
              ] as { value: Target; label: string; icon: React.ReactNode }[]
            ).map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTarget(t.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all duration-150",
                  target === t.value
                    ? "border-primary bg-primary-subtle text-primary"
                    : "border-border text-text-muted hover:border-primary-muted",
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Vendor ID (single only) ── */}
        {target === "single" && (
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Vendor ID <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              placeholder="e.g. a1b2c3d4-…"
              className="input h-9 text-sm w-full font-mono"
              required={target === "single"}
            />
          </div>
        )}

        {/* ── Channel selector ── */}
        <div>
          <p className="text-xs font-medium text-text-muted mb-2">Channel</p>
          <div className="grid grid-cols-3 gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setChannel(c.value)}
                className={cn(
                  "flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-150",
                  channel === c.value
                    ? "border-primary bg-primary-subtle"
                    : "border-border hover:border-primary-muted",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-semibold",
                    channel === c.value ? "text-primary" : "text-text-primary",
                  )}
                >
                  {c.label}
                </span>
                <span className="text-[10px] text-text-muted leading-tight">
                  {c.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Title ── */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Title <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled maintenance tonight"
            className="input h-9 text-sm w-full"
            maxLength={100}
            required
          />
          <p className="text-[10px] text-text-muted mt-1 text-right">
            {title.length}/100
          </p>
        </div>

        {/* ── Message ── */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Message <span className="text-error">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your notification message here…"
            rows={4}
            className="input text-sm w-full resize-none"
            maxLength={500}
            required
          />
          <p className="text-[10px] text-text-muted mt-1 text-right">
            {message.length}/500
          </p>
        </div>

        {/* ── Action URL (optional) ── */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Action URL
            <span className="ml-1 text-text-muted font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={actionUrl}
            onChange={(e) => setActionUrl(e.target.value)}
            placeholder="e.g. /settings/subscription"
            className="input h-9 text-sm w-full"
          />
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="
            w-full inline-flex items-center justify-center gap-2
            py-3 rounded-xl bg-primary text-white
            text-sm font-semibold
            hover:bg-primary-hover shadow-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150 active:scale-[0.98]
          "
        >
          {isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send size={15} />{" "}
              {target === "all" ? "Broadcast to all" : "Send to vendor"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
