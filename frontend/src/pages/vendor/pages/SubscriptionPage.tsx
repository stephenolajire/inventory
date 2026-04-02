// src/pages/vendor/subscription/SubscriptionPage.tsx
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import { useVendorSubscription } from "../../../hooks/vendor/useVendorSubscription";
import {
  LayoutDashboard,
  Zap,
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Overview",
    to: ROUTES.SUBSCRIPTION,
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Activate Plan",
    to: ROUTES.SUBSCRIPTION_ACTIVATE,
    icon: Zap,
    end: false,
  },
  {
    label: "Upgrade",
    to: ROUTES.SUBSCRIPTION_UPGRADE,
    icon: ArrowUpCircle,
    end: false,
  },
  {
    label: "Downgrade",
    to: ROUTES.SUBSCRIPTION_DOWNGRADE,
    icon: ArrowDownCircle,
    end: false,
  },
  {
    label: "Cancel",
    to: ROUTES.SUBSCRIPTION_CANCEL,
    icon: XCircle,
    end: false,
  },
];

export default function SubscriptionPage() {
  const { subscription, isLoading } = useVendorSubscription();
  const sub = subscription.data?.data;
  const location = useLocation();

  const currentNav = NAV_ITEMS.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-slate-200 py-4 sm:py-5">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Settings</span>
            <ChevronRight size={12} />
            <span className="text-slate-700 font-medium">Subscription</span>
            {currentNav && currentNav.label !== "Overview" && (
              <>
                <ChevronRight size={12} />
                <span className="text-green-600 font-medium">
                  {currentNav.label}
                </span>
              </>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Subscription & Billing
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage your StockSense plan and billing settings
              </p>
            </div>

            {/* Current plan badge */}
            {isLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm shrink-0">
                <Loader2 size={14} className="animate-spin" />
                <span className="hidden sm:inline">Loading...</span>
              </div>
            ) : sub ? (
              <span
                className={`shrink-0 inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wide uppercase ${
                  sub.status === "active"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : sub.status === "past_due"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : sub.status === "cancelled"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    sub.status === "active"
                      ? "bg-green-500"
                      : sub.status === "past_due"
                        ? "bg-amber-500"
                        : sub.status === "cancelled"
                          ? "bg-red-500"
                          : "bg-slate-400"
                  }`}
                />
                <span className="hidden sm:inline">
                  {sub.plan_display_name} ·{" "}
                </span>
                {sub.status.replace("_", " ")}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Mobile: horizontal scrollable tab bar ── */}
      <div className="lg:hidden bg-white border-b border-slate-200">
        <div
          className="flex overflow-x-auto px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isCancelRoute = item.label === "Cancel";
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                    isActive
                      ? isCancelRoute
                        ? "border-red-500 text-red-600"
                        : "border-green-600 text-green-700"
                      : isCancelRoute
                        ? "border-transparent text-red-400 hover:text-red-500"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={13}
                      className={
                        isActive
                          ? isCancelRoute
                            ? "text-red-500"
                            : "text-green-600"
                          : "text-slate-400"
                      }
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex gap-6 xl:gap-8">
          {/* ── Sidebar nav — desktop only ── */}
          <aside className="hidden lg:block w-52 shrink-0">
            <nav className="space-y-0.5 sticky top-6">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isCancelRoute = item.label === "Cancel";
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? isCancelRoute
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-700"
                          : isCancelRoute
                            ? "text-red-400 hover:bg-red-50 hover:text-red-600"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={16}
                          className={
                            isActive
                              ? isCancelRoute
                                ? "text-red-500"
                                : "text-green-600"
                              : ""
                          }
                        />
                        {item.label}
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-6 p-4 bg-white border border-slate-200 rounded-xl">
              <p className="text-xs font-bold text-slate-700 mb-1">
                Need help?
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Contact support for billing questions or plan advice.
              </p>
              <a
                href="mailto:support@stocksense.app"
                className="mt-3 block text-xs font-semibold text-green-600 hover:underline"
              >
                support@stocksense.app
              </a>
            </div>
          </aside>

          {/* ── Page content via Outlet ── */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}