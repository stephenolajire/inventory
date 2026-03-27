// src/pages/landing/FeaturesSection.tsx

import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  Package,
  BarChart3,
  FileText,
  Bell,
  Scan,
  CreditCard,
  MapPin,
  Zap,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Clock,
  Shield,
  Smartphone,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Feature {
  id: string;
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  badge?: string;
  badgeStyle?: React.CSSProperties;
  visual: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────
// Intersection observer hook
// ─────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ─────────────────────────────────────────────────────────────
// Feature visuals — all using CSS variables
// ─────────────────────────────────────────────────────────────

function StorekeeperVisual() {
  const [activeItem, setActiveItem] = useState(0);

  const items = [
    { name: "Indomie Chicken 70g", qty: 6, price: 150, barcode: "SS1A2B3C" },
    { name: "Peak Milk 400g", qty: 2, price: 2800, barcode: "SS4D5E6F" },
    { name: "Milo Tin 200g", qty: 1, price: 1200, barcode: "SS7G8H9I" },
  ];

  useEffect(() => {
    const t = setInterval(
      () => setActiveItem((p) => (p + 1) % items.length),
      2000,
    );
    return () => clearInterval(t);
  }, []);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #0F6E56 0%, #04231b 100%)",
        }}
      >
        <span className="text-white text-xs font-semibold">Counter Screen</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
          <span className="text-green-200 text-xs">Live</span>
        </div>
      </div>

      <div
        className="px-4 py-2 flex items-center gap-2 border-b"
        style={{
          background: "var(--color-primary-subtle)",
          borderColor: "var(--color-primary-muted)",
        }}
      >
        <Scan size={12} style={{ color: "var(--color-primary)" }} />
        <span
          className="text-xs font-medium"
          style={{ color: "var(--color-primary)" }}
        >
          Scanning: {items[activeItem].barcode}
        </span>
      </div>

      <div>
        {items.map((item, i) => (
          <div
            key={item.name}
            className="flex items-center justify-between px-4 py-3 transition-colors duration-300"
            style={{
              background:
                i === activeItem
                  ? "var(--color-primary-subtle)"
                  : "transparent",
              borderBottom:
                i < items.length - 1 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <div>
              <div
                className="text-xs font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {item.name}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                £{item.price.toLocaleString()} × {item.qty}
              </div>
            </div>
            <div
              className="text-sm font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              £{(item.price * item.qty).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div
        className="px-4 py-3 flex items-center justify-between border-t"
        style={{
          background: "var(--color-bg-subtle)",
          borderColor: "var(--color-border)",
        }}
      >
        <span
          className="text-xs font-medium"
          style={{ color: "var(--color-text-muted)" }}
        >
          TOTAL
        </span>
        <span
          className="text-lg font-extrabold"
          style={{ color: "var(--color-text-primary)" }}
        >
          £{total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function InventoryVisual() {
  const products = [
    { name: "Peak Milk 400g", stock: 42, status: "healthy" },
    { name: "Milo Tin 200g", stock: 7, status: "low" },
    { name: "Indomie Chicken", stock: 124, status: "healthy" },
    { name: "Kellogg's Cornflk", stock: 3, status: "critical" },
    { name: "Nestlé Nescafé", stock: 58, status: "healthy" },
  ];

  const statusColor = (s: string) =>
    s === "healthy" ? "#22c55e" : s === "low" ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Inventory
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          5 products
        </span>
      </div>

      <div>
        {products.map((p, i) => (
          <div
            key={p.name}
            className="flex items-center gap-3 px-4 py-2.5"
            style={{
              borderBottom:
                i < products.length - 1
                  ? "1px solid var(--color-border)"
                  : "none",
            }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: statusColor(p.status),
                boxShadow:
                  p.status !== "healthy"
                    ? `0 0 6px ${statusColor(p.status)}`
                    : "none",
              }}
            />
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-medium truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {p.name}
              </div>
              <div
                className="mt-1 h-1 rounded-full overflow-hidden"
                style={{ background: "var(--color-bg-muted)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((p.stock / 150) * 100, 100)}%`,
                    background: statusColor(p.status),
                  }}
                />
              </div>
            </div>
            <span
              className="text-xs font-bold shrink-0"
              style={{ color: statusColor(p.status) }}
            >
              {p.stock}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const revenue = [38, 52, 44, 67, 81, 94];
  const maxRev = Math.max(...revenue);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-0.5">
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Revenue
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--color-success)" }}
          >
            +16% ↑
          </span>
        </div>
        <div
          className="text-xl font-extrabold"
          style={{ color: "var(--color-text-primary)" }}
        >
          £94,200
          <span
            className="text-xs font-normal ml-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            this month
          </span>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-end gap-2 h-24">
          {revenue.map((val, i) => (
            <div
              key={months[i]}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className="w-full rounded-t-md transition-all duration-700"
                style={{
                  height: `${(val / maxRev) * 80}px`,
                  background:
                    i === revenue.length - 1
                      ? "var(--color-primary)"
                      : "var(--color-bg-muted)",
                }}
              />
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {months[i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="grid grid-cols-3 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        {[
          { label: "Orders", value: "312" },
          { label: "Avg", value: "£302" },
          { label: "Units", value: "1.2k" },
        ].map((s, i) => (
          <div
            key={s.label}
            className="px-3 py-2.5 text-center"
            style={{
              borderRight: i < 2 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <div
              className="text-sm font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {s.value}
            </div>
            <div
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsVisual() {
  const notifications = [
    {
      title: "Low stock alert",
      message: "Peak Milk 400g — 3 units left",
      time: "2m ago",
      dot: "#f59e0b",
      unread: true,
    },
    {
      title: "Daily summary ready",
      message: "£84,200 revenue · 28 orders",
      time: "1h ago",
      dot: "var(--color-success)",
      unread: true,
    },
    {
      title: "Monthly report ready",
      message: "March report is available to download",
      time: "3h ago",
      dot: "#3b82f6",
      unread: false,
    },
    {
      title: "Subscription renewed",
      message: "Pro plan renewed for another month",
      time: "1d ago",
      dot: "var(--color-text-muted)",
      unread: false,
    },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Notifications
        </span>
        <span
          className="text-xs text-white rounded-full px-1.5 py-0.5 font-semibold"
          style={{ background: "#ef4444" }}
        >
          3
        </span>
      </div>

      <div>
        {notifications.map((n, i) => (
          <div
            key={n.title}
            className="flex items-start gap-3 px-4 py-3"
            style={{
              background: n.unread
                ? "var(--color-primary-subtle)"
                : "transparent",
              borderBottom:
                i < notifications.length - 1
                  ? "1px solid var(--color-border)"
                  : "none",
            }}
          >
            <div
              className="w-2 h-2 rounded-full mt-1.5 shrink-0"
              style={{ background: n.dot }}
            />
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {n.title}
              </div>
              <div
                className="text-xs mt-0.5 truncate"
                style={{ color: "var(--color-text-muted)" }}
              >
                {n.message}
              </div>
            </div>
            <span
              className="text-xs shrink-0"
              style={{ color: "var(--color-text-muted)" }}
            >
              {n.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsVisual() {
  const reports = [
    {
      type: "Monthly",
      period: "March 2026",
      size: "284 KB",
      status: "ready",
      date: "Apr 1",
    },
    {
      type: "Weekly",
      period: "Mar 24–30",
      size: "96 KB",
      status: "ready",
      date: "Mar 31",
    },
    {
      type: "Weekly",
      period: "Mar 17–23",
      size: "88 KB",
      status: "ready",
      date: "Mar 24",
    },
    {
      type: "Monthly",
      period: "February 2026",
      size: "261 KB",
      status: "generating",
      date: "—",
    },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          PDF Reports
        </span>
        <button
          className="text-xs font-medium"
          style={{ color: "var(--color-primary)" }}
        >
          Generate new
        </button>
      </div>

      <div>
        {reports.map((r, i) => (
          <div
            key={`${r.type}-${r.period}`}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              borderBottom:
                i < reports.length - 1
                  ? "1px solid var(--color-border)"
                  : "none",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--color-error-subtle)" }}
            >
              <FileText size={14} style={{ color: "var(--color-error)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {r.type} — {r.period}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {r.size} · {r.date}
              </div>
            </div>
            <span
              className="text-xs font-semibold flex-shrink-0"
              style={{
                color:
                  r.status === "ready"
                    ? "var(--color-success)"
                    : "var(--color-warning)",
              }}
            >
              {r.status === "ready" ? "Download" : "Generating..."}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentsVisual() {
  const methods = [
    {
      label: "Cash",
      pct: 52,
      amount: "£48,984",
      color: "var(--color-success)",
    },
    { label: "Transfer", pct: 35, amount: "£32,970", color: "#3b82f6" },
    { label: "Card", pct: 13, amount: "£12,246", color: "#a855f7" },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Payment Breakdown
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          This month · £94,200 total
        </div>
      </div>

      <div className="px-4 pt-4 pb-2">
        <div className="h-3 rounded-full flex overflow-hidden gap-0.5">
          {methods.map((m) => (
            <div
              key={m.label}
              className="transition-all duration-700"
              style={{ width: `${m.pct}%`, background: m.color }}
            />
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2.5 mt-2">
        {methods.map((m) => (
          <div key={m.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: m.color }}
              />
              <span
                className="text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {m.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {m.pct}%
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {m.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Feature data
// ─────────────────────────────────────────────────────────────

const FEATURES: Feature[] = [
  {
    id: "storekeeper",
    icon: <ShoppingCart size={22} />,
    label: "Counter Screen",
    title: "Sell faster with barcode scanning",
    description:
      "Your cashier scans a barcode and the item appears instantly in the cart. Quantities update automatically on repeat scans. Accept cash, card or bank transfer — StockSense calculates the change for you.",
    bullets: [
      "0.3s average scan-to-cart time",
      "Auto-deduplication — repeat scans increment qty",
      "Instant change calculation for cash payments",
      "Multiple open carts simultaneously",
    ],
    badge: "Most used",
    badgeStyle: {
      background: "var(--color-primary-subtle)",
      color: "var(--color-primary)",
      border: "1px solid var(--color-primary-muted)",
    },
    visual: <StorekeeperVisual />,
  },
  {
    id: "inventory",
    icon: <Package size={22} />,
    label: "Inventory",
    title: "Know your stock before it runs out",
    description:
      "Add products once and StockSense generates a unique barcode automatically. Get real-time stock levels, per-product alerts and a clear view of what is running low before it costs you a sale.",
    bullets: [
      "Auto-generated Code128 barcodes",
      "Per-product low stock thresholds",
      "Discount pricing with expiry dates",
      "Category and brand filtering",
    ],
    badge: "Automated",
    badgeStyle: {
      background: "var(--color-info-subtle)",
      color: "var(--color-info)",
      border: "1px solid var(--color-info-muted)",
    },
    visual: <InventoryVisual />,
  },
  {
    id: "analytics",
    icon: <BarChart3 size={22} />,
    label: "Analytics",
    title: "Understand your revenue at a glance",
    description:
      "Monthly revenue charts, daily breakdowns, rush hour heatmaps and top product tables — all computed live from your sales data. No spreadsheets. No exports. Just answers.",
    bullets: [
      "Monthly and daily revenue bar charts",
      "Rush hour heatmap (0–23h)",
      "Top products by units and revenue",
      "Profit margin tracking per product",
    ],
    badge: "Pro & Enterprise",
    badgeStyle: {
      background: "var(--color-warning-subtle)",
      color: "var(--color-warning)",
      border: "1px solid var(--color-warning-muted)",
    },
    visual: <AnalyticsVisual />,
  },
  {
    id: "notifications",
    icon: <Bell size={22} />,
    label: "Notifications",
    title: "Stay informed without checking manually",
    description:
      "StockSense watches your inventory and sales so you do not have to. Low stock triggers an alert the moment a product falls below your threshold. Daily summaries land in your inbox every morning.",
    bullets: [
      "Low stock alerts triggered at sale time",
      "Daily sales summary via email",
      "Subscription and payment alerts",
      "In-app notification feed with read tracking",
    ],
    badge: "Real-time",
    badgeStyle: {
      background: "var(--color-error-subtle)",
      color: "var(--color-error)",
      border: "1px solid var(--color-error-muted)",
    },
    visual: <NotificationsVisual />,
  },
  {
    id: "reports",
    icon: <FileText size={22} />,
    label: "Reports",
    title: "PDF reports ready when you need them",
    description:
      "Generate weekly or monthly PDF reports on demand. Each report includes revenue summary, top products, payment method breakdown and a full transaction list — ready to share with your accountant or business partner.",
    bullets: [
      "Weekly and monthly PDF generation",
      "Uploaded to cloud — always accessible",
      "Top products and payment breakdown",
      "Full paginated transaction list",
    ],
    badge: "Pro & Enterprise",
    badgeStyle: {
      background: "var(--color-warning-subtle)",
      color: "var(--color-warning)",
      border: "1px solid var(--color-warning-muted)",
    },
    visual: <ReportsVisual />,
  },
  {
    id: "payments",
    icon: <CreditCard size={22} />,
    label: "Payments",
    title: "Accept any payment, track every kobo",
    description:
      "Cash, card and bank transfer are all first-class citizens in StockSense. Every payment method is tracked, grouped and visualised so you know exactly how your customers prefer to pay.",
    bullets: [
      "Cash, card and bank transfer support",
      "Automatic change calculation",
      "Payment method breakdown chart",
      "Per-transaction receipt generation",
    ],
    badge: "All plans",
    badgeStyle: {
      background: "var(--color-primary-subtle)",
      color: "var(--color-primary)",
      border: "1px solid var(--color-primary-muted)",
    },
    visual: <PaymentsVisual />,
  },
];

// ─────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────

function SectionHeader() {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
        style={{
          background: "var(--color-primary-subtle)",
          border: "1px solid var(--color-primary-muted)",
        }}
      >
        <Zap size={12} style={{ color: "var(--color-primary)" }} />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-primary)" }}
        >
          Everything you need
        </span>
      </div>

      <h2
        className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4"
        style={{ color: "var(--color-text-primary)" }}
      >
        One platform.{" "}
        <span style={{ color: "var(--color-primary)" }}>Every tool.</span>
      </h2>

      <p
        className="text-lg leading-relaxed"
        style={{ color: "var(--color-text-secondary)" }}
      >
        StockSense gives Nigerian vendors a complete operations toolkit — from
        the counter screen to end-of-month reporting — without juggling multiple
        apps or spreadsheets.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Feature tab nav — full width, equal stretch on large screens
// ─────────────────────────────────────────────────────────────

interface TabNavProps {
  features: Feature[];
  activeId: string;
  onChange: (id: string) => void;
}

function TabNav({ features, activeId, onChange }: TabNavProps) {
  return (
    /* On lg+ each tab is flex-1 so they fill the entire bar equally */
    <div className="flex items-stretch gap-1 overflow-x-auto scrollbar-hide">
      {features.map((f) => {
        const isActive = activeId === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 lg:flex-shrink transition-all duration-200"
            style={{
              background: isActive ? "var(--color-primary)" : "transparent",
              color: isActive ? "#fff" : "var(--color-text-secondary)",
              boxShadow: isActive ? "var(--shadow-green-sm)" : "none",
              minWidth: "fit-content",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--color-bg-muted)";
                (e.currentTarget as HTMLElement).style.color =
                  "var(--color-text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLElement).style.color =
                  "var(--color-text-secondary)";
              }
            }}
          >
            <span style={{ color: isActive ? "#fff" : "var(--color-primary)" }}>
              {f.icon}
            </span>
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Feature panel
// ─────────────────────────────────────────────────────────────

interface FeaturePanelProps {
  feature: Feature;
}

function FeaturePanel({ feature }: FeaturePanelProps) {
  const { ref, inView } = useInView(0.1);

  return (
    <div
      ref={ref}
      className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center transition-all duration-500 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Copy */}
      <div className="flex flex-col">
        {feature.badge && (
          <span
            className="inline-flex self-start px-2.5 py-1 rounded-full text-xs font-semibold mb-4"
            style={feature.badgeStyle}
          >
            {feature.badge}
          </span>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: "var(--color-primary-subtle)",
              color: "var(--color-primary)",
            }}
          >
            {feature.icon}
          </div>
          <span
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-primary)" }}
          >
            {feature.label}
          </span>
        </div>

        <h3
          className="font-heading font-extrabold text-2xl lg:text-3xl tracking-tight mb-4"
          style={{ color: "var(--color-text-primary)" }}
        >
          {feature.title}
        </h3>

        <p
          className="leading-relaxed mb-6"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {feature.description}
        </p>

        <ul className="space-y-3 mb-8">
          {feature.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--color-primary)" }}
              />
              <span
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {bullet}
              </span>
            </li>
          ))}
        </ul>

        <a
          href="#"
          className="self-start inline-flex items-center gap-2 text-sm font-semibold group transition-colors duration-150"
          style={{ color: "var(--color-primary)" }}
        >
          Learn more about {feature.label.toLowerCase()}
          <ArrowRight
            size={15}
            className="group-hover:translate-x-1 transition-transform duration-150"
          />
        </a>
      </div>

      {/* Visual */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-3xl blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(15,110,86,0.12) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative">{feature.visual}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom capability strip
// ─────────────────────────────────────────────────────────────

const CAPABILITIES = [
  { icon: <Scan size={18} />, label: "Barcode scanning" },
  { icon: <Shield size={18} />, label: "99.9% uptime SLA" },
  { icon: <Clock size={18} />, label: "Real-time sync" },
  { icon: <MapPin size={18} />, label: "Nigeria-first" },
  { icon: <Smartphone size={18} />, label: "Mobile optimised" },
  { icon: <TrendingUp size={18} />, label: "Growth analytics" },
];

function CapabilityStrip() {
  return (
    <div
      className="mt-24 pt-12 border-t"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {CAPABILITIES.map((cap) => (
          <div
            key={cap.label}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 group cursor-default"
            style={{
              background: "var(--color-bg-subtle)",
              border: "1px solid var(--color-border)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--color-primary-subtle)";
              el.style.borderColor = "var(--color-primary-muted)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--color-bg-subtle)";
              el.style.borderColor = "var(--color-border)";
            }}
          >
            <div style={{ color: "var(--color-text-muted)" }}>{cap.icon}</div>
            <span
              className="text-xs font-medium text-center"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {cap.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main section
// ─────────────────────────────────────────────────────────────

export default function FeaturesSection() {
  const [activeId, setActiveId] = useState(FEATURES[0].id);
  const activeFeature = FEATURES.find((f) => f.id === activeId) ?? FEATURES[0];

  return (
    <section
      id="features"
      className="py-24 lg:py-32 relative overflow-hidden"
      style={{ background: "var(--color-bg-base)" }}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-border) 1px, transparent 1px),
            linear-gradient(to right, var(--color-border) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          opacity: 0.4,
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-16 xl:px-20">
        <SectionHeader />

        {/* Tab bar — full width pill container */}
        <div
          className="mb-12 rounded-2xl p-1.5"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <TabNav
            features={FEATURES}
            activeId={activeId}
            onChange={setActiveId}
          />
        </div>

        <FeaturePanel key={activeId} feature={activeFeature} />

        {/* <CapabilityStrip /> */}
      </div>
    </section>
  );
}
