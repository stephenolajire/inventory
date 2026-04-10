// src/pages/admin/components/activities/ActivityDetailPanel.tsx

import { X, Copy, Check } from "lucide-react";
import { formatDate, cn } from "../../../../lib/utils";
import { ActivityActionTypeBadge } from "./ActivityActionTypeBadge";
import type { ActivityDetail } from "../../../../types";
import { useState } from "react";

interface ActivityDetailPanelProps {
  activity: ActivityDetail | null;
  loading: boolean;
  onClose: () => void;
}

export function ActivityDetailPanel({
  activity,
  loading,
  onClose,
}: ActivityDetailPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!activity && !loading) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-end sm:justify-center">
      <div
        className="w-full sm:max-w-md bg-bg-surface rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="sticky top-0 bg-bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-text-primary">
            Activity Details
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bg-subtle rounded-lg transition-colors"
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-20 bg-bg-muted rounded-full animate-pulse" />
                  <div className="h-4 w-full bg-bg-muted rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          ) : activity ? (
            <>
              {/* User */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  User
                </label>
                <div className="mt-2 flex items-center gap-3 p-3 rounded-lg bg-bg-subtle border border-border">
                  <div className="w-10 h-10 rounded-full bg-primary-subtle flex items-center justify-center text-primary font-bold text-sm">
                    {activity.user_email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {activity.user_email}
                    </p>
                    <p className="text-xs text-text-muted">
                      ID: {activity.user_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Type */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Action
                </label>
                <div className="mt-2">
                  <ActivityActionTypeBadge
                    actionType={activity.action_type}
                    display={activity.action_display}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Description
                </label>
                <p className="mt-2 text-sm text-text-primary bg-bg-subtle p-3 rounded-lg border border-border">
                  {activity.description || "—"}
                </p>
              </div>

              {/* Related Object */}
              {activity.content_type_name && (
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Related Object
                  </label>
                  <div className="mt-2 p-3 rounded-lg bg-bg-subtle border border-border text-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-xs text-text-muted">Type</p>
                        <p className="text-sm text-text-primary font-medium capitalize">
                          {activity.content_type_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-muted">ID</p>
                        <p className="text-sm text-text-primary font-mono">
                          {activity.object_id?.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {Object.keys(activity.metadata).length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Metadata
                  </label>
                  <div className="mt-2 p-3 rounded-lg bg-bg-subtle border border-border">
                    <pre className="text-xs text-text-primary overflow-x-auto whitespace-pre-wrap wrap-break-words font-mono">
                      {JSON.stringify(activity.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* IP Address */}
              {activity.ip_address && (
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    IP Address
                  </label>
                  <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-bg-subtle border border-border">
                    <p className="text-sm text-text-primary font-mono flex-1">
                      {activity.ip_address}
                    </p>
                    <button
                      onClick={() => handleCopy(activity.ip_address, "ip")}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        copiedField === "ip"
                          ? "text-success bg-success-subtle"
                          : "text-text-muted hover:bg-bg-muted",
                      )}
                    >
                      {copiedField === "ip" ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Timestamp
                </label>
                <div className="mt-2 space-y-1 p-3 rounded-lg bg-bg-subtle border border-border text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Created</span>
                    <span className="text-text-primary font-medium">
                      {formatDate(activity.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Updated</span>
                    <span className="text-text-primary font-medium">
                      {formatDate(activity.updated_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full mt-6 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-all"
              >
                Close
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
