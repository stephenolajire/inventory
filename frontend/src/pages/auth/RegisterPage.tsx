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
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

// ─── Validation Schema ───
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

// ─── Plans Data ───
const PLANS = [
  { id: "free", name: "Free", price: 0, features: ["20 products", "Scanning"] },
  {
    id: "basic",
    name: "Basic",
    price: 10,
    features: ["100 products", "Daily summary"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 18,
    features: ["1,000 products", "Analytics"],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 35,
    features: ["Unlimited", "Support"],
  },
];

// ─── Components ───

function FieldWrap({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <XCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const passed = [/.{8,}/, /\d/, /[a-zA-Z]/, /[^a-zA-Z0-9]/].filter((r) =>
    r.test(password),
  ).length;
  const colors = [
    "bg-slate-200",
    "bg-red-400",
    "bg-orange-400",
    "bg-amber-400",
    "bg-green-500",
  ];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${i <= passed ? colors[passed] : "bg-slate-100"}`}
          />
        ))}
      </div>
      <p className="text-[10px] text-slate-400 text-right font-medium capitalize">
        {["Too short", "Weak", "Fair", "Good", "Strong"][passed]}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState("");
  const { register: registerMutation } = useAuth();
  const isLoading = registerMutation.isPending;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const onSubmit = (data: RegisterFormData) => {
    setApiError("");
    registerMutation.mutate(data, {
      onSuccess: () => setSubmitted(true),
      onError: (err: any) => setApiError(err.message || "Registration failed"),
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Check your email
          </h2>
          <p className="mt-2 text-slate-500">
            We've sent a verification link to{" "}
            <span className="font-semibold text-slate-900">
              {watch("email")}
            </span>
          </p>
          <Link
            to={ROUTES.LOGIN}
            className="mt-8 w-full btn bg-green-600 text-white py-2 rounded-lg inline-block font-semibold"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shadow-md shadow-green-100">
              <Zap size={16} className="text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">StockSense</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Step {step} of 3
          </h1>
          <p className="text-slate-500 text-sm">
            {step === 1 && "Basic Information"}
            {step === 2 && "Security Details"}
            {step === 3 && "Select your plan"}
          </p>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 sm:p-10">
          {apiError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <FieldWrap
                    label="First Name"
                    error={errors.first_name?.message}
                  >
                    <input
                      {...register("first_name")}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Adaeze"
                    />
                  </FieldWrap>
                  <FieldWrap
                    label="Last Name"
                    error={errors.last_name?.message}
                  >
                    <input
                      {...register("last_name")}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Okonkwo"
                    />
                  </FieldWrap>
                </div>
                <FieldWrap label="Email Address" error={errors.email?.message}>
                  <input
                    {...register("email")}
                    type="email"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="ade@supermart.co.uk"
                  />
                </FieldWrap>
                <button
                  type="button"
                  onClick={async () =>
                    (await trigger(["first_name", "last_name", "email"])) &&
                    setStep(2)
                  }
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight size={18} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Password Field */}
                <FieldWrap label="Password" error={errors.password?.message}>
                  <div className="relative">
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none pr-10"
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <PasswordStrength password={watch("password") || ""} />
                </FieldWrap>

                {/* Confirm Password Field */}
                <FieldWrap
                  label="Confirm Password"
                  error={errors.confirm_password?.message}
                >
                  <div className="relative">
                    <input
                      {...register("confirm_password")}
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none pr-10"
                      placeholder="Repeat password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </FieldWrap>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={async () =>
                      (await trigger(["password", "confirm_password"])) &&
                      setStep(3)
                    }
                    className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2"
                  >
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-3">
                  {PLANS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setValue("plan", p.id)}
                      className={`p-4 text-left border rounded-xl transition-all ${watch("plan") === p.id ? "border-green-600 bg-green-50 ring-1 ring-green-600" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                    >
                      <div className="text-xs font-bold text-slate-500 mb-1 uppercase">
                        {p.name}
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        £{p.price.toLocaleString()}
                      </div>
                      <div className="mt-2 space-y-1">
                        {p.features.map((f) => (
                          <div
                            key={f}
                            className="text-[10px] text-slate-500 flex items-center gap-1"
                          >
                            <Check size={10} className="text-green-600" /> {f}
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-start gap-2">
                  <input
                    {...register("agree_terms")}
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-green-600 border-slate-300 rounded"
                  />
                  <label className="text-xs text-slate-500">
                    I agree to the{" "}
                    <Link
                      to="#"
                      className="text-green-600 font-semibold underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and Privacy Policy
                  </label>
                </div>
                {errors.agree_terms && (
                  <p className="text-xs text-red-500">
                    {errors.agree_terms.message}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                    disabled={isLoading}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      "Complete Registration"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                to={ROUTES.LOGIN}
                className="font-bold text-green-600 hover:text-green-500 underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
