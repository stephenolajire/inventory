// src/pages/auth/RegisterPage.tsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ROUTES } from "../../constants/routes";
import {
  Zap,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ArrowRight,
  User,
  Mail,
  Lock,
  Building2,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    first_name: z.string().min(2, "At least 2 characters"),
    last_name: z.string().min(2, "At least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirm_password: z.string(),
    plan: z.string().min(1, "Select a plan"),
    billing_cycle: z.enum(["monthly", "yearly"]),
    agree_terms: z.boolean().refine((v) => v === true, { message: "Required" }),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ─────────────────────────────────────────────────────────────
// Plans
// ─────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlight: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Try it out",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ["20 products", "Barcode scanning", "Basic history"],
    highlight: false,
  },
  {
    id: "basic",
    name: "Basic",
    tagline: "Growing stores",
    monthlyPrice: 4500,
    yearlyPrice: 3600,
    features: ["100 products", "Full sales history", "Daily summary"],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Full business insight",
    monthlyPrice: 12000,
    yearlyPrice: 9600,
    features: ["1,000 products", "Analytics dashboard", "PDF reports"],
    highlight: true,
    badge: "Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Multi-branch ops",
    monthlyPrice: 28000,
    yearlyPrice: 22400,
    features: ["Unlimited products", "Multi-branch", "Dedicated support"],
    highlight: false,
  },
];

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Password" },
  { id: 3, label: "Plan" },
];

const PASSWORD_RULES = [
  { label: "8+ characters", pass: (v: string) => v.length >= 8 },
  { label: "Contains number", pass: (v: string) => /\d/.test(v) },
  { label: "Contains letter", pass: (v: string) => /[a-zA-Z]/.test(v) },
  { label: "Special character", pass: (v: string) => /[^a-zA-Z0-9]/.test(v) },
];

// ─────────────────────────────────────────────────────────────
// Design tokens (inline — keeps component self-contained)
// ─────────────────────────────────────────────────────────────

const T = {
  // Right panel bg
  panelBg: "#0f0f0f",
  panelBorder: "#1f1f1f",
  // Input
  inputBg: "#161616",
  inputBorder: "#2a2a2a",
  inputBorderFocus: "#f59e0b", // amber-400
  inputText: "#f5f5f5",
  inputPlaceholder: "#525252",
  // Card
  cardBg: "#141414",
  cardBorder: "#222222",
  // Accent
  amber: "#f59e0b",
  amberDim: "#d97706",
  amberSubtle: "rgba(245,158,11,0.10)",
  amberBorder: "rgba(245,158,11,0.25)",
  // Text
  textPrimary: "#f5f5f5",
  textSecondary: "#a3a3a3",
  textMuted: "#525252",
  // Status
  success: "#22c55e",
  successSubtle: "rgba(34,197,94,0.08)",
  error: "#ef4444",
  errorSubtle: "rgba(239,68,68,0.08)",
};

// ─────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────

function StyledInput({
  icon: Icon,
  type = "text",
  placeholder,
  autoComplete,
  className = "",
  rightSlot,
  error,
  ...props
}: {
  icon?: React.ElementType;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  error?: boolean;
  rightSlot?: React.ReactNode;
  [key: string]: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={14}
          style={{ color: focused ? T.amber : T.inputPlaceholder }}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150"
        />
      )}
      <input
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full h-11 rounded-xl text-sm transition-all duration-150 outline-none ${Icon ? "pl-10" : "pl-4"} ${rightSlot ? "pr-10" : "pr-4"} ${className}`}
        style={{
          background: T.inputBg,
          border: `1px solid ${error ? T.error : focused ? T.inputBorderFocus : T.inputBorder}`,
          color: T.inputText,
        }}
        {...props}
      />
      {rightSlot && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      )}
    </div>
  );
}

function FieldWrap({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-xs font-semibold tracking-wide uppercase"
        style={{ color: T.textMuted }}
      >
        {label}
        {required && (
          <span style={{ color: T.amber }} className="ml-1">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p
          className="text-xs flex items-center gap-1"
          style={{ color: T.error }}
        >
          <XCircle size={10} />
          {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Password strength
// ─────────────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const passed = PASSWORD_RULES.filter((r) => r.pass(password)).length;
  const bars = [
    {
      active: passed >= 1,
      color:
        passed <= 1
          ? T.error
          : passed <= 2
            ? "#f97316"
            : passed <= 3
              ? "#eab308"
              : T.success,
    },
    {
      active: passed >= 2,
      color: passed <= 2 ? "#f97316" : passed <= 3 ? "#eab308" : T.success,
    },
    { active: passed >= 3, color: passed <= 3 ? "#eab308" : T.success },
    { active: passed >= 4, color: T.success },
  ];
  const label = ["", "Weak", "Fair", "Good", "Strong"][passed];

  return (
    <div className="mt-3 space-y-2.5">
      <div className="flex gap-1.5">
        {bars.map((b, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-400"
            style={{ background: b.active ? b.color : T.inputBorder }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {PASSWORD_RULES.map((r) => (
            <div key={r.label} className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
                style={{
                  background: r.pass(password) ? T.success : T.textMuted,
                }}
              />
              <span
                className="text-xs transition-colors duration-200"
                style={{ color: r.pass(password) ? T.success : T.textMuted }}
              >
                {r.label}
              </span>
            </div>
          ))}
        </div>
        {label && (
          <span
            className="text-xs font-bold shrink-0"
            style={{
              color:
                passed <= 1
                  ? T.error
                  : passed <= 2
                    ? "#f97316"
                    : passed <= 3
                      ? "#eab308"
                      : T.success,
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-10">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border"
              style={{
                background:
                  current > step.id
                    ? T.amber
                    : current === step.id
                      ? T.amberSubtle
                      : "transparent",
                borderColor: current >= step.id ? T.amber : T.inputBorder,
                color:
                  current > step.id
                    ? "#000"
                    : current === step.id
                      ? T.amber
                      : T.textMuted,
              }}
            >
              {current > step.id ? <Check size={13} /> : step.id}
            </div>
            <span
              className="text-xs font-medium"
              style={{
                color: current >= step.id ? T.textSecondary : T.textMuted,
              }}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="flex-1 h-px mx-3 mb-5 overflow-hidden rounded-full"
              style={{ background: T.inputBorder }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  background: T.amber,
                  width: current > step.id ? "100%" : "0%",
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Left panel
// ─────────────────────────────────────────────────────────────

function LeftPanel() {
  return (
    <div
      className="hidden lg:flex flex-col relative overflow-hidden"
      style={{ background: "#080808" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{
          background: "rgba(245,158,11,0.06)",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{
          background: "rgba(245,158,11,0.04)",
          transform: "translate(-30%, 30%)",
        }}
      />

      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2.5 w-fit group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: T.amberSubtle,
              border: `1px solid ${T.amberBorder}`,
            }}
          >
            <Zap size={17} style={{ color: T.amber }} fill={T.amber} />
          </div>
          <span
            className="font-heading font-extrabold text-xl tracking-tight"
            style={{ color: T.textPrimary }}
          >
            Stock<span style={{ color: T.amber }}>Sense</span>
          </span>
        </Link>

        {/* Main content */}
        <div>
          {/* Label */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{
              background: T.amberSubtle,
              border: `1px solid ${T.amberBorder}`,
              color: T.amber,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: T.amber }}
            />
            2,400+ vendors already on board
          </div>

          {/* Headline */}
          <h2
            className="font-heading font-extrabold leading-[1.05] mb-5"
            style={{
              fontSize: "clamp(2rem, 3.5vw, 3.2rem)",
              color: T.textPrimary,
            }}
          >
            Your inventory, <span style={{ color: T.amber }}>always</span>
            <br />
            under control.
          </h2>

          <p
            className="text-sm leading-relaxed mb-10 max-w-xs"
            style={{ color: T.textSecondary }}
          >
            Set up in 5 minutes. Scan your first product today. Built for
            Nigerian vendors who mean business.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { value: "2,400+", label: "Active vendors" },
              { value: "₦2.1B+", label: "Revenue tracked" },
              { value: "180k+", label: "Products managed" },
            ].map((s) => (
              <div
                key={s.label}
                className="p-4 rounded-2xl"
                style={{
                  background: "#0f0f0f",
                  border: `1px solid ${T.cardBorder}`,
                }}
              >
                <div
                  className="font-heading font-extrabold text-xl leading-none mb-1"
                  style={{ color: T.amber }}
                >
                  {s.value}
                </div>
                <div className="text-xs" style={{ color: T.textMuted }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div
            className="p-5 rounded-2xl"
            style={{
              background: "#0f0f0f",
              border: `1px solid ${T.cardBorder}`,
            }}
          >
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{ background: T.amber }}
                />
              ))}
            </div>
            <p
              className="text-sm italic leading-relaxed mb-4"
              style={{ color: T.textSecondary }}
            >
              "StockSense paid for itself in the first week. Found out my top
              product was nearly out of stock — saved me a huge loss."
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: T.amberSubtle,
                  border: `1px solid ${T.amberBorder}`,
                  color: T.amber,
                }}
              >
                AO
              </div>
              <div>
                <div
                  className="text-xs font-semibold"
                  style={{ color: T.textPrimary }}
                >
                  Adaeze Okonkwo
                </div>
                <div className="text-xs" style={{ color: T.textMuted }}>
                  Ade's Supermart, Lagos
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs" style={{ color: T.textMuted }}>
          © {new Date().getFullYear()} StockSense Technologies Ltd. · Made with
          ♥ in Nigeria
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────────────────────

function Step1({
  register,
  errors,
  onNext,
}: {
  register: any;
  errors: any;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <FieldWrap
          label="First name"
          error={errors.first_name?.message}
          required
        >
          <StyledInput
            {...register("first_name")}
            icon={User}
            placeholder="Adaeze"
            autoComplete="given-name"
            error={!!errors.first_name}
          />
        </FieldWrap>
        <FieldWrap label="Last name" error={errors.last_name?.message} required>
          <StyledInput
            {...register("last_name")}
            icon={User}
            placeholder="Okonkwo"
            autoComplete="family-name"
            error={!!errors.last_name}
          />
        </FieldWrap>
      </div>

      <FieldWrap label="Email address" error={errors.email?.message} required>
        <StyledInput
          {...register("email")}
          icon={Mail}
          type="email"
          placeholder="ade@supermart.ng"
          autoComplete="email"
          error={!!errors.email}
        />
      </FieldWrap>

      <FieldWrap label="Business name">
        <StyledInput
          icon={Building2}
          placeholder="Ade's Supermart (optional)"
          autoComplete="organization"
        />
      </FieldWrap>

      <button
        type="button"
        onClick={onNext}
        className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 mt-2 group"
        style={{ background: T.amber, color: "#000" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = T.amberDim)}
        onMouseLeave={(e) => (e.currentTarget.style.background = T.amber)}
      >
        Continue{" "}
        <ChevronRight
          size={15}
          className="group-hover:translate-x-0.5 transition-transform"
        />
      </button>
    </div>
  );
}

function Step2({
  register,
  errors,
  watchPwd,
  onNext,
  onBack,
}: {
  register: any;
  errors: any;
  watchPwd: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      tabIndex={-1}
      className="transition-colors duration-150"
      style={{ color: show ? T.amber : T.textMuted }}
    >
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );

  return (
    <div className="space-y-5">
      <FieldWrap label="Password" error={errors.password?.message} required>
        <StyledInput
          {...register("password")}
          icon={Lock}
          type={showPwd ? "text" : "password"}
          placeholder="Create a strong password"
          autoComplete="new-password"
          error={!!errors.password}
          rightSlot={eyeBtn(showPwd, () => setShowPwd((v) => !v))}
        />
        <PasswordStrength password={watchPwd} />
      </FieldWrap>

      <FieldWrap
        label="Confirm password"
        error={errors.confirm_password?.message}
        required
      >
        <StyledInput
          {...register("confirm_password")}
          icon={Lock}
          type={showConfirm ? "text" : "password"}
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={!!errors.confirm_password}
          rightSlot={eyeBtn(showConfirm, () => setShowConfirm((v) => !v))}
        />
      </FieldWrap>

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          className="h-11 px-4 rounded-xl text-sm font-semibold flex items-center justify-center border transition-colors duration-150"
          style={{
            borderColor: T.inputBorder,
            color: T.textSecondary,
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = T.amber;
            (e.currentTarget as HTMLButtonElement).style.color = T.amber;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              T.inputBorder;
            (e.currentTarget as HTMLButtonElement).style.color =
              T.textSecondary;
          }}
        >
          <ChevronLeft size={15} />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 group"
          style={{ background: T.amber, color: "#000" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.amberDim)}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.amber)}
        >
          Continue{" "}
          <ChevronRight
            size={15}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      </div>
    </div>
  );
}

function Step3({
  register,
  errors,
  watchPlan,
  watchCycle,
  setValue,
  onBack,
  isLoading,
}: {
  register: any;
  errors: any;
  watchPlan: string;
  watchCycle: string;
  setValue: any;
  onBack: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Billing toggle */}
      <div
        className="flex p-1 rounded-xl gap-1"
        style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}
      >
        {(["monthly", "yearly"] as const).map((cycle) => (
          <button
            key={cycle}
            type="button"
            onClick={() => setValue("billing_cycle", cycle)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200"
            style={{
              background: watchCycle === cycle ? T.amber : "transparent",
              color: watchCycle === cycle ? "#000" : T.textMuted,
            }}
          >
            {cycle}
            {cycle === "yearly" && (
              <span
                className="ml-1.5 text-xs font-bold"
                style={{ color: watchCycle === "yearly" ? "#000" : T.success }}
              >
                −20%
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-2 gap-3">
        {PLANS.map((plan) => {
          const price =
            watchCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
          const isSelected = watchPlan === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setValue("plan", plan.id)}
              className="relative text-left p-4 rounded-2xl transition-all duration-200"
              style={{
                background: isSelected ? T.amberSubtle : T.cardBg,
                border: `1px solid ${isSelected ? T.amber : plan.highlight ? "rgba(245,158,11,0.3)" : T.cardBorder}`,
                boxShadow: isSelected ? `0 0 0 1px ${T.amber}` : "none",
              }}
            >
              {plan.badge && (
                <span
                  className="absolute -top-2.5 left-3 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: T.amber, color: "#000" }}
                >
                  {plan.badge}
                </span>
              )}
              {isSelected && (
                <div
                  className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: T.amber }}
                >
                  <Check size={10} color="#000" />
                </div>
              )}
              <div
                className="font-heading font-extrabold text-sm mb-1 mt-1"
                style={{ color: isSelected ? T.amber : T.textPrimary }}
              >
                {plan.name}
              </div>
              <div className="mb-3">
                {price === 0 ? (
                  <span
                    className="text-base font-extrabold font-heading"
                    style={{ color: T.textPrimary }}
                  >
                    Free
                  </span>
                ) : (
                  <span
                    className="font-heading font-extrabold text-base"
                    style={{ color: T.textPrimary }}
                  >
                    ₦{price.toLocaleString()}
                    <span
                      className="text-xs font-normal"
                      style={{ color: T.textMuted }}
                    >
                      /mo
                    </span>
                  </span>
                )}
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <div
                      className="w-1 h-1 rounded-full shrink-0"
                      style={{ background: isSelected ? T.amber : T.textMuted }}
                    />
                    <span className="text-xs" style={{ color: T.textMuted }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {errors.plan && (
        <p
          className="text-xs flex items-center gap-1"
          style={{ color: T.error }}
        >
          <XCircle size={10} />
          {errors.plan.message}
        </p>
      )}

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative shrink-0 mt-0.5">
          <input
            {...register("agree_terms")}
            type="checkbox"
            className="sr-only peer"
          />
          <div
            className="w-4 h-4 rounded border-2 transition-all duration-150 flex items-center justify-center"
            style={{ borderColor: T.inputBorder }}
            // peer-checked handled inline for self-contained style
          >
            {/* We use a separate watched state approach in production — for demo, peer works */}
          </div>
        </div>
        <span
          className="text-xs leading-relaxed"
          style={{ color: T.textMuted }}
        >
          I agree to the{" "}
          <Link
            to="/terms"
            className="font-semibold hover:underline"
            style={{ color: T.amber }}
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            className="font-semibold hover:underline"
            style={{ color: T.amber }}
          >
            Privacy Policy
          </Link>
        </span>
      </label>
      {errors.agree_terms && (
        <p
          className="text-xs flex items-center gap-1 -mt-3 ml-7"
          style={{ color: T.error }}
        >
          <XCircle size={10} />
          {errors.agree_terms.message}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="h-11 px-4 rounded-xl text-sm font-semibold flex items-center justify-center border transition-colors duration-150"
          style={{
            borderColor: T.inputBorder,
            color: T.textSecondary,
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = T.amber;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              T.inputBorder;
          }}
        >
          <ChevronLeft size={15} />
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: T.amber, color: "#000" }}
          onMouseEnter={(e) => {
            if (!isLoading)
              (e.currentTarget as HTMLButtonElement).style.background =
                T.amberDim;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = T.amber;
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              <Zap size={14} fill="#000" />
              Create my account
              <ArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Success
// ─────────────────────────────────────────────────────────────

function SuccessState({ email }: { email: string }) {
  return (
    <div className="flex flex-col items-center text-center py-6">
      <div className="relative w-20 h-20 mb-6">
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ background: T.amberSubtle }}
        />
        <div
          className="relative w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: T.amberSubtle, border: `2px solid ${T.amber}` }}
        >
          <CheckCircle2 size={36} style={{ color: T.amber }} />
        </div>
      </div>
      <h2
        className="font-heading font-extrabold text-2xl mb-3"
        style={{ color: T.textPrimary }}
      >
        You're in!
      </h2>
      <p
        className="text-sm leading-relaxed mb-8 max-w-sm"
        style={{ color: T.textSecondary }}
      >
        We sent a verification link to{" "}
        <span className="font-semibold" style={{ color: T.textPrimary }}>
          {email}
        </span>
        . Click it to verify and submit your application.
      </p>

      <div
        className="w-full rounded-2xl p-5 mb-6 text-left"
        style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}
      >
        <h3 className="text-sm font-bold mb-4" style={{ color: T.textPrimary }}>
          What happens next
        </h3>
        <ul className="space-y-4">
          {[
            "Check your email and click the verification link",
            "Our team reviews your application — usually within 24h",
            "You receive your approval email with scanner details",
            "Log in, activate your plan and start selling",
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
                style={{
                  background: T.amberSubtle,
                  border: `1px solid ${T.amberBorder}`,
                  color: T.amber,
                }}
              >
                {i + 1}
              </div>
              <span
                className="text-sm pt-0.5"
                style={{ color: T.textSecondary }}
              >
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        to={ROUTES.LOGIN}
        className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-colors duration-150"
        style={{ borderColor: T.inputBorder, color: T.textSecondary }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = T.amber;
          (e.currentTarget as HTMLAnchorElement).style.color = T.amber;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor =
            T.inputBorder;
          (e.currentTarget as HTMLAnchorElement).style.color = T.textSecondary;
        }}
      >
        Go to login <ArrowRight size={14} />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [currentStep, setStep] = useState(1);
  const [apiError, setApiError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { register: registerMutation } = useAuth();
  const isLoading = registerMutation.isPending;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      billing_cycle: "monthly",
      plan: "pro",
      agree_terms: false,
    },
  });

  const watchPwd = watch("password", "");
  const watchPlan = watch("plan", "pro");
  const watchCycle = watch("billing_cycle", "monthly");
  const watchEmail = watch("email", "");

  async function goToStep2() {
    const ok = await trigger(["first_name", "last_name", "email"]);
    if (ok) setStep(2);
  }
  async function goToStep3() {
    const ok = await trigger(["password", "confirm_password"]);
    if (ok) setStep(3);
  }

  function onSubmit(data: RegisterFormData) {
    setApiError("");
    registerMutation.mutate(
      {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        plan: data.plan,
        billing_cycle: data.billing_cycle,
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err: Error) =>
          setApiError(err.message || "Registration failed. Please try again."),
      },
    );
  }

  return (
    <div
      className="min-h-screen grid lg:grid-cols-2"
      // style={{ background: T.panelBg }}
    >
      <LeftPanel />

      {/* Right panel */}
      <div
        className="flex flex-col min-h-screen"
        // style={{ background: T.panelBg }}
      >
        {/* Mobile header */}
        <div
          className="lg:hidden flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${T.panelBorder}` }}
        >
          <Link to="/" className="inline-flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: T.amberSubtle,
                border: `1px solid ${T.amberBorder}`,
              }}
            >
              <Zap size={13} style={{ color: T.amber }} fill={T.amber} />
            </div>
            <span
              className="font-heading font-extrabold text-lg tracking-tight"
              style={{ color: T.textPrimary }}
            >
              Stock<span style={{ color: T.amber }}>Sense</span>
            </span>
          </Link>
          <Link
            to={ROUTES.LOGIN}
            className="text-sm font-medium transition-colors duration-150"
            style={{ color: T.textMuted }}
          >
            Log in
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            {submitted ? (
              <SuccessState email={watchEmail} />
            ) : (
              <>
                {/* Heading */}
                <div className="mb-8">
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: T.amber }}
                  >
                    {
                      ["", "Step 1 of 3", "Step 2 of 3", "Step 3 of 3"][
                        currentStep
                      ]
                    }
                  </p>
                  <h1
                    className="font-heading font-extrabold text-2xl sm:text-3xl mb-1.5"
                    style={{ color: T.textPrimary }}
                  >
                    {currentStep === 1 && "Create your account"}
                    {currentStep === 2 && "Secure your account"}
                    {currentStep === 3 && "Choose your plan"}
                  </h1>
                  <p className="text-sm" style={{ color: T.textMuted }}>
                    {currentStep === 1 && "Tell us a bit about yourself"}
                    {currentStep === 2 &&
                      "Set a strong password to protect your data"}
                    {currentStep === 3 &&
                      "Pick a plan — you can always change later"}
                  </p>
                </div>

                <StepIndicator current={currentStep} />

                {apiError && (
                  <div
                    className="mb-5 flex items-start gap-3 p-4 rounded-xl"
                    style={{
                      background: T.errorSubtle,
                      border: `1px solid rgba(239,68,68,0.25)`,
                    }}
                  >
                    <XCircle
                      size={15}
                      style={{ color: T.error }}
                      className="shrink-0 mt-0.5"
                    />
                    <p className="text-sm" style={{ color: T.error }}>
                      {apiError}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  {currentStep === 1 && (
                    <Step1
                      register={register}
                      errors={errors}
                      onNext={goToStep2}
                    />
                  )}
                  {currentStep === 2 && (
                    <Step2
                      register={register}
                      errors={errors}
                      watchPwd={watchPwd}
                      onNext={goToStep3}
                      onBack={() => setStep(1)}
                    />
                  )}
                  {currentStep === 3 && (
                    <Step3
                      register={register}
                      errors={errors}
                      watchPlan={watchPlan}
                      watchCycle={watchCycle}
                      setValue={setValue}
                      onBack={() => setStep(2)}
                      isLoading={isLoading}
                    />
                  )}
                </form>

                <p
                  className="text-center text-sm mt-6"
                  style={{ color: T.textMuted }}
                >
                  Already have an account?{" "}
                  <Link
                    to={ROUTES.LOGIN}
                    className="font-bold hover:underline"
                    style={{ color: T.amber }}
                  >
                    Log in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4"
          style={{ borderTop: `1px solid ${T.panelBorder}` }}
        >
          <p className="text-xs text-center" style={{ color: T.textMuted }}>
            By creating an account you agree to our{" "}
            <Link
              to="/terms"
              className="hover:underline"
              style={{ color: T.amber }}
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="hover:underline"
              style={{ color: T.amber }}
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
