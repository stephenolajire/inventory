// src/pages/vendor/settings/components/SecuritySection.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Save, ShieldCheck } from "lucide-react";
import { useChangePassword } from "../../../../hooks/auth/useAuth";
import { cn } from "../../../../lib/utils";

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

// ─────────────────────────────────────────────────────────────
// Sub-component: password field
// ─────────────────────────────────────────────────────────────

function PasswordField({
  label,
  registration,
  show,
  onToggle,
  error,
}: {
  label: string;
  registration: ReturnType<
    ReturnType<typeof useForm<PasswordFormData>>["register"]
  >;
  show: boolean;
  onToggle: () => void;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1.5">
        {label} <span className="text-error">*</span>
      </label>
      <div className="relative">
        <input
          {...registration}
          type={show ? "text" : "password"}
          className={cn("input w-full pr-10", error && "input-error")}
        />
        <button
          type="button"
          onClick={onToggle}
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            text-text-muted hover:text-text-primary
            transition-colors duration-150
          "
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function SecuritySection() {
  const changePassword = useChangePassword();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  function onSubmit(data: PasswordFormData) {
    changePassword.mutate(
      {
        current_password: data.current_password,
        new_password: data.new_password,
      },
      { onSuccess: () => reset() },
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="font-heading font-bold text-base text-text-primary mb-0.5">
          Security
        </h2>
        <p className="text-xs text-text-muted">
          Change your password to keep your account secure
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-info-subtle border border-info-muted">
        <ShieldCheck size={15} className="text-info shrink-0 mt-0.5" />
        <p className="text-xs text-info leading-relaxed">
          Use at least 8 characters with a mix of letters, numbers and symbols.
          Never share your password with anyone.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordField
          label="Current password"
          registration={register("current_password")}
          show={showCurrent}
          onToggle={() => setShowCurrent((v) => !v)}
          error={errors.current_password?.message}
        />
        <PasswordField
          label="New password"
          registration={register("new_password")}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
          error={errors.new_password?.message}
        />
        <PasswordField
          label="Confirm new password"
          registration={register("confirm_password")}
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          error={errors.confirm_password?.message}
        />

        <div className="pt-1">
          <button
            type="submit"
            disabled={!isDirty || changePassword.isPending}
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center gap-2
              px-5 py-2.5 rounded-xl
              bg-primary text-white text-sm font-semibold
              hover:bg-primary-hover shadow-sm
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150 active:scale-95
            "
          >
            {changePassword.isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Updating...
              </>
            ) : (
              <>
                <Save size={15} /> Update password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
