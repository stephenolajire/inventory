// src/pages/auth/ForgotPasswordPage.tsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ROUTES } from "../../constants/routes";
import {
  Zap,
  Mail,
  ArrowRight,
  ArrowLeft,
  XCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  RefreshCw,
//   AlertCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormData = z.infer<typeof emailSchema>;

// ─────────────────────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────────────────────

type Step = "request" | "sent";

// ─────────────────────────────────────────────────────────────
// Left panel
// ─────────────────────────────────────────────────────────────

function LeftPanel() {
  const steps = [
    {
      icon: <Mail size={18} />,
      title: "Enter your email",
      desc: "We look up your StockSense account using your email address",
    },
    {
      icon: <KeyRound size={18} />,
      title: "Check your inbox",
      desc: "A secure password reset link is sent to your email — valid for 24 hours",
    },
    {
      icon: <ShieldCheck size={18} />,
      title: "Set a new password",
      desc: "Click the link and choose a strong new password for your account",
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
      <Link to="/" className="inline-flex items-center gap-2 select-none group">
        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <span className="font-heading font-extrabold text-xl tracking-tight text-white">
          Stock<span className="text-amber-400">Sense</span>
        </span>
      </Link>

      {/* Centre content */}
      <div>
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-6">
          <KeyRound size={26} className="text-green-300" />
        </div>

        <h2 className="font-heading font-extrabold text-3xl xl:text-4xl text-white leading-tight mb-3">
          Reset your password safely
        </h2>
        <p className="text-green-200 text-base leading-relaxed mb-10">
          We use a secure link to verify your identity before letting you set a
          new password. No OTP to guess — just click the link.
        </p>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-start gap-4">
              {/* Number + icon */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-green-300">
                  {step.icon}
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-900">
                    {i + 1}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-white mb-0.5">
                  {step.title}
                </div>
                <div className="text-xs text-green-300 leading-relaxed">
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
        <ShieldCheck
          size={16}
          className="text-green-400 shrink-0 mt-0.5"
        />
        <p className="text-xs text-green-200 leading-relaxed">
          The reset link expires in 24 hours and can only be used once. If you
          did not request a reset, you can safely ignore the email.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Request step — email input
// ─────────────────────────────────────────────────────────────

interface RequestStepProps {
  onSuccess: (email: string) => void;
}

function RequestStep({ onSuccess }: RequestStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  async function onSubmit(data: EmailFormData) {
    setIsLoading(true);
    setApiError("");

    try {
      // Replace with your actual API call:
      // await forgotPasswordApi({ email: data.email });
      await new Promise((res) => setTimeout(res, 1200)); // mock
      onSuccess(data.email);
    } catch (err: any) {
      setApiError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary-subtle border border-primary-muted flex items-center justify-center mb-5">
          <KeyRound size={22} className="text-primary" />
        </div>
        <h1 className="font-heading font-extrabold text-2xl text-text-primary mb-1.5">
          Forgot your password?
        </h1>
        <p className="text-sm text-text-muted leading-relaxed">
          No problem. Enter the email address linked to your StockSense account
          and we will send you a secure reset link.
        </p>
      </div>

      {/* API error */}
      {apiError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-error-subtle border border-error-muted mb-5">
          <XCircle size={15} className="text-error shrink-0 mt-0.5" />
          <p className="text-sm text-error">{apiError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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

        {/* Info note */}
        {/* <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-info-subtle border border-info-muted">
          <AlertCircle size={14} className="text-info shrink-0 mt-0.5" />
          <p className="text-xs text-info leading-relaxed">
            For security, we always send the reset link even if the email is not
            registered — so you will not know if an email exists in our system.
          </p>
        </div> */}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="
            btn btn-primary btn-md w-full
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending reset link...
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {/* Back to login */}
      <div className="mt-6 flex items-center justify-center">
        <Link
          to={ROUTES.LOGIN}
          className="
            inline-flex items-center gap-2 text-sm text-text-muted
            hover:text-text-primary transition-colors duration-150
          "
        >
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sent step — confirmation
// ─────────────────────────────────────────────────────────────

interface SentStepProps {
  email: string;
  onResend: () => void;
}

function SentStep({ email, onResend }: SentStepProps) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  async function handleResend() {
    setResending(true);
    setResent(false);

    try {
      // Replace with your actual API call:
      // await forgotPasswordApi({ email });
      await new Promise((res) => setTimeout(res, 1000)); // mock
      setResent(true);
      setCountdown(60);

      // Countdown timer
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch {
      // silently fail — show a generic message
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated success ring */}
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full bg-success-subtle animate-ping opacity-20" />
        <div className="relative w-20 h-20 rounded-full bg-success-subtle border-2 border-success flex items-center justify-center">
          <Mail size={32} className="text-success" />
        </div>
      </div>

      <h2 className="font-heading font-extrabold text-2xl text-text-primary mb-3">
        Check your inbox
      </h2>

      <p className="text-sm text-text-secondary leading-relaxed mb-2 max-w-sm">
        We have sent a password reset link to
      </p>
      <p className="text-sm font-semibold text-text-primary mb-6">{email}</p>

      {/* Instructions card */}
      <div className="w-full bg-bg-subtle rounded-2xl border border-border p-5 mb-6 text-left">
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          What to do next
        </h3>
        <ul className="space-y-3">
          {[
            "Open the email from StockSense",
            'Click the "Reset my password" button',
            "Choose a new strong password",
            "Log in with your new password",
          ].map((item, i) => (
            <li key={item} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary-subtle border border-primary-muted flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">{i + 1}</span>
              </div>
              <span className="text-sm text-text-secondary">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Expiry note */}
      <div className="flex items-center gap-2 mb-6 text-xs text-text-muted">
        <ShieldCheck size={13} className="text-success" />
        The link expires in 24 hours and works only once
      </div>

      {/* Resent confirmation */}
      {resent && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-success-subtle border border-success-muted mb-4 w-full">
          <CheckCircle2 size={14} className="text-success shrink-0" />
          <span className="text-xs text-success font-medium">
            Reset link resent successfully
          </span>
        </div>
      )}

      {/* Resend button */}
      <button
        type="button"
        onClick={handleResend}
        disabled={resending || countdown > 0}
        className="
          inline-flex items-center gap-2 text-sm font-medium
          text-text-muted hover:text-text-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150 mb-6
        "
      >
        {resending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Resending...
          </>
        ) : countdown > 0 ? (
          <>
            <RefreshCw size={14} />
            Resend in {countdown}s
          </>
        ) : (
          <>
            <RefreshCw size={14} />
            Resend the email
          </>
        )}
      </button>

      {/* Spam note */}
      <div className="w-full p-4 rounded-xl bg-bg-subtle border border-border mb-6">
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-secondary">
            Not seeing it?
          </span>{" "}
          Check your spam or junk folder. The email comes from{" "}
          <span className="font-mono text-text-secondary">
            noreply@stocksense.app
          </span>
        </p>
      </div>

      {/* Wrong email */}
      <button
        type="button"
        onClick={onResend}
        className="text-xs text-text-muted hover:text-primary transition-colors duration-150 mb-4"
      >
        Used the wrong email? Try again →
      </button>

      {/* Back to login */}
      <Link
        to={ROUTES.LOGIN}
        className="
          btn btn-surface btn-md w-full
          inline-flex items-center justify-center gap-2
        "
      >
        <ArrowLeft size={15} />
        Back to login
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");

  function handleSuccess(submittedEmail: string) {
    setEmail(submittedEmail);
    setStep("sent");
  }

  function handleRetry() {
    setStep("request");
    setEmail("");
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
            to={ROUTES.LOGIN}
            className="text-sm text-text-muted hover:text-text-primary transition-colors duration-150"
          >
            Log in
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-2xl">
            {step === "request" ? (
              <RequestStep onSuccess={handleSuccess} />
            ) : (
              <SentStep email={email} onResend={handleRetry} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <p className="text-xs text-center text-text-muted">
            Remember your password?{" "}
            <Link
              to={ROUTES.LOGIN}
              className="text-primary font-semibold hover:underline"
            >
              Log in
            </Link>{" "}
            ·{" "}
            <Link
              to={ROUTES.REGISTER}
              className="text-primary font-semibold hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
