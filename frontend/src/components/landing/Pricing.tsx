// src/pages/landing/PricingSection.tsx

import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import {
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock,
  Headphones,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────────────────────

type BillingCycle = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  highlight: boolean;
  badge?: string;
  ctaLabel: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Perfect for starting out",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "£",
    highlight: false,
    ctaLabel: "Get started",
    features: [
      "Up to 20 products",
      "Barcode scanning",
      "Basic sales history",
      "Low stock alerts",
      "1 device access",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    tagline: "For growing small shops",
    monthlyPrice: 10,
    yearlyPrice: 100,
    currency: "£",
    highlight: false,
    ctaLabel: "Choose Basic",
    features: [
      "Up to 100 products",
      "Full sales history",
      "Daily email summaries",
      "Digital receipts",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For serious retail businesses",
    monthlyPrice: 18,
    yearlyPrice: 180,
    currency: "£",
    highlight: true,
    badge: "Most Popular",
    ctaLabel: "Go Pro",
    features: [
      "Up to 1,000 products",
      "Analytics dashboard",
      "Profit margin tracking",
      "Multiple staff logins",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For multi-location chains",
    monthlyPrice: 35,
    yearlyPrice: 350,
    currency: "£",
    highlight: false,
    ctaLabel: "Contact Sales",
    features: [
      "Unlimited products",
      "Multi-branch sync",
      "Custom PDF reporting",
      "Dedicated manager",
      "WhatsApp support",
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────

function useInView(threshold = 0.1) {
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
// Components
// ─────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  cycle,
  index,
  inView,
}: {
  plan: Plan;
  cycle: BillingCycle;
  index: number;
  inView: boolean;
}) {
  const price = cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  return (
    <div
      className={`
        relative flex flex-col p-6 rounded-2xl border transition-all duration-500
        ${
          plan.highlight
            ? "bg-white border-emerald-500 shadow-xl scale-105 z-10"
            : "bg-white border-slate-200 hover:border-emerald-200 shadow-sm"
        }
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          {plan.badge}
        </span>
      )}

      <div className="mb-6">
        <h3 className="text-slate-900 font-bold text-xl">{plan.name}</h3>
        <p className="text-slate-500 text-sm mt-1">{plan.tagline}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-900">
            {plan.currency}
            {price.toLocaleString()}
          </span>
          <span className="text-slate-500 text-sm">/mo</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {plan.monthlyPrice === 0
            ? "Free forever"
            : cycle === "yearly"
              ? "Billed annually"
              : "Billed monthly"}
        </p>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <Link
        to={ROUTES.REGISTER}
        className={`
          w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
          ${
            plan.highlight
              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200"
              : "bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100"
          }
        `}
      >
        {plan.ctaLabel}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

export default function PricingSection() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const { ref, inView } = useInView(0.05);

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Affordable plans for{" "}
            <span className="text-emerald-600">every shop</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            No setup fees. No hidden charges. Just the tools you need to manage
            your stock and sales efficiently.
          </p>

          {/* Toggle */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span
              className={`text-sm font-medium ${cycle === "monthly" ? "text-slate-900" : "text-slate-400"}`}
            >
              Monthly
            </span>
            <button
              onClick={() =>
                setCycle(cycle === "monthly" ? "yearly" : "monthly")
              }
              className="w-12 h-6 bg-slate-200 rounded-full relative transition-colors"
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${cycle === "yearly" ? "translate-x-6 bg-emerald-500" : ""}`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${cycle === "yearly" ? "text-slate-900" : "text-slate-400"}`}
              >
                Yearly
              </span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div ref={ref} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              cycle={cycle}
              index={i}
              inView={inView}
            />
          ))}
        </div>

        {/* Trust/Support Strip */}
        <div className="mt-20 flex flex-wrap justify-center gap-8 border-t border-slate-200 pt-10">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Shield size={18} className="text-emerald-500" /> 99.9% Uptime
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Clock size={18} className="text-emerald-500" /> Cancel Anytime
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Headphones size={18} className="text-emerald-500" /> Local Support
          </div>
        </div>
      </div>
    </section>
  );
}
