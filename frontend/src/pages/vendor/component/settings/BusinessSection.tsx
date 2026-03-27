// src/pages/vendor/settings/components/BusinessSection.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { useUpdateVendorProfile } from "../../../../hooks/vendor/useVendor";
import { cn } from "../../../../lib/utils";
import type { VendorProfile } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Business type options
// ─────────────────────────────────────────────────────────────

const BUSINESS_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
  { value: "supermarket", label: "Supermarket" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "food_and_beverage", label: "Food & Beverage" },
  { value: "fashion", label: "Fashion" },
  { value: "electronics", label: "Electronics" },
  { value: "other", label: "Other" },
] as const;

const BUSINESS_TYPE_VALUES = BUSINESS_TYPES.map((t) => t.value) as [
  string,
  ...string[],
];

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const businessSchema = z.object({
  business_name: z.string().optional(),
  business_type: z.enum(BUSINESS_TYPE_VALUES as [string, ...string[]], {
    error: "Select a business type",
  }),
  business_description: z.string().optional(),
  city_town: z.string().optional(),
  street_address: z.string().optional(),
  nearest_landmark: z.string().optional(),
  postal_code: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface BusinessSectionProps {
  profile: VendorProfile;
}

export function BusinessSection({ profile }: BusinessSectionProps) {
  const update = useUpdateVendorProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      business_name: profile.business_name ?? "",
      business_type: profile.business_type ?? "",
      business_description: profile.business_description ?? "",
      city_town: profile.city_town ?? "",
      street_address: profile.street_address ?? "",
      nearest_landmark: profile.nearest_landmark ?? "",
      postal_code: profile.postal_code ?? "",
    },
  });

  function onSubmit(data: BusinessFormData) {
    update.mutate(data);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="font-heading font-bold text-base text-text-primary mb-0.5">
          Business information
        </h2>
        <p className="text-xs text-text-muted">
          Details about your store or business
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Business name */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Business name
          </label>
          <input
            {...register("business_name")}
            type="text"
            placeholder="e.g. Ade's Supermart"
            className="input w-full"
          />
        </div>

        {/* Business type */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Business type <span className="text-error">*</span>
          </label>
          <select
            {...register("business_type")}
            className={cn(
              "input w-full",
              errors.business_type && "input-error",
            )}
          >
            <option value="">Select type</option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.business_type && (
            <p className="text-xs text-error mt-1">
              {errors.business_type.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Business description
          </label>
          <textarea
            {...register("business_description")}
            rows={3}
            placeholder="Brief description of your business..."
            className="input w-full resize-none"
          />
        </div>

        {/* ── Location ── */}
        <div className="pt-1">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Location
          </p>

          {/* City + postal — side-by-side on sm+, stacked on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                City / Town
              </label>
              <input
                {...register("city_town")}
                type="text"
                placeholder="e.g. Ibadan"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Postal code
              </label>
              <input
                {...register("postal_code")}
                type="text"
                placeholder="e.g. 200001"
                className="input w-full"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Street address
              </label>
              <input
                {...register("street_address")}
                type="text"
                placeholder="e.g. 12 Bodija Market Road"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Nearest landmark
              </label>
              <input
                {...register("nearest_landmark")}
                type="text"
                placeholder="e.g. Opposite GTBank"
                className="input w-full"
              />
            </div>
          </div>
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
