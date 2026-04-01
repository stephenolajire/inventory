// src/pages/auth/ResetPasswordPage.tsx
import { useState } from "react";
import { Link} from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ROUTES } from "../../constants/routes";
import { useResetPassword } from "../../hooks/auth/useAuth";
import {
  Zap,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  XCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
const [searchParams] = useSearchParams();
const token = searchParams.get("token");
//   const navigate = useNavigate();

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { mutate: resetPassword, isPending, error } = useResetPassword();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Token missing — show a clear error state
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Invalid reset link
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              This password reset link is missing or malformed. Please request a
              new one.
            </p>
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-green-600 hover:underline"
            >
              <ArrowLeft size={16} /> Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = (data: ResetPasswordFormData) => {
    resetPassword({
      token,
      new_password: data.new_password,
      confirm_password: data.confirm_password,
    });
    // Navigation to login is handled by useResetPassword's onSuccess
  };

  // Derive password strength for the indicator
  const newPassword = watch("new_password") ?? "";
  const strength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shadow-lg shadow-green-100">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            StockSense
          </span>
        </Link>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Set new password
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Choose a strong password. You'll use it to log in going forward.
              </p>
            </div>

            {/* API error */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <XCircle size={16} />
                {error.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    {...register("new_password")}
                    type={showNew ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-green-500 transition-all outline-none ${
                      errors.new_password
                        ? "border-red-500"
                        : "border-slate-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.new_password && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {errors.new_password.message}
                  </p>
                )}

                {/* Strength bar — only show once user starts typing */}
                {newPassword.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            strength.score >= level
                              ? strength.color
                              : "bg-slate-100"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strength.textColor}`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    {...register("confirm_password")}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter password"
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-green-500 transition-all outline-none ${
                      errors.confirm_password
                        ? "border-red-500"
                        : "border-slate-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {errors.confirm_password.message}
                  </p>
                )}

                {/* Match indicator */}
                {watch("confirm_password")?.length > 0 &&
                  !errors.confirm_password && (
                    <p className="mt-1.5 text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Passwords match
                    </p>
                  )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-all disabled:opacity-70"
              >
                {isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Reset password <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-green-600 transition-colors"
              >
                <ArrowLeft size={16} /> Back to log in
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Need help?{" "}
          <a
            href="mailto:support@stocksense.app"
            className="underline font-medium hover:text-slate-600"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

interface PasswordStrength {
  score: number; // 1–4
  label: string;
  color: string;   // bg-* class
  textColor: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels: PasswordStrength[] = [
    { score: 1, label: "Weak",      color: "bg-red-400",    textColor: "text-red-500" },
    { score: 2, label: "Fair",      color: "bg-amber-400",  textColor: "text-amber-500" },
    { score: 3, label: "Good",      color: "bg-blue-400",   textColor: "text-blue-500" },
    { score: 4, label: "Strong",    color: "bg-green-500",  textColor: "text-green-600" },
  ];

  return levels[score - 1] ?? levels[0];
}