// src/pages/admin/components/scanners/ScannerDetailModal.tsx

import {
  X,
  ScanLine,
  User,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useAdminScannerDetail } from "../../../../hooks/admin/useAdminScanners";
import { ScannerStatusBadge } from "./ScannerStatueBadge";
import { formatDate } from "../../../../lib/utils";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ScannerDetailModalProps {
  open: boolean;
  scannerId: string | null;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────

export function ScannerDetailModal({
  open,
  scannerId,
  onClose,
}: ScannerDetailModalProps) {
  const { data, isLoading } = useAdminScannerDetail(scannerId ?? "", {
    enabled: open && !!scannerId,
  });

  if (!open) return null;

  const scanner = data?.data;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-bg-surface rounded-2xl border border-border shadow-xl">
        {/* ── Header ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ScanLine size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Scanner Detail
              </h2>
              {scanner && (
                <p className="text-xs text-text-muted font-mono">
                  {scanner.serial_number}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <ScannerDetailSkeleton />
          ) : !scanner ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <AlertCircle size={28} className="text-text-muted opacity-40" />
              <p className="text-sm text-text-muted">
                Failed to load scanner details.
              </p>
            </div>
          ) : (
            <>
              {/* ── Device info ── */}
              <Section title="Device" icon={<ScanLine size={13} />}>
                <Row label="Serial Number">
                  <span className="font-mono font-semibold">
                    {scanner.serial_number}
                  </span>
                </Row>
                <Row label="Brand">{scanner.brand || "—"}</Row>
                <Row label="Model">{scanner.model || "—"}</Row>
                <Row label="Status">
                  <ScannerStatusBadge status={scanner.status} />
                </Row>
                {scanner.notes && (
                  <Row label="Notes">
                    <span className="text-text-secondary">{scanner.notes}</span>
                  </Row>
                )}
              </Section>

              {/* ── Timestamps ── */}
              <Section title="Timestamps" icon={<Calendar size={13} />}>
                <Row label="Registered">{formatDate(scanner.created_at)}</Row>
                <Row label="Last Updated">{formatDate(scanner.updated_at)}</Row>
                {scanner.assigned_at && (
                  <Row label="Assigned At">
                    {formatDate(scanner.assigned_at)}
                  </Row>
                )}
                {scanner.revoked_at && (
                  <Row label="Revoked At">{formatDate(scanner.revoked_at)}</Row>
                )}
                {scanner.revoke_reason && (
                  <Row label="Revoke Reason">
                    <span className="text-warning">
                      {scanner.revoke_reason}
                    </span>
                  </Row>
                )}
              </Section>

              {/* ── Registered by ── */}
              {scanner.registered_by && (
                <Section title="Registered By" icon={<Tag size={13} />}>
                  <Row label="Email">{scanner.registered_by.email}</Row>
                  <Row label="Role">{scanner.registered_by.role}</Row>
                </Section>
              )}

              {/* ── Vendor ── */}
              <Section title="Assigned Vendor" icon={<User size={13} />}>
                {!scanner.vendor ? (
                  <p className="col-span-2 text-sm text-text-muted">
                    No vendor assigned.
                  </p>
                ) : (
                  <>
                    <Row label="Email">{scanner.vendor.email}</Row>
                    <Row label="Business">
                      {scanner.vendor.profile.business_name || "—"}
                    </Row>
                    <Row label="Business Type">
                      {scanner.vendor.profile.business_type || "—"}
                    </Row>
                    <Row label="Contact Email">
                      {scanner.vendor.profile.business_email || "—"}
                    </Row>
                    <Row label="Location">
                      {[
                        scanner.vendor.profile.city_town,
                        scanner.vendor.profile.state_name,
                        scanner.vendor.profile.country_name,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </Row>
                    <Row label="Account Status">
                      <span
                        className={
                          scanner.vendor.status === "approved"
                            ? "text-success font-medium capitalize"
                            : "text-warning font-medium capitalize"
                        }
                      >
                        {scanner.vendor.status}
                      </span>
                    </Row>

                    {/* ── Subscription ── */}
                    {scanner.vendor.subscription && (
                      <>
                        <div className="col-span-2 pt-1 pb-0.5">
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <FileText size={10} /> Subscription
                          </p>
                        </div>
                        <Row label="Plan">
                          {scanner.vendor.subscription.plan.name}
                        </Row>
                        <Row label="Billing Cycle">
                          <span className="capitalize">
                            {scanner.vendor.subscription.billing_cycle}
                          </span>
                        </Row>
                        <Row label="Status">
                          <span
                            className={
                              scanner.vendor.subscription.status === "active"
                                ? "text-success font-medium capitalize"
                                : "text-warning font-medium capitalize"
                            }
                          >
                            {scanner.vendor.subscription.status}
                          </span>
                        </Row>
                        <Row label="Period">
                          {formatDate(
                            scanner.vendor.subscription.current_period_start,
                          )}{" "}
                          —{" "}
                          {formatDate(
                            scanner.vendor.subscription.current_period_end,
                          )}
                        </Row>
                      </>
                    )}
                  </>
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout helpers
// ─────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 mb-3">
        {icon}
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-bg-subtle rounded-xl p-4 border border-border">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <span className="text-xs text-text-muted self-center">{label}</span>
      <span className="text-sm text-text-primary text-right">{children}</span>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

function ScannerDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((s) => (
        <div key={s} className="space-y-3">
          <div className="h-3 w-24 bg-bg-muted rounded-full" />
          <div className="bg-bg-subtle rounded-xl p-4 border border-border space-y-3">
            {[1, 2, 3, 4].map((r) => (
              <div key={r} className="grid grid-cols-2 gap-6">
                <div className="h-3 bg-bg-muted rounded-full w-2/3" />
                <div className="h-3 bg-bg-muted rounded-full w-3/4 justify-self-end" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
