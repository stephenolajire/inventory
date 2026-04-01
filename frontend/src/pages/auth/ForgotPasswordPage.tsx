// src/pages/auth/ForgotPasswordPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ROUTES } from "../../constants/routes";
import { useForgotPassword } from "../../hooks/auth/useAuth";
import {
  Zap, Mail, ArrowRight, ArrowLeft,
  XCircle, Loader2, CheckCircle2, KeyRound, RefreshCw,
} from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormData = z.infer<typeof emailSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "sent">("request");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const { mutate: forgotPassword, isPending, error } = useForgotPassword();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = (data: EmailFormData) => {
    forgotPassword(
      { email: data.email },
      {
        onSuccess: () => {
          setSubmittedEmail(data.email);
          setStep("sent");
        },
      }
    );
  };

  const handleResend = () => {
    const email = getValues("email") || submittedEmail;
    forgotPassword(
      { email },
      {
        onSuccess: () => setStep("sent"),
      }
    );
    setStep("request");
  };

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
          {step === "request" ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Forgot password?
                </h2>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Enter your email and we'll send you a secure link to reset your account.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
                  <XCircle size={16} /> {error.message}
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
                      placeholder="ade@supermart.co.uk"
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-green-500 transition-all outline-none ${
                        errors.email ? "border-red-500" : "border-slate-200"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">
                      {errors.email.message}
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
                    <>Send reset link <ArrowRight size={16} /></>
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
          ) : (
            <div className="text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100/50">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Link is on its way
              </h2>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                We've sent a password reset link to <br />
                <span className="font-bold text-slate-900">{submittedEmail}</span>
              </p>

              <div className="mt-8 p-4 bg-slate-50 border border-slate-100 rounded-xl text-left">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Check your spam
                </p>
                <p className="text-xs text-slate-500">
                  If you don't see it within 2 minutes, check your junk folder or try again.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  onClick={handleResend}
                  disabled={isPending}
                  className="w-full py-2.5 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isPending
                    ? <Loader2 size={14} className="animate-spin" />
                    : <><RefreshCw size={14} /> Resend link</>
                  }
                </button>
                <Link
                  to={ROUTES.LOGIN}
                  className="block w-full py-2.5 px-4 text-sm font-bold text-green-600 hover:underline"
                >
                  Return to log in
                </Link>
              </div>
            </div>
          )}
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