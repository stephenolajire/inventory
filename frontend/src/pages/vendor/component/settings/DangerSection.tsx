// src/pages/vendor/settings/components/DangerSection.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2, Trash2, Eye, EyeOff } from "lucide-react";
import { useDeleteAccount } from "../../../../hooks/auth/useAuth";
import { cn } from "../../../../lib/utils";

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const deleteSchema = z
  .object({
    password: z.string().min(1, "Password is required"),
    confirm: z.string(),
  })
  .refine((d) => d.confirm === "DELETE", {
    message: 'Type "DELETE" to confirm',
    path: ["confirm"],
  });

type DeleteFormData = z.infer<typeof deleteSchema>;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function DangerSection() {
  const deleteAccount = useDeleteAccount();
  const [showForm, setShowForm] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeleteFormData>({ resolver: zodResolver(deleteSchema) });

  function onSubmit(data: DeleteFormData) {
    deleteAccount.mutate({ password: data.password });
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="font-heading font-bold text-base text-error mb-0.5">
          Danger zone
        </h2>
        <p className="text-xs text-text-muted">
          Irreversible and destructive actions
        </p>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-error-subtle border border-error-muted">
        <AlertTriangle size={15} className="text-error shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-error mb-1">
            Delete account
          </p>
          <p className="text-xs text-error leading-relaxed">
            Permanently deletes your account, all products, sales history and
            reports. Your scanner will be returned to the pool. This action
            cannot be undone.
          </p>
        </div>
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="
            w-full sm:w-auto
            inline-flex items-center justify-center gap-2
            px-5 py-2.5 rounded-xl
            bg-error-subtle text-error border border-error-muted
            text-sm font-semibold
            hover:bg-error hover:text-white hover:border-error
            transition-all duration-150
          "
        >
          <Trash2 size={15} />
          Delete my account
        </button>
      ) : (
        <div className="bg-bg-surface rounded-2xl border border-error-muted p-4 sm:p-5 space-y-4">
          <p className="text-sm font-semibold text-text-primary">
            Confirm account deletion
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Enter your password <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPwd ? "text" : "password"}
                  placeholder="Your current password"
                  className={cn(
                    "input w-full pr-10",
                    errors.password && "input-error",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    text-text-muted hover:text-text-primary
                    transition-colors duration-150
                  "
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-error mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirmation word */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Type{" "}
                <span className="font-mono font-bold text-error">DELETE</span>{" "}
                to confirm
              </label>
              <input
                {...register("confirm")}
                type="text"
                placeholder="DELETE"
                className={cn(
                  "input w-full font-mono",
                  errors.confirm && "input-error",
                )}
              />
              {errors.confirm && (
                <p className="text-xs text-error mt-1">
                  {errors.confirm.message}
                </p>
              )}
            </div>

            {/* Action buttons — stacked on mobile, side-by-side on sm+ */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="
                  flex-1 py-2.5 rounded-xl border border-border
                  text-sm font-medium text-text-muted
                  hover:text-text-primary hover:bg-bg-subtle
                  transition-all duration-150
                "
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleteAccount.isPending}
                className="
                  flex-1 inline-flex items-center justify-center gap-2
                  py-2.5 rounded-xl bg-error text-white
                  text-sm font-semibold
                  hover:bg-error/90 shadow-sm
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150
                "
              >
                {deleteAccount.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> Delete account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
