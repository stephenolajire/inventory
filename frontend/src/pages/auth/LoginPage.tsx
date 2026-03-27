// src/pages/auth/LoginPage.tsx

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ROUTES } from "../../constants/routes";
import { useLogin, useResendVerification } from "../../hooks/auth/useAuth";
import { getApiErrorMessage } from "../../lib/axios";
import {
  Zap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  XCircle,
  Loader2,
  ShoppingCart,
  BarChart3,
  Package,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Validation schema
// ─────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember_me: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────────────────────────
// Status code responses
// ─────────────────────────────────────────────────────────────

const STATUS_MESSAGES: Record<
  string,
  { message: string; type: "error" | "warning" | "info" }
> = {
  email_not_verified: {
    message:
      "Please verify your email before logging in. Check your inbox for the verification link.",
    type: "warning",
  },
  pending_approval: {
    message:
      "Your account is under review. We will notify you by email once approved — usually within 24 hours.",
    type: "info",
  },
  account_rejected: {
    message:
      "Your application was not approved. Please contact support for more information.",
    type: "error",
  },
  account_suspended: {
    message: "Your account has been suspended. Please contact support.",
    type: "error",
  },
};

// ─────────────────────────────────────────────────────────────
// Left panel
// ─────────────────────────────────────────────────────────────

function LeftPanel() {
  const features = [
    {
      icon: <ShoppingCart size={18} />,
      title: "Barcode-powered counter",
      desc: "Scan products and complete sales in under a second",
    },
    {
      icon: <Package size={18} />,
      title: "Real-time inventory",
      desc: "Know your stock levels before they cost you a sale",
    },
    {
      icon: <BarChart3 size={18} />,
      title: "Revenue analytics",
      desc: "Daily charts, top products and rush hour heatmaps",
    },
  ];

  return (
    <div
      className="hidden lg:flex flex-col justify-between p-10 xl:p-14"
      style={{
        background:
          "linear-gradient(160deg, #061F18 0%, #0F6E56 60%, #0a5442 100%)",
      }}
    >
      {/* Logo */}
      <Link to="/" className="inline-flex items-center gap-2 group select-none">
        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <span className="font-heading font-extrabold text-xl tracking-tight text-white">
          Stock<span className="text-amber-400">Sense</span>
        </span>
      </Link>

      {/* Centre */}
      <div>
        <h2 className="font-heading font-extrabold text-3xl xl:text-4xl text-white leading-tight mb-3">
          Welcome back to StockSense
        </h2>
        <p className="text-green-200 text-base leading-relaxed mb-10">
          Your store data is waiting for you. Log in to see today's sales, check
          stock levels and serve your next customer.
        </p>

        {/* Feature list */}
        <div className="space-y-5">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-green-300 shrink-0">
                {f.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-white mb-0.5">
                  {f.title}
                </div>
                <div className="text-xs text-green-300 leading-relaxed">
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stat strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: "2,400+", label: "Vendors" },
          { value: "4.9/5", label: "Rating" },
          { value: "99.9%", label: "Uptime" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white/10 border border-white/10 rounded-xl p-3 text-center"
          >
            <div className="font-heading font-extrabold text-lg text-white">
              {s.value}
            </div>
            <div className="text-xs text-green-300">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Status banner
// ─────────────────────────────────────────────────────────────

function StatusBanner({
  code,
  customMessage,
}: {
  code?: string;
  customMessage?: string;
}) {
  if (!code && !customMessage) return null;

  const config = code ? STATUS_MESSAGES[code] : null;
  const message = customMessage || config?.message;
  const type = config?.type ?? "error";

  if (!message) return null;

  const styles = {
    error: "bg-error-subtle border-error-muted text-error",
    warning: "bg-warning-subtle border-warning-muted text-warning",
    info: "bg-info-subtle border-info-muted text-info",
  };

  const icons = {
    error: <XCircle size={15} className="shrink-0 mt-0.5" />,
    warning: <AlertCircle size={15} className="shrink-0 mt-0.5" />,
    info: <CheckCircle2 size={15} className="shrink-0 mt-0.5" />,
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border mb-5 ${styles[type]}`}
    >
      {icons[type]}
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Divider
// ─────────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-text-muted font-medium">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main login page
// ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  const location = useLocation();
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiCode, setApiCode] = useState("");

  // ── Hooks ──
  // useLogin's own onSuccess already calls navigate() + setAuth,
  // so we only need to handle error state locally here.
  const login = useLogin();
  const resendVerification = useResendVerification();

  const isLoading = login.isPending;

  // Redirect destination after login — passed via location state
  // by a ProtectedRoute that redirected the user here.
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    ROUTES.DASHBOARD;

  // ── Form ──

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember_me: false },
  });

  const watchEmail = watch("email", "");

  // ── Submit ──

  function onSubmit(data: LoginFormData) {
    setApiError("");
    setApiCode("");

    login.mutate(
      {
        email: data.email,
        password: data.password,
        // remember_me is a client-only preference; include it only
        // if your backend LoginRequest type accepts it
        // remember_me: data.remember_me,
      },
      {
        // hook's onSuccess handles navigate() — we only need onError here
        onError: (err: Error) => {
          // The API may return a machine-readable `code` field
          // (e.g. "email_not_verified") alongside the human message.
          // Axios errors carry response data on err.response.data.
          const axiosErr = err as any;
          const code = axiosErr?.response?.data?.code as string | undefined;

          if (code && STATUS_MESSAGES[code]) {
            setApiCode(code);
          } else {
            setApiError(getApiErrorMessage(err));
          }
        },
      },
    );
  }

  // ── Resend verification ──

  function handleResend() {
    if (!watchEmail) return;
    resendVerification.mutate({ email: watchEmail });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg-base">
      {/* ── Left panel ── */}
      <LeftPanel />

      {/* ── Right panel ── */}
      <div className="flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-border">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
              <Zap size={14} className="text-white" fill="white" />
            </div>
            <span className="font-heading font-extrabold text-lg tracking-tight text-text-primary">
              Stock<span className="text-primary">Sense</span>
            </span>
          </Link>
          <Link
            to={ROUTES.REGISTER}
            className="text-sm text-text-muted hover:text-text-primary transition-colors duration-150"
          >
            Create account
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="font-heading font-extrabold text-2xl text-text-primary mb-1">
                Log in to your account
              </h1>
              <p className="text-sm text-text-muted">
                Welcome back — enter your details below
              </p>
            </div>

            {/* Status banners */}
            <StatusBanner code={apiCode} />
            <StatusBanner customMessage={apiError} />

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Email address
                  <span className="text-error ml-1">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="ade@supermart.ng"
                    autoComplete="email"
                    autoFocus
                    className={`input pl-9 ${errors.email ? "input-error" : ""}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-error mt-1.5 flex items-center gap-1">
                    <XCircle size={11} />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-text-secondary">
                    Password
                    <span className="text-error ml-1">*</span>
                  </label>
                  <Link
                    to={ROUTES.FORGOT_PASSWORD}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    {...register("password")}
                    type={showPwd ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`input pl-9 pr-10 ${errors.password ? "input-error" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors duration-150"
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-error mt-1.5 flex items-center gap-1">
                    <XCircle size={11} />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <div className="relative shrink-0">
                    <input
                      {...register("remember_me")}
                      type="checkbox"
                      className="sr-only peer"
                    />
                    <div
                      className="
                        w-4 h-4 rounded border-2 border-border
                        peer-checked:bg-primary peer-checked:border-primary
                        group-hover:border-primary-muted
                        transition-all duration-150
                        flex items-center justify-center
                      "
                    >
                      <CheckCircle2
                        size={10}
                        className="text-white opacity-0 peer-checked:opacity-100"
                      />
                    </div>
                  </div>
                  <span className="text-sm text-text-secondary">
                    Remember me for 30 days
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-md w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Log in
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <Divider label="New to StockSense?" />

            {/* Register CTA */}
            <Link
              to={ROUTES.REGISTER}
              className="btn btn-surface btn-md w-full group"
            >
              <Zap size={14} className="text-primary" />
              Create a free account
              <ArrowRight
                size={14}
                className="ml-auto text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all duration-150"
              />
            </Link>

            {/* Resend verification — shown when email_not_verified */}
            {apiCode === "email_not_verified" && watchEmail && (
              <div className="mt-4 p-4 rounded-xl bg-bg-subtle border border-border">
                <p className="text-xs text-text-muted mb-2">
                  Did not receive the verification email?
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={
                    resendVerification.isPending || resendVerification.isSuccess
                  }
                  className="text-xs font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendVerification.isSuccess
                    ? "Verification email sent ✓"
                    : resendVerification.isPending
                      ? "Sending..."
                      : "Resend verification email →"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <p className="text-xs text-center text-text-muted">
            By logging in you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
