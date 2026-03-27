// src/pages/vendor/settings/SettingsPage.tsx

import { useState } from "react";
import {
  User,
  Building2,
  Shield,
  Scan,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { useVendorProfile } from "../../../hooks/vendor/useVendor";
import { ProfileSection } from "../component/settings/ProfileSection";
import { BusinessSection } from "../component/settings/BusinessSection";
import { SecuritySection } from "../component/settings/SecuritySection";
import { ScannerSection } from "../component/settings/ScannerSection";
import { SubscriptionSection } from "../component/settings/SubscriptionSection";
import { DangerSection } from "../component/settings/DangerSection";
import { cn } from "../../../lib/utils";

// ─────────────────────────────────────────────────────────────
// Tab definitions (single source of truth)
// ─────────────────────────────────────────────────────────────

export type SettingsTab =
  | "profile"
  | "business"
  | "security"
  | "scanner"
  | "subscription"
  | "danger";

const TABS: {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
}[] = [
  { id: "profile", label: "Profile", icon: <User size={15} /> },
  { id: "business", label: "Business", icon: <Building2 size={15} /> },
  { id: "security", label: "Security", icon: <Shield size={15} /> },
  { id: "scanner", label: "Scanner", icon: <Scan size={15} /> },
  { id: "subscription", label: "Subscription", icon: <CreditCard size={15} /> },
  {
    id: "danger",
    label: "Danger zone",
    icon: <AlertTriangle size={15} />,
    danger: true,
  },
];

// ─────────────────────────────────────────────────────────────
// Tab content
// ─────────────────────────────────────────────────────────────

function TabContent({ tab, profile }: { tab: SettingsTab; profile: any }) {
  switch (tab) {
    case "profile":
      return <ProfileSection profile={profile} />;
    case "business":
      return <BusinessSection profile={profile} />;
    case "security":
      return <SecuritySection />;
    case "scanner":
      return <ScannerSection />;
    case "subscription":
      return <SubscriptionSection />;
    case "danger":
      return <DangerSection />;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const profileQuery = useVendorProfile();
  const profile = profileQuery.data?.data;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto">
      {/* ── Page title ── */}
      <div className="mb-5 sm:mb-6">
        <h1 className="font-heading font-extrabold text-xl text-text-primary">
          Settings
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          Manage your account, business details and preferences
        </p>
      </div>

      {/* ── Mobile tab bar (visible below lg) ── */}
      <div className="lg:hidden mb-4 -mx-4 px-4">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold",
                  "whitespace-nowrap shrink-0 transition-all duration-150",
                  isActive
                    ? tab.danger
                      ? "bg-error text-white"
                      : "bg-primary text-white shadow-sm"
                    : tab.danger
                      ? "text-error border border-error-muted bg-error-subtle"
                      : "text-text-muted border border-border bg-bg-surface hover:bg-bg-subtle",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex gap-6 lg:gap-8 items-start">
        {/* ── Sidebar (lg+) ── */}
        <aside className="hidden lg:flex w-48 xl:w-52 shrink-0 flex-col gap-1 sticky top-8">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl",
                  "text-sm font-medium text-left transition-all duration-150",
                  isActive
                    ? tab.danger
                      ? "bg-error-subtle text-error border border-error-muted"
                      : "bg-primary-subtle text-primary border border-primary-muted"
                    : tab.danger
                      ? "text-error hover:bg-error-subtle"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-subtle",
                )}
              >
                <span
                  className={cn(
                    "shrink-0",
                    isActive
                      ? tab.danger
                        ? "text-error"
                        : "text-primary"
                      : "text-text-muted",
                  )}
                >
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* ── Content panel ── */}
        <div className="flex-1 min-w-0">
          {/* Loading skeleton */}
          {profileQuery.isLoading && (
            <div className="bg-bg-surface rounded-2xl border border-border p-5 sm:p-6 animate-pulse space-y-4">
              <div className="h-4 w-40 bg-bg-muted rounded-full" />
              <div className="h-3 w-64 bg-bg-muted rounded-full" />
              <div className="h-28 bg-bg-muted rounded-2xl" />
              <div className="h-10 bg-bg-muted rounded-xl" />
            </div>
          )}

          {/* Tab content */}
          {!profileQuery.isLoading && (
            <div className="bg-bg-surface rounded-2xl border border-border p-5 sm:p-6">
              <TabContent tab={activeTab} profile={profile} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
