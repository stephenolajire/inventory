// src/pages/landing/HowItWorksSection.tsx

import { useState, useEffect, useRef } from "react";
import {
  UserPlus,
  Package,
  ShoppingCart,
  BarChart3,
  CheckCircle2,
  Zap,
  Clock,
  Scan,
  ChevronRight,
  Play,
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

interface Step {
  number:      number;
  icon:        React.ReactNode;
  label:       string;
  title:       string;
  description: string;
  bullets:     string[];
  duration:    string;
  visual:      React.ReactNode;
}

// ─────────────────────────────────────────────────────────────
// Step visuals
// ─────────────────────────────────────────────────────────────

function RegisterVisual() {
  const fields = [
    { label: "Business name", value: "Ade's Supermart",      filled: true },
    { label: "Email address", value: "ade@supermart.ng",     filled: true },
    { label: "Password",      value: "••••••••••••",          filled: true },
    { label: "Selected plan", value: "Pro — £12,000/month",  filled: true },
  ];

  const [step,    setStep]    = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (step < fields.length) {
      const t = setTimeout(() => setStep((p) => p + 1), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setChecked(true), 400);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div className="bg-bg-surface rounded-2xl border border-border shadow-lg overflow-hidden">

      {/* Card header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-green-600 flex items-center justify-center">
            <Zap size={12} className="text-white" fill="white" />
          </div>
          <span className="text-sm font-semibold text-text-primary">
            Create your account
          </span>
        </div>
        <p className="text-xs text-text-muted">Takes less than 5 minutes</p>
      </div>

      {/* Fields */}
      <div className="px-5 py-4 space-y-3">
        {fields.map((field, i) => (
          <div key={field.label}>
            <label className="text-xs font-medium text-text-muted block mb-1">
              {field.label}
            </label>
            <div
              className={`
                h-9 rounded-lg border px-3 flex items-center text-sm
                transition-all duration-500
                ${i < step
                  ? "border-green-500 bg-green-50 dark:bg-green-950/40 text-text-primary"
                  : "border-border bg-bg-subtle text-text-disabled"
                }
              `}
            >
              {i < step ? field.value : ""}
              {i === step && (
                <span className="w-0.5 h-4 bg-green-600 ml-0.5 animate-pulse" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="px-5 pb-5">
        <div
          className={`
            w-full h-10 rounded-xl flex items-center justify-center gap-2
            text-sm font-semibold transition-all duration-500
            ${checked
              ? "bg-green-600 text-white shadow-lg"
              : "bg-bg-muted text-text-disabled"
            }
          `}
        >
          {checked ? (
            <><CheckCircle2 size={15} /> Account created!</>
          ) : (
            "Create account"
          )}
        </div>

        {checked && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-warning-subtle border border-warning-muted">
            <Clock size={13} className="text-warning shrink-0" />
            <span className="text-xs text-warning">
              Under review — typically approved within 24h
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function AddProductsVisual() {
  const [activeField, setActiveField] = useState(0);
  const [barcode,     setBarcode]     = useState("");
  const [processing,  setProcessing]  = useState(false);
  const [done,        setDone]        = useState(false);

  const BARCODE_TARGET = "SS1A2B3C847201";

  useEffect(() => {
    const fieldTimer = setInterval(() => {
      setActiveField((p) => (p + 1) % 4);
    }, 1200);

    const barcodeTimer = setTimeout(() => {
      setProcessing(true);
      let i = 0;
      const charTimer = setInterval(() => {
        setBarcode(BARCODE_TARGET.slice(0, i + 1));
        i++;
        if (i >= BARCODE_TARGET.length) {
          clearInterval(charTimer);
          setTimeout(() => setDone(true), 400);
        }
      }, 80);
    }, 2400);

    return () => {
      clearInterval(fieldTimer);
      clearTimeout(barcodeTimer);
    };
  }, []);

  const fields = [
    { label: "Product name",  value: "Peak Milk 400g" },
    { label: "Category",      value: "Dairy"           },
    { label: "Selling price", value: "£2,800"          },
    { label: "Qty in stock",  value: "48 units"        },
  ];

  return (
    <div className="bg-bg-surface rounded-2xl border border-border shadow-lg overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">Add product</span>
        <span className="text-xs text-text-muted">Auto-generates barcode</span>
      </div>

      {/* Fields */}
      <div className="px-5 py-4 space-y-2.5">
        {fields.map((field, i) => (
          <div key={field.label} className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-24 shrink-0">
              {field.label}
            </span>
            <div
              className={`
                flex-1 h-8 rounded-lg border px-3 flex items-center
                text-xs font-medium transition-all duration-300
                ${i === activeField
                  ? "border-green-500 bg-green-50 dark:bg-green-950/40 text-text-primary"
                  : "border-border bg-bg-subtle text-text-secondary"
                }
              `}
            >
              {field.value}
              {i === activeField && (
                <span className="w-0.5 h-3 bg-green-600 ml-0.5 animate-pulse" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Barcode generation */}
      <div className="mx-5 mb-5 p-3 rounded-xl bg-bg-subtle border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-muted">
            Generated barcode
          </span>
          {done && (
            <span className="text-xs text-success font-semibold flex items-center gap-1">
              <CheckCircle2 size={11} />
              Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-px h-8">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className={`
                  w-0.5 transition-all duration-200
                  ${processing
                    ? i % 3 === 0
                      ? "bg-text-primary h-full"
                      : i % 5 === 0
                        ? "bg-text-primary h-3/4"
                        : "bg-text-secondary h-1/2"
                    : "bg-border h-full"
                  }
                `}
              />
            ))}
          </div>
          <code className="text-xs font-mono text-text-muted">
            {barcode || "Generating..."}
          </code>
        </div>
      </div>
    </div>
  );
}

function SellingVisual() {
  const [scanStep, setScanStep] = useState(0);
  const [paid,     setPaid]     = useState(false);

  const items = [
    { name: "Peak Milk 400g",  price: 2800, qty: 2 },
    { name: "Milo Tin 200g",   price: 1200, qty: 1 },
    { name: "Indomie Chicken", price: 150,  qty: 6 },
  ];

  useEffect(() => {
    if (paid) {
      const t = setTimeout(() => { setScanStep(0); setPaid(false); }, 3000);
      return () => clearTimeout(t);
    }
    if (scanStep < items.length) {
      const t = setTimeout(() => setScanStep((p) => p + 1), 1200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPaid(true), 1000);
    return () => clearTimeout(t);
  }, [scanStep, paid]);

  const visibleItems = items.slice(0, scanStep);
  const total        = visibleItems.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="bg-bg-surface rounded-2xl border border-border shadow-lg overflow-hidden">

      {/* Titlebar */}
      <div className="bg-green-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
          <span className="text-white text-xs font-semibold">Counter Screen</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Scan size={13} className="text-green-200" />
          <span className="text-green-200 text-xs">Scanning</span>
        </div>
      </div>

      {/* Items */}
      <div className="min-h-30 divide-y divide-border">
        {visibleItems.length === 0 ? (
          <div className="flex items-center justify-center h-30">
            <span className="text-xs text-text-muted">Scan first item...</span>
          </div>
        ) : (
          visibleItems.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between px-4 py-2.5"
            >
              <div>
                <div className="text-xs font-medium text-text-primary">{item.name}</div>
                <div className="text-xs text-text-muted">
                  £{item.price.toLocaleString()} × {item.qty}
                </div>
              </div>
              <div className="text-sm font-bold text-text-primary">
                £{(item.price * item.qty).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total + pay */}
      <div className="border-t border-border bg-bg-subtle px-4 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
            Total
          </span>
          <span className="text-lg font-extrabold text-text-primary font-heading">
            £{total.toLocaleString()}
          </span>
        </div>
        <div
          className={`
            w-full py-2.5 rounded-xl text-xs font-semibold text-center
            transition-all duration-500
            ${paid
              ? "bg-success-subtle text-success"
              : visibleItems.length > 0
                ? "bg-green-600 text-white shadow-md"
                : "bg-bg-muted text-text-disabled"
            }
          `}
        >
          {paid ? (
            <span className="flex items-center justify-center gap-1.5">
              <CheckCircle2 size={13} />
              Payment complete — £{total.toLocaleString()}
            </span>
          ) : (
            "Mark as Paid"
          )}
        </div>
      </div>
    </div>
  );
}

function GrowthVisual() {
  const weeks  = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
  const values = [28, 35, 31, 48, 53, 61, 58, 79];
  const maxVal = Math.max(...values);

  const stats = [
    { label: "Revenue this month", value: "£94,200",  trend: "+16%",    up: true  },
    { label: "Top product",        value: "Peak Milk", trend: "312 units", up: true  },
    { label: "Rush hour",          value: "4–6 PM",   trend: "Daily",   up: null  },
  ];

  return (
    <div className="bg-bg-surface rounded-2xl border border-border shadow-lg overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          Analytics overview
        </span>
        <span className="text-xs text-success font-semibold">
          +16% this month
        </span>
      </div>

      {/* Bar chart */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-end gap-1.5 h-16">
          {values.map((val, i) => (
            <div key={weeks[i]} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`
                  w-full rounded-t-sm transition-all duration-700
                  ${i === values.length - 1
                    ? "bg-green-600"
                    : "bg-bg-muted"
                  }
                `}
                style={{ height: `${(val / maxVal) * 52}px` }}
              />
              {i % 2 === 0 && (
                <span className="text-[9px] text-text-muted">{weeks[i]}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stat rows */}
      <div className="divide-y divide-border border-t border-border">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between px-5 py-2.5"
          >
            <span className="text-xs text-text-muted">{s.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-primary">
                {s.value}
              </span>
              <span
                className={`
                  text-xs font-medium px-1.5 py-0.5 rounded-full
                  ${s.up === true
                    ? "bg-success-subtle text-success"
                    : "bg-bg-subtle text-text-muted"
                  }
                `}
              >
                {s.trend}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Steps data
// ─────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    number:      1,
    icon:        <UserPlus size={22} />,
    label:       "Register",
    title:       "Create your account in 5 minutes",
    description: "Sign up with your business details and pick a plan that fits your size. Your application goes to our team for a quick review — most vendors are approved within 24 hours.",
    bullets: [
      "Free plan available with no credit card required",
      "Choose monthly or yearly billing upfront",
      "Admin reviews and approves your application",
      "A physical barcode scanner is assigned on approval",
    ],
    duration: "~5 min",
    visual:   <RegisterVisual />,
  },
  {
    number:      2,
    icon:        <Package size={22} />,
    label:       "Add products",
    title:       "Add your products once — scan forever",
    description: "Type in your product details and StockSense auto-generates a unique barcode for each one. Print the barcode labels, stick them on your shelves and you are ready to sell.",
    bullets: [
      "Barcode generated automatically in the background",
      "Set selling price, cost price and low stock threshold",
      "Add discounts with an expiry date",
      "Organised by category and brand",
    ],
    duration: "~10 min",
    visual:   <AddProductsVisual />,
  },
  {
    number:      3,
    icon:        <ShoppingCart size={22} />,
    label:       "Start selling",
    title:       "Scan, collect payment and move on",
    description: "Point your scanner at any barcode. The product lands in the cart instantly. Scan the same item again and the quantity increments. When the customer is ready, mark as paid and you are done.",
    bullets: [
      "0.3s average scan-to-cart response",
      "Cash, card and bank transfer all supported",
      "Automatic change calculation for cash",
      "Receipt generated for every completed sale",
    ],
    duration: "Ongoing",
    visual:   <SellingVisual />,
  },
  {
    number:      4,
    icon:        <BarChart3 size={22} />,
    label:       "Track growth",
    title:       "Watch your business grow with data",
    description: "Every sale feeds directly into your analytics dashboard. See daily and monthly revenue, discover your top products, find your rush hours and download PDF reports to share with your accountant.",
    bullets: [
      "Revenue charts updated in real time",
      "Top products by units sold and revenue",
      "Rush hour heatmap — 0 to 23h",
      "Monthly PDF reports auto-generated",
    ],
    duration: "Always on",
    visual:   <GrowthVisual />,
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
      className={`
        text-center max-w-2xl mx-auto mb-20
        transition-all duration-700
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
    >
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-subtle border border-primary-muted mb-5">
        <Play size={11} className="text-primary" fill="currentColor" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          How it works
        </span>
      </div>

      <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight mb-5">
        Up and selling in{" "}
        <span className="text-primary">under an hour</span>
      </h2>

      <p className="text-lg text-text-secondary leading-relaxed">
        StockSense is designed to get out of your way.
        Four steps from sign-up to your first sale —
        no technical knowledge needed.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step badge
// ─────────────────────────────────────────────────────────────

interface StepBadgeProps {
  number: number;
  active: boolean;
  done:   boolean;
}

function StepBadge({ number, active, done }: StepBadgeProps) {
  return (
    <div
      className={`
        w-10 h-10 rounded-full flex items-center justify-center
        font-heading font-extrabold text-sm shrink-0
        border-2 transition-all duration-500
        ${done
          ? "bg-green-600 border-green-600 text-white shadow-lg"
          : active
            ? "bg-bg-surface border-green-600 text-green-600 shadow-lg"
            : "bg-bg-subtle border-border text-text-muted"
        }
      `}
    >
      {done ? <CheckCircle2 size={18} /> : number}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step card — mobile accordion
// ─────────────────────────────────────────────────────────────

interface StepCardProps {
  step:     Step;
  index:    number;
  isActive: boolean;
  isDone:   boolean;
  onClick:  () => void;
}

function StepCard({ step, index, isActive, isDone, onClick }: StepCardProps) {
  const { ref, inView } = useInView(0.1);

  return (
    <div
      ref={ref}
      className={`
        transition-all duration-700
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <button
        onClick={onClick}
        className={`
          w-full text-left p-5 rounded-2xl border-2 transition-all duration-300
          ${isActive
            ? "border-green-600 bg-primary-subtle shadow-lg"
            : isDone
              ? "border-primary-muted bg-bg-surface hover:border-primary"
              : "border-border bg-bg-surface hover:border-border-strong hover:shadow-md"
          }
        `}
      >
        <div className="flex items-start gap-4">
          <StepBadge number={step.number} active={isActive} done={isDone} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span
                className={`
                  text-xs font-semibold uppercase tracking-wider
                  ${isActive || isDone ? "text-primary" : "text-text-muted"}
                `}
              >
                {step.label}
              </span>
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Clock size={11} />
                {step.duration}
              </span>
            </div>

            <h3
              className={`
                font-heading font-bold text-base leading-snug
                ${isActive ? "text-text-primary" : "text-text-secondary"}
              `}
            >
              {step.title}
            </h3>

            {/* Expanded content */}
            <div
              className={`
                overflow-hidden transition-all duration-500
                ${isActive ? "max-h-100 opacity-100 mt-3" : "max-h-0 opacity-0"}
              `}
            >
              <p className="text-sm text-text-muted leading-relaxed mb-3">
                {step.description}
              </p>
              <ul className="space-y-2">
                {step.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <CheckCircle2
                      size={13}
                      className="text-primary mt-0.5 shrink-0"
                    />
                    <span className="text-xs text-text-secondary">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Collapsed hint */}
            {!isActive && (
              <p className="text-xs text-text-muted mt-1 truncate">
                {step.description.slice(0, 60)}...
              </p>
            )}
          </div>

          <ChevronRight
            size={16}
            className={`
              shrink-0 mt-1 transition-all duration-300
              ${isActive ? "text-primary rotate-90" : "text-text-muted rotate-0"}
            `}
          />
        </div>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Desktop timeline
// ─────────────────────────────────────────────────────────────

function DesktopTimeline() {
  const { ref, inView } = useInView(0.1);

  return (
    <div
      ref={ref}
      className={`
        hidden lg:block
        transition-all duration-700
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
    >
      {/* Step number row */}
      <div className="flex items-center mb-8">
        {STEPS.map((step, i) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-heading font-extrabold text-sm shadow-lg">
                {step.number}
              </div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 bg-primary-muted mx-3 mb-6" />
            )}
          </div>
        ))}
      </div>

      {/* Titles row */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        {STEPS.map((step) => (
          <div key={step.title}>
            <div className="flex items-center gap-1.5 mb-1.5 text-text-muted">
              <Clock size={11} />
              <span className="text-xs">{step.duration}</span>
            </div>
            <h3 className="font-heading font-bold text-sm text-text-primary leading-snug">
              {step.title}
            </h3>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
              {step.description.slice(0, 80)}...
            </p>
          </div>
        ))}
      </div>

      {/* Visuals row */}
      <div className="grid grid-cols-4 gap-6">
        {STEPS.map((step) => (
          <div key={step.label} className="relative">
            <div
              className="absolute inset-0 rounded-2xl opacity-10 blur-xl"
              style={{ background: "radial-gradient(circle, #0F6E56, transparent 70%)" }}
              aria-hidden="true"
            />
            <div className="relative">{step.visual}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Mobile accordion
// ─────────────────────────────────────────────────────────────

function MobileAccordion() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveStep((p) => (p + 1) % STEPS.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="lg:hidden space-y-3">
      {STEPS.map((step, i) => (
        <div key={step.number}>
          <StepCard
            step={step}
            index={i}
            isActive={activeStep === i}
            isDone={i < activeStep}
            onClick={() => setActiveStep(i)}
          />
          <div
            className={`
              overflow-hidden transition-all duration-500
              ${activeStep === i
                ? "max-h-125 opacity-100 mt-3"
                : "max-h-0 opacity-0"
              }
            `}
          >
            <div className="relative">
              <div
                className="absolute inset-0 rounded-2xl opacity-10 blur-xl"
                style={{ background: "radial-gradient(circle, #0F6E56, transparent 70%)" }}
                aria-hidden="true"
              />
              <div className="relative">{step.visual}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className=" bg-bg-base relative overflow-hidden"
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(circle, #0F6E56 1px, transparent 1px)`,
          backgroundSize:  "40px 40px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />
        <DesktopTimeline />
        <MobileAccordion />
        {/* <BottomCTA /> */}
      </div>
    </section>
  );
}
