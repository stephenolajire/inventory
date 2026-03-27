// src/pages/landing/PricingSection.tsx

import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import {
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight,
  ChevronDown,
  Star,
  Shield,
  Clock,
  Headphones,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Intersection observer hook
// ─────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref            = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type BillingCycle = "monthly" | "yearly";

interface PlanFeature {
  label:      string;
  free:       boolean | string;
  basic:      boolean | string;
  pro:        boolean | string;
  enterprise: boolean | string;
}

interface Plan {
  id:           string;
  name:         string;
  tagline:      string;
  monthlyPrice: number | null;
  yearlyPrice:  number | null;
  currency:     string;
  highlight:    boolean;
  badge?:       string;
  badgeColor?:  string;
  ctaLabel:     string;
  ctaStyle:     string;
  features:     string[];
}

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id:           "free",
    name:         "Free",
    tagline:      "Try StockSense with no commitment",
    monthlyPrice: 0,
    yearlyPrice:  0,
    currency:     "£",
    highlight:    false,
    ctaLabel:     "Get started free",
    ctaStyle:     "btn btn-surface btn-md w-full",
    features: [
      "Up to 20 products",
      "Barcode scanning",
      "Cash, card & transfer payments",
      "Basic sales history",
      "Low stock alerts",
      "1 counter screen",
      "Email support",
    ],
  },
  {
    id:           "basic",
    name:         "Basic",
    tagline:      "For growing stores with more products",
    monthlyPrice: 4500,
    yearlyPrice:  3600,
    currency:     "£",
    highlight:    false,
    ctaLabel:     "Start Basic",
    ctaStyle:     "btn btn-outline btn-md w-full",
    features: [
      "Up to 100 products",
      "Barcode scanning",
      "Cash, card & transfer payments",
      "Full sales history",
      "Low stock alerts",
      "1 counter screen",
      "Daily sales summary email",
      "Email support",
    ],
  },
  {
    id:           "pro",
    name:         "Pro",
    tagline:      "For serious vendors who want full insight",
    monthlyPrice: 12000,
    yearlyPrice:  9600,
    currency:     "£",
    highlight:    true,
    badge:        "Most popular",
    badgeColor:   "bg-primary text-white",
    ctaLabel:     "Start Pro",
    ctaStyle:     "btn btn-primary btn-md w-full",
    features: [
      "Up to 1,000 products",
      "Barcode scanning",
      "Cash, card & transfer payments",
      "Full sales history",
      "Low stock alerts",
      "Multiple counter screens",
      "Daily sales summary email",
      "Analytics dashboard",
      "Weekly & monthly PDF reports",
      "Profit margin tracking",
      "Rush hour heatmap",
      "Priority email support",
    ],
  },
  {
    id:           "enterprise",
    name:         "Enterprise",
    tagline:      "For multi-branch operations at scale",
    monthlyPrice: 28000,
    yearlyPrice:  22400,
    currency:     "£",
    highlight:    false,
    badge:        "Best value",
    badgeColor:   "bg-accent text-accent-fg",
    ctaLabel:     "Start Enterprise",
    ctaStyle:     "btn btn-surface btn-md w-full",
    features: [
      "Unlimited products",
      "Barcode scanning",
      "Cash, card & transfer payments",
      "Full sales history",
      "Low stock alerts",
      "Unlimited counter screens",
      "Daily sales summary email",
      "Analytics dashboard",
      "Weekly & monthly PDF reports",
      "Profit margin tracking",
      "Rush hour heatmap",
      "Multi-branch management",
      "Dedicated account manager",
      "Phone & WhatsApp support",
      "Custom onboarding session",
    ],
  },
];

const COMPARISON_FEATURES: PlanFeature[] = [
  { label: "Products",                free: "20",        basic: "100",       pro: "1,000",      enterprise: "Unlimited"  },
  { label: "Barcode scanning",        free: true,        basic: true,        pro: true,         enterprise: true         },
  { label: "Payment methods",         free: "3",         basic: "3",         pro: "3",          enterprise: "3"          },
  { label: "Sales history",           free: "Basic",     basic: "Full",      pro: "Full",       enterprise: "Full"       },
  { label: "Low stock alerts",        free: true,        basic: true,        pro: true,         enterprise: true         },
  { label: "Counter screens",         free: "1",         basic: "1",         pro: "Multiple",   enterprise: "Unlimited"  },
  { label: "Daily email summary",     free: false,       basic: true,        pro: true,         enterprise: true         },
  { label: "Analytics dashboard",     free: false,       basic: false,       pro: true,         enterprise: true         },
  { label: "PDF reports",             free: false,       basic: false,       pro: true,         enterprise: true         },
  { label: "Profit margins",          free: false,       basic: false,       pro: true,         enterprise: true         },
  { label: "Rush hour heatmap",       free: false,       basic: false,       pro: true,         enterprise: true         },
  { label: "Multi-branch",            free: false,       basic: false,       pro: false,        enterprise: true         },
  { label: "Custom onboarding",       free: false,       basic: false,       pro: false,        enterprise: true         },
  { label: "Support",                 free: "Email",     basic: "Email",     pro: "Priority",   enterprise: "Phone + WhatsApp" },
];

const FAQS = [
  {
    question: "Is there really a free plan with no credit card?",
    answer:   "Yes. The Free plan is genuinely free — no credit card, no trial period, no automatic upgrades. You get up to 20 products and full barcode scanning for as long as you need it.",
  },
  {
    question: "Can I switch plans at any time?",
    answer:   "Yes. Upgrades take effect immediately with a prorated charge for the rest of your billing period. Downgrades are scheduled to take effect at the end of your current period so you always get what you paid for.",
  },
  {
    question: "What happens to my products if I downgrade?",
    answer:   "If you downgrade to a plan with a lower product limit, products above the limit are hidden — not deleted. Your sales history and data are always preserved. You can restore hidden products by upgrading again.",
  },
  {
    question: "Do you offer a yearly discount?",
    answer:   "Yes. Paying yearly gives you 20% off compared to monthly billing. The yearly price is shown when you toggle to the Annual view on the pricing cards above.",
  },
  {
    question: "How does the scanner assignment work?",
    answer:   "When your account is approved, StockSense automatically assigns a physical barcode scanner to your account from our pool. The scanner serial number is sent to you by email and shown in your dashboard.",
  },
  {
    question: "Can I use StockSense on my phone?",
    answer:   "Yes. StockSense is fully responsive and works on any modern phone or tablet browser. The counter screen is optimised for touch, so your cashier can operate it on a phone if needed.",
  },
];

const TRUST_ITEMS = [
  { icon: <Shield   size={16} />, label: "99.9% uptime SLA"        },
  { icon: <Clock    size={16} />, label: "Cancel anytime"           },
  { icon: <Headphones size={16} />, label: "Nigerian support team"  },
  { icon: <Star     size={16} />, label: "4.9/5 average rating"     },
];

// ─────────────────────────────────────────────────────────────
// Billing toggle
// ─────────────────────────────────────────────────────────────

interface BillingToggleProps {
  cycle:    BillingCycle;
  onChange: (c: BillingCycle) => void;
}

function BillingToggle({ cycle, onChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={`text-sm font-medium transition-colors duration-150 ${
          cycle === "monthly"
            ? "text-text-primary"
            : "text-text-muted"
        }`}
      >
        Monthly
      </span>

      {/* Toggle pill */}
      <button
        onClick={() => onChange(cycle === "monthly" ? "yearly" : "monthly")}
        aria-label="Toggle billing cycle"
        className={`
          relative w-12 h-6 rounded-full border-2 transition-all duration-300
          ${cycle === "yearly"
            ? "bg-primary border-primary"
            : "bg-bg-muted border-border"
          }
        `}
      >
        <div
          className={`
            absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm
            transition-transform duration-300
            ${cycle === "yearly" ? "translate-x-6" : "translate-x-0.5"}
          `}
        />
      </button>

      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-medium transition-colors duration-150 ${
            cycle === "yearly"
              ? "text-text-primary"
              : "text-text-muted"
          }`}
        >
          Annual
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success-subtle text-success border border-success-muted">
          Save 20%
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Price display
// ─────────────────────────────────────────────────────────────

interface PriceDisplayProps {
  plan:  Plan;
  cycle: BillingCycle;
}

function PriceDisplay({ plan, cycle }: PriceDisplayProps) {
  const price = cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  if (price === 0) {
    return (
      <div className="mb-6">
        <div className="font-heading font-extrabold text-4xl text-text-primary">
          Free
        </div>
        <div className="text-sm text-text-muted mt-1">forever</div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-end gap-1">
        <span className="font-heading font-extrabold text-4xl text-text-primary">
          {plan.currency}{price?.toLocaleString()}
        </span>
        <span className="text-text-muted text-sm mb-1.5">/month</span>
      </div>
      {cycle === "yearly" && (
        <div className="text-xs text-text-muted mt-1">
          Billed as{" "}
          <span className="font-semibold text-success">
            {plan.currency}{((price ?? 0) * 12).toLocaleString()}/year
          </span>
          {" "}— saves{" "}
          <span className="font-semibold text-success">
            {plan.currency}
            {(((plan.monthlyPrice ?? 0) - (price ?? 0)) * 12).toLocaleString()}
          </span>
        </div>
      )}
      {cycle === "monthly" && (
        <div className="text-xs text-text-muted mt-1">
          Or{" "}
          <span className="font-semibold text-primary">
            {plan.currency}{plan.yearlyPrice?.toLocaleString()}/mo
          </span>
          {" "}billed annually
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Plan card
// ─────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan:   Plan;
  cycle:  BillingCycle;
  index:  number;
  inView: boolean;
}

function PlanCard({ plan, cycle, index, inView }: PlanCardProps) {
  return (
    <div
      className={`
        relative flex flex-col rounded-2xl border-2 overflow-hidden
        transition-all duration-500
        ${plan.highlight
          ? "border-primary shadow-2xl scale-[1.02] bg-bg-surface"
          : "border-border bg-bg-surface hover:border-primary-muted hover:shadow-lg"
        }
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Popular badge */}
      {plan.badge && (
        <div className="absolute top-0 left-0 right-0 flex justify-center">
          <span className={`text-xs font-semibold px-4 py-1 rounded-b-xl ${plan.badgeColor}`}>
            {plan.badge}
          </span>
        </div>
      )}

      <div className={`p-6 flex flex-col flex-1 ${plan.badge ? "pt-8" : ""}`}>

        {/* Plan name + tagline */}
        <div className="mb-5">
          <h3 className="font-heading font-extrabold text-xl text-text-primary mb-1">
            {plan.name}
          </h3>
          <p className="text-sm text-text-muted leading-snug">
            {plan.tagline}
          </p>
        </div>

        {/* Price */}
        <PriceDisplay plan={plan} cycle={cycle} />

        {/* Divider */}
        <div className="h-px bg-border mb-5" />

        {/* Features */}
        <ul className="space-y-2.5 flex-1 mb-6">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <CheckCircle2
                size={15}
                className={`shrink-0 mt-0.5 ${
                  plan.highlight ? "text-primary" : "text-success"
                }`}
              />
              <span className="text-sm text-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          to={ROUTES.REGISTER}
          className={`
            ${plan.ctaStyle}
            inline-flex items-center justify-center gap-2
            transition-all duration-150 active:scale-95
            ${plan.highlight ? "shadow-lg shadow-primary/25" : ""}
          `}
        >
          {plan.highlight && <Zap size={14} fill="white" />}
          {plan.ctaLabel}
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-150" />
        </Link>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Comparison table
// ─────────────────────────────────────────────────────────────

function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return <CheckCircle2 size={16} className="text-success mx-auto" />;
  }
  if (value === false) {
    return <XCircle size={16} className="text-border mx-auto" />;
  }
  return (
    <span className="text-xs font-medium text-text-secondary text-center block">
      {value}
    </span>
  );
}

function ComparisonTable() {
  const { ref, inView } = useInView(0.05);
  const [expanded, setExpanded] = useState(false);

  const VISIBLE_ROWS = 6;
  const rows = expanded
    ? COMPARISON_FEATURES
    : COMPARISON_FEATURES.slice(0, VISIBLE_ROWS);

  return (
    <div
      ref={ref}
      className={`
        mt-20 transition-all duration-700
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="font-heading font-extrabold text-2xl text-text-primary mb-2">
          Full feature comparison
        </h3>
        <p className="text-sm text-text-muted">
          See exactly what is included in each plan
        </p>
      </div>

      {/* Table */}
      <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-5 border-b border-border">
          <div className="p-4 bg-bg-subtle" />
          {["Free", "Basic", "Pro", "Enterprise"].map((name) => (
            <div
              key={name}
              className={`
                p-4 text-center font-heading font-bold text-sm
                ${name === "Pro"
                  ? "bg-primary-subtle text-primary"
                  : "bg-bg-subtle text-text-secondary"
                }
              `}
            >
              {name}
              {name === "Pro" && (
                <div className="text-xs font-normal text-primary mt-0.5">
                  Most popular
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Feature rows */}
        {rows.map((feature, i) => (
          <div
            key={feature.label}
            className={`
              grid grid-cols-5 border-b border-border last:border-0
              ${i % 2 === 0 ? "bg-bg-surface" : "bg-bg-subtle/40"}
              hover:bg-primary-subtle/30 transition-colors duration-150
            `}
          >
            <div className="p-3.5 pl-4">
              <span className="text-xs font-medium text-text-secondary">
                {feature.label}
              </span>
            </div>
            {([feature.free, feature.basic, feature.pro, feature.enterprise] as (boolean | string)[]).map(
              (val, j) => (
                <div
                  key={j}
                  className={`
                    p-3.5 flex items-center justify-center
                    ${j === 2 ? "bg-primary-subtle/50" : ""}
                  `}
                >
                  <ComparisonCell value={val} />
                </div>
              )
            )}
          </div>
        ))}

        {/* Show more / less */}
        {!expanded && (
          <div className="relative">
            <div className="absolute -top-12 left-0 right-0 h-12 bg-linear-to-t from-bg-surface to-transparent pointer-events-none" />
          </div>
        )}
      </div>

      {/* Toggle button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="
            inline-flex items-center gap-2 px-4 py-2 rounded-xl
            text-sm font-medium text-text-muted
            hover:text-text-primary hover:bg-bg-subtle
            border border-border hover:border-border-strong
            transition-all duration-150
          "
        >
          {expanded ? "Show less" : `Show all ${COMPARISON_FEATURES.length} features`}
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────

function FAQItem({ question, answer, index, inView }: {
  question: string;
  answer:   string;
  index:    number;
  inView:   boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`
        border border-border rounded-2xl overflow-hidden
        transition-all duration-500
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="
          w-full flex items-center justify-between
          px-5 py-4 text-left
          hover:bg-bg-subtle transition-colors duration-150
          gap-4
        "
      >
        <span className="text-sm font-semibold text-text-primary">
          {question}
        </span>
        <ChevronDown
          size={16}
          className={`
            text-text-muted shrink-0
            transition-transform duration-200
            ${open ? "rotate-180" : "rotate-0"}
          `}
        />
      </button>

      <div
        className={`
          overflow-hidden transition-all duration-300
          ${open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="px-5 pb-4 border-t border-border pt-3">
          <p className="text-sm text-text-secondary leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

function FAQSection() {
  const { ref, inView } = useInView(0.05);

  return (
    <div
      ref={ref}
      className="mt-20"
    >
      <div className="text-center mb-10">
        <h3 className="font-heading font-extrabold text-2xl text-text-primary mb-2">
          Frequently asked questions
        </h3>
        <p className="text-sm text-text-muted">
          Still unsure? We have answered the most common questions below.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-3">
        {FAQS.map((faq, i) => (
          <FAQItem
            key={faq.question}
            question={faq.question}
            answer={faq.answer}
            index={i}
            inView={inView}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Trust strip
// ─────────────────────────────────────────────────────────────

function TrustStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
      {TRUST_ITEMS.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 text-text-muted"
        >
          <span className="text-success">{item.icon}</span>
          <span className="text-sm font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────

function SectionHeader({ cycle, onCycleChange }: {
  cycle:          BillingCycle;
  onCycleChange:  (c: BillingCycle) => void;
}) {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className={`
        text-center max-w-2xl mx-auto mb-12
        transition-all duration-700
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
    >
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-subtle border border-primary-muted mb-5">
        <Zap size={11} className="text-primary" fill="currentColor" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          Simple pricing
        </span>
      </div>

      <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight mb-5">
        Plans that grow{" "}
        <span className="text-primary">with your business</span>
      </h2>

      <p className="text-lg text-text-secondary leading-relaxed mb-8">
        Start free. Upgrade when you are ready.
        No hidden fees, no long-term contracts —
        just honest pricing in naira.
      </p>

      {/* Billing toggle */}
      <BillingToggle cycle={cycle} onChange={onCycleChange} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Enterprise CTA banner
// ─────────────────────────────────────────────────────────────

function EnterpriseBanner() {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className={`
        mt-8 rounded-2xl border border-border bg-bg-surface p-6
        flex flex-col sm:flex-row items-center justify-between gap-4
        transition-all duration-700
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
    >
      <div className="text-center sm:text-left">
        <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
          <Headphones size={16} className="text-primary" />
          <span className="text-sm font-semibold text-text-primary">
            Need a custom plan?
          </span>
        </div>
        <p className="text-sm text-text-muted">
          Running a large operation with specific needs?
          Talk to our team — we will build a package that fits.
        </p>
      </div>
      <a
        href="mailto:sales@stocksense.app"
        className="
          shrink-0 inline-flex items-center gap-2
          px-5 py-2.5 rounded-xl text-sm font-semibold
          border border-border text-text-primary
          hover:bg-bg-subtle hover:border-border-strong
          transition-all duration-150
        "
      >
        Contact sales
        <ArrowRight size={14} />
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main section
// ─────────────────────────────────────────────────────────────

export default function PricingSection() {
  const [cycle, setCycle]   = useState<BillingCycle>("monthly");
  const { ref, inView }     = useInView(0.05);

  return (
    <section
      id="pricing"
      className="py-24 lg:py-32 bg-bg-base relative overflow-hidden"
    >
      {/* Background decoration */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-225 h-125 rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: "radial-gradient(circle, #0F6E56, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header + toggle */}
        <SectionHeader cycle={cycle} onCycleChange={setCycle} />

        {/* Plan cards */}
        <div
          ref={ref}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start"
        >
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

        {/* Trust strip */}
        <TrustStrip />

        {/* Enterprise banner */}
        <EnterpriseBanner />

        {/* Comparison table */}
        <ComparisonTable />

        {/* FAQ */}
        <FAQSection />

      </div>
    </section>
  );
}