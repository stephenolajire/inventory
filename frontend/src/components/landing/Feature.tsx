// src/pages/landing/FeaturesSection.tsx

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  BarChart3,
  FileText,
  Bell,
  Scan,
  Zap,
  CheckCircle2,
  TrendingUp,
  Download,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Feature Visual Components (Full Light Mode)
// ─────────────────────────────────────────────────────────────

function StorekeeperVisual() {
  const [activeItem, setActiveItem] = useState(0);
  const items = [
    { name: "Indomie Chicken 70g", qty: 6, price: 150, barcode: "SS1A2B3C" },
    { name: "Peak Milk 400g", qty: 2, price: 2800, barcode: "SS4D5E6F" },
  ];

  useEffect(() => {
    const t = setInterval(
      () => setActiveItem((p) => (p + 1) % items.length),
      2000,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-2xl">
      <div className="px-4 py-3 flex items-center justify-between bg-slate-900">
        <span className="text-white text-xs font-bold uppercase tracking-widest">
          Register #04
        </span>
        <div className="flex items-center gap-1.5 bg-green-500/20 px-2 py-0.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 text-[10px] font-bold">LIVE</span>
        </div>
      </div>
      <div className="px-4 py-2 flex items-center gap-2 border-b border-slate-100 bg-slate-50">
        <Scan size={12} className="text-green-600" />
        <span className="text-[10px] font-bold text-slate-500">
          SCANNING: {items[activeItem].barcode}
        </span>
      </div>
      <div className="p-4 space-y-3">
        {items.map((item, i) => (
          <div
            key={item.name}
            className={`flex justify-between p-3 rounded-xl border transition-all ${i === activeItem ? "border-green-200 bg-green-50" : "border-transparent"}`}
          >
            <div>
              <p className="text-xs font-bold text-slate-800">{item.name}</p>
              <p className="text-[10px] text-slate-400">
                £{item.price.toLocaleString()} x {item.qty}
              </p>
            </div>
            <p className="text-sm font-black text-slate-900">
              £{(item.price * item.qty).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryVisual() {
  const products = [
    { name: "Peak Milk 400g", stock: 42, color: "bg-green-500" },
    { name: "Milo Tin 200g", stock: 7, color: "bg-amber-500" },
    { name: "Kellogg's Cornflk", stock: 3, color: "bg-red-500" },
  ];

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-2xl p-4">
      <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
        <Package size={16} className="text-green-600" /> Stock Levels
      </h4>
      <div className="space-y-4">
        {products.map((p) => (
          <div key={p.name}>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-bold text-slate-700">{p.name}</span>
              <span className="text-xs font-black text-slate-900">
                {p.stock} left
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${p.color} transition-all duration-1000`}
                style={{ width: `${(p.stock / 50) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  const data = [30, 45, 35, 60, 85, 70];
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-2xl p-5">
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Revenue
          </p>
          <h4 className="text-2xl font-black text-slate-900">₦1.2M</h4>
        </div>
        <div className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-lg">
          <TrendingUp size={12} /> +12.5%
        </div>
      </div>
      <div className="flex items-end gap-2 h-32">
        {data.map((val, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-100 rounded-t-lg relative group transition-all hover:bg-green-500"
            style={{ height: `${val}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
              {val}%
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3 px-1">
        {["M", "T", "W", "T", "F", "S"].map((d) => (
          <span key={d} className="text-[10px] font-bold text-slate-400">
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

function AlertsVisual() {
  const notifications = [
    {
      title: "Low Stock",
      msg: "Milo Tin 200g (7 left)",
      time: "2m ago",
      type: "warning",
    },
    {
      title: "Daily Summary",
      msg: "₦84,200 revenue today",
      time: "1h ago",
      type: "info",
    },
  ];

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-2xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-black text-slate-900">Recent Alerts</h4>
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          2
        </span>
      </div>
      <div className="space-y-3">
        {notifications.map((n, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
          >
            <div
              className={`w-2 h-2 mt-1.5 rounded-full ${n.type === "warning" ? "bg-amber-500" : "bg-blue-500"}`}
            />
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-800">{n.title}</p>
              <p className="text-[10px] text-slate-500">{n.msg}</p>
            </div>
            <span className="text-[9px] font-bold text-slate-400">
              {n.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsVisual() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="text-green-600" size={18} />
        <h4 className="text-sm font-black text-slate-900">Monthly Reports</h4>
      </div>
      <div className="space-y-2">
        {["March 2026", "February 2026"].map((m, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                <FileText size={14} />
              </div>
              <p className="text-xs font-bold text-slate-700">{m}</p>
            </div>
            <button className="p-2 text-slate-400 group-hover:text-green-600 transition-colors">
              <Download size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScannerVisual() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-2xl p-6 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
        <Scan className="text-green-600" size={32} />
      </div>
      <h4 className="text-sm font-black text-slate-900 mb-1">
        Hardware Connected
      </h4>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> USB HID
        Scanner
      </p>
      <div className="mt-6 w-full p-3 bg-slate-900 rounded-xl">
        <p className="text-[10px] font-mono text-green-400">
          AWAITING INPUT...
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Feature Data
// ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    id: "storekeeper",
    icon: <ShoppingCart size={20} />,
    label: "Counter",
    title: "Sell faster with barcode scanning",
    description:
      "Scan items and they appear instantly. Accept cash or transfer — StockSense handles the math.",
    bullets: [
      "0.3s average scan-to-cart time",
      "Instant change calculation",
      "Multiple open carts",
    ],
    badge: "Most popular",
    visual: <StorekeeperVisual />,
  },
  {
    id: "inventory",
    icon: <Package size={20} />,
    label: "Inventory",
    title: "Know your stock in real-time",
    description:
      "Auto-generated barcodes and low-stock alerts keep your shelves full.",
    bullets: [
      "Auto-generated barcodes",
      "Low stock thresholds",
      "Category filtering",
    ],
    badge: "Automated",
    visual: <InventoryVisual />,
  },
  {
    id: "analytics",
    icon: <BarChart3 size={20} />,
    label: "Analytics",
    title: "Your revenue, visualised.",
    description:
      "Daily breakdowns and top product tables computed live from your sales data.",
    bullets: [
      "Daily revenue charts",
      "Top product rankings",
      "Profit margin tracking",
    ],
    badge: "Insightful",
    visual: <AnalyticsVisual />,
  },
  {
    id: "notifications",
    icon: <Bell size={20} />,
    label: "Alerts",
    title: "Stay informed automatically",
    description:
      "Low stock triggers an alert immediately. Daily summaries delivered to your inbox.",
    bullets: [
      "Real-time stock alerts",
      "Email daily reports",
      "Unread tracking",
    ],
    badge: "Real-time",
    visual: <AlertsVisual />,
  },
  {
    id: "reports",
    icon: <FileText size={20} />,
    label: "Reports",
    title: "PDF Reports on demand",
    description:
      "Professional monthly reports ready to share with accountants or partners.",
    bullets: [
      "One-click PDF generation",
      "Full transaction history",
      "Payment breakdowns",
    ],
    badge: "Enterprise",
    visual: <ReportsVisual />,
  },
  {
    id: "scanner",
    icon: <Scan size={20} />,
    label: "Scanner",
    title: "Hardware Integration",
    description:
      "Plug in any USB barcode scanner and start selling in seconds.",
    bullets: [
      "Plug-and-play USB support",
      "Zero-config setup",
      "Industrial grade speed",
    ],
    badge: "Hardware",
    visual: <ScannerVisual />,
  },
];

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function FeaturesSection() {
  const [activeId, setActiveId] = useState(FEATURES[0].id);
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      if (FEATURES.some((f) => f.id === id)) setActiveId(id);
    }
  }, [hash]);

  const activeFeature = FEATURES.find((f) => f.id === activeId) ?? FEATURES[0];

  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-full mb-4">
            <Zap size={12} className="text-green-600" />
            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">
              Toolkit
            </span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
            One platform. <span className="text-green-600">Every tool.</span>
          </h2>
        </div>

        <div className="mb-12 p-1 bg-slate-50 border border-slate-200 rounded-2xl flex gap-1 overflow-x-auto scrollbar-hide">
          {FEATURES.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveId(f.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all min-w-fit
                ${activeId === f.id ? "bg-white text-green-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-2.5 py-1 bg-green-600 text-white text-[10px] font-black uppercase rounded-lg mb-6">
              {activeFeature.badge}
            </span>
            <h3 className="text-3xl font-black text-slate-900 mb-4">
              {activeFeature.title}
            </h3>
            <p className="text-slate-500 font-medium mb-8">
              {activeFeature.description}
            </p>
            <div className="space-y-3 mb-8">
              {activeFeature.bullets.map((b) => (
                <div key={b} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <span className="text-sm font-bold text-slate-700">{b}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-green-100 blur-3xl opacity-20 -z-10 rounded-full" />
            {activeFeature.visual}
          </div>
        </div>
      </div>
    </section>
  );
}
