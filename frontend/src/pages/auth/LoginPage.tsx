// src/pages/auth/LoginPage.tsx
import { useState } from "react";
import { Link} from "react-router-dom";
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
  Loader2,
  AlertCircle,
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember_me: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const STATUS_MESSAGES: Record<
  string,
  { message: string; type: "error" | "warning" | "info" }
> = {
  email_not_verified: {
    message: "Please verify your email before logging in.",
    type: "warning",
  },
  pending_approval: {
    message: "Your account is under review. Usually approved within 24h.",
    type: "info",
  },
  account_suspended: {
    message: "Your account has been suspended. Contact support.",
    type: "error",
  },
};

export default function LoginPage() {
  // const location = useLocation();
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiCode, setApiCode] = useState("");

  const login = useLogin();
  const resendVerification = useResendVerification();
  const isLoading = login.isPending;

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

  function onSubmit(data: LoginFormData) {
    setApiError("");
    setApiCode("");
    login.mutate(
      { email: data.email, password: data.password },
      {
        onError: (err: any) => {
          const code = err?.response?.data?.code;
          if (code && STATUS_MESSAGES[code]) setApiCode(code);
          else setApiError(getApiErrorMessage(err));
        },
      },
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shadow-lg shadow-green-200">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            StockSense
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-500">
          Enter your credentials to access your dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {/* Status Messages */}
          {(apiCode || apiError) && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-start gap-3 border ${apiCode && STATUS_MESSAGES[apiCode]?.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-red-50 border-red-200 text-red-800"}`}
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm">
                {apiError || STATUS_MESSAGES[apiCode]?.message}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="name@store.co.uk"
                  className={`w-full pl-10 pr-4 py-2 bg-slate-50 text-green-600 border rounded-lg focus:ring-2 focus:ring-green-500 transition-all ${errors.email ? "border-red-500" : "border-slate-200"}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-xs text-green-600 hover:text-green-500 font-semibold"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  {...register("password")}
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2 bg-slate-50 text-green-600 border rounded-lg focus:ring-2 focus:ring-green-500 transition-all ${errors.password ? "border-red-500" : "border-slate-200"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                {...register("remember_me")}
                id="remember"
                type="checkbox"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300 rounded"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-slate-600"
              >
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Log in"
              )}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Resend Verification */}
          {apiCode === "email_not_verified" && (
            <button
              onClick={() => resendVerification.mutate({ email: watchEmail })}
              className="mt-4 w-full text-xs text-center text-green-600 hover:underline font-medium"
            >
              {resendVerification.isSuccess
                ? "Check your inbox ✓"
                : "Resend verification email?"}
            </button>
          )}

          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="text-center text-sm text-slate-500">
              New here?{" "}
              <Link
                to={ROUTES.REGISTER}
                className="font-semibold text-green-600 hover:text-green-500"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          By logging in, you agree to our{" "}
          <a href="#" className="underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
