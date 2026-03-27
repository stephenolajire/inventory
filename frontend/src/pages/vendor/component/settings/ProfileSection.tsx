// src/pages/vendor/settings/components/ProfileSection.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Camera } from "lucide-react";
import { useRef, useState } from "react";
import {
  useUpdateVendorProfile,
  useUploadVendorLogo,
} from "../../../../hooks/vendor/useVendor";
import { cn, getInitials, getAvatarColor } from "../../../../lib/utils";
import type { VendorProfile } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const profileSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  business_email: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface ProfileSectionProps {
  profile: VendorProfile;
}

export function ProfileSection({ profile }: ProfileSectionProps) {
  const update = useUpdateVendorProfile();
  const uploadLogo = useUploadVendorLogo();
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      business_email: profile.business_email ?? "",
    },
  });

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const initials = getInitials(fullName);
  const avatarColor = getAvatarColor(
    profile.business_email || profile.first_name,
  );

  function onSubmit(data: ProfileFormData) {
    update.mutate(data);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProgress(0);
    uploadLogo.mutate({ file, onProgress: (pct) => setProgress(pct) });
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="font-heading font-bold text-base text-text-primary mb-0.5">
          Personal information
        </h2>
        <p className="text-xs text-text-muted">
          Update your name and contact details
        </p>
      </div>

      {/* ── Avatar upload ── */}
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative group shrink-0">
          {profile.business_logo ? (
            <img
              src={profile.business_logo}
              alt={fullName}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-border"
            />
          ) : (
            <div
              className={cn(
                "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center",
                "text-white font-bold text-lg sm:text-xl",
                avatarColor,
              )}
            >
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadLogo.isPending}
            className="
              absolute inset-0 rounded-2xl bg-black/50
              flex items-center justify-center
              opacity-0 group-hover:opacity-100
              transition-opacity duration-150
            "
          >
            {uploadLogo.isPending ? (
              <Loader2 size={16} className="text-white animate-spin" />
            ) : (
              <Camera size={16} className="text-white" />
            )}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
          />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {fullName}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            Click logo to change · Max 2MB
          </p>
          {uploadLogo.isPending && (
            <div className="mt-2 h-1.5 w-28 sm:w-32 bg-bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* First + last name — stacked on mobile, side-by-side on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              First name <span className="text-error">*</span>
            </label>
            <input
              {...register("first_name")}
              type="text"
              className={cn("input w-full", errors.first_name && "input-error")}
            />
            {errors.first_name && (
              <p className="text-xs text-error mt-1">
                {errors.first_name.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Last name <span className="text-error">*</span>
            </label>
            <input
              {...register("last_name")}
              type="text"
              className={cn("input w-full", errors.last_name && "input-error")}
            />
            {errors.last_name && (
              <p className="text-xs text-error mt-1">
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Business email
          </label>
          <input
            {...register("business_email")}
            type="email"
            placeholder="business@example.com"
            className={cn(
              "input w-full",
              errors.business_email && "input-error",
            )}
          />
          {errors.business_email && (
            <p className="text-xs text-error mt-1">
              {errors.business_email.message}
            </p>
          )}
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={!isDirty || update.isPending}
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
            {update.isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={15} /> Save changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
