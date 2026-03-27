// src/pages/vendor/settings/paypal/PayPalPage.tsx

import { useState } from "react";
import { CreditCard, History, RefreshCw } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useVendorPaypal } from "../../../hooks/vendor/useVendorPaypal";
import { useVendorSubscription } from "../../../hooks/vendor/useVendorSubscription";
import { PayPalOverviewSection } from "../component/paypal/PaypalOverviewSection";
import { PayPalActivateSection } from "../component/paypal/PaypalActiveSection";
import { PayPalOrderHistorySection } from "../component/paypal/PaypalOrderHistory";

// ─────────────────────────────────────────────────────────────
// Tab definitions
// ─────────────────────────────────────────────────────────────

type PayPalTab = "overview" | "activate" | "history";

const TABS: { id: PayPalTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <CreditCard size={14} /> },
  { id: "activate", label: "Pay / Upgrade", icon: <RefreshCw size={14} /> },
  { id: "history", label: "History", icon: <History size={14} /> },
];

// ─────────────────────────────────────────────────────────────
// Tab content
// ─────────────────────────────────────────────────────────────

function TabContent({
  tab,
  paypal,
  subscription,
  onTabChange,
}: {
  tab: PayPalTab;
  paypal: ReturnType<typeof useVendorPaypal>;
  subscription: ReturnType<typeof useVendorSubscription>;
  onTabChange: (t: PayPalTab) => void;
}) {
  switch (tab) {
    case "overview":
      return (
        <PayPalOverviewSection
          paypal={paypal}
          subscription={subscription}
          onGoActivate={() => onTabChange("activate")}
        />
      );
    case "activate":
      return (
        <PayPalActivateSection
          paypal={paypal}
          subscription={subscription}
          onDone={() => onTabChange("overview")}
        />
      );
    case "history":
      return <PayPalOrderHistorySection paypal={paypal} />;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function PayPalPage() {
  const [activeTab, setActiveTab] = useState<PayPalTab>("overview");

  const paypal = useVendorPaypal();
  const subscription = useVendorSubscription();

  const isLoading = paypal.isLoading || subscription.isLoading;

  return (
    <div className="space-y-8 w-full max-w-8xl px-8">
      {/* ── Section header ── */}
      <div className="mt-5">
        <h2 className="font-heading font-extrabold text-base text-text-primary">
          PayPal Payments
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Manage your PayPal subscription, activate a plan or view payment
          history
        </p>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1.5 mb-6 border-b border-border pb-0 -mb-px overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold",
                "border-b-2 whitespace-nowrap shrink-0 transition-all duration-150 -mb-px",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-primary hover:border-border-strong",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="animate-pulse space-y-3">
          <div className="h-24 bg-bg-subtle rounded-2xl" />
          <div className="h-12 bg-bg-subtle rounded-xl" />
          <div className="h-12 bg-bg-subtle rounded-xl" />
        </div>
      )}

      {/* ── Content ── */}
      {!isLoading && (
        <TabContent
          tab={activeTab}
          paypal={paypal}
          subscription={subscription}
          onTabChange={setActiveTab}
        />
      )}
    </div>
  );
}
