import { useRef, useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { XCircle, UploadCloud, X, ImageIcon } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { Category } from "../../../../types";
import type { ProductFormData } from "./product.schema";

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, error, required, hint, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">
        {label}
        {required && <span className="text-error ml-1">*</span>}
        {hint && (
          <span className="ml-2 text-xs font-normal text-text-muted">
            ({hint})
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-xs text-error mt-1.5 flex items-center gap-1">
          <XCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function FormSection({ title, subtitle, children }: SectionProps) {
  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <div className="mb-4">
        <h3 className="font-heading font-bold text-sm text-text-primary">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface ImageUploadFieldProps {
  form: UseFormReturn<ProductFormData>;
}

export function ImageUploadField({ form }: ImageUploadFieldProps) {
  const {
    setValue,
    formState: { errors },
  } = form;

  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValue("image", file, { shouldValidate: true });
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setValue("image", undefined, { shouldValidate: true });
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setValue("image", file, { shouldValidate: true });
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <Field
      label="Product image"
      error={errors.image?.message as string}
      hint="optional, max 5MB"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {preview ? (
        <div className="relative w-full rounded-xl overflow-hidden border border-border bg-bg-subtle aspect-video flex items-center justify-center">
          <img
            src={preview}
            alt="Product preview"
            className="object-contain w-full h-full max-h-48"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-bg-surface border border-border flex items-center justify-center text-text-muted hover:text-error hover:border-error transition-colors shadow-sm"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "w-full rounded-xl border-2 border-dashed border-border bg-bg-subtle",
            "flex flex-col items-center justify-center gap-2 py-8 cursor-pointer",
            "hover:border-primary hover:bg-primary-subtle transition-colors duration-150",
            errors.image && "border-error bg-error-subtle",
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-bg-surface border border-border flex items-center justify-center">
            <ImageIcon size={18} className="text-text-muted" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-text-secondary">
              <span className="text-primary">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              JPEG, PNG or WebP — max 5MB
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <UploadCloud size={12} />
            <span>Browse files</span>
          </div>
        </div>
      )}
    </Field>
  );
}

interface BasicInfoProps {
  form: UseFormReturn<ProductFormData>;
  categories: Category[];
}

export function BasicInfoSection({ form, categories }: BasicInfoProps) {
  const {
    register,
    formState: { errors },
  } = form;

  const UNIT_OPTIONS = [
    { value: "each", label: "Each" },
    { value: "carton", label: "Carton" },
    { value: "kg", label: "KG" },
    { value: "litre", label: "Litre" },
    { value: "pack", label: "Pack" },
    { value: "dozen", label: "Dozen" },
    { value: "bag", label: "Bag" },
    { value: "box", label: "Box" },
  ];

  return (
    <FormSection
      title="Basic information"
      subtitle="Name, category and description"
    >
      <ImageUploadField form={form} />

      <Field label="Product name" error={errors.name?.message} required>
        <input
          {...register("name")}
          type="text"
          placeholder="e.g. Peak Milk 400g"
          className={cn("input", errors.name && "input-error")}
        />
      </Field>

      <Field
        label="Description"
        error={errors.description?.message}
        hint="optional"
      >
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Brief description of the product..."
          className={cn(
            "input resize-none",
            errors.description && "input-error",
          )}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" error={errors.category?.message} required>
          <select
            {...register("category")}
            className={cn("input", errors.category && "input-error")}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Brand" error={errors.brand?.message} hint="optional">
          <input
            {...register("brand")}
            type="text"
            placeholder="e.g. Nestlé"
            className={cn("input", errors.brand && "input-error")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="SKU" error={errors.sku?.message} hint="optional">
          <input
            {...register("sku")}
            type="text"
            placeholder="e.g. PKM-400"
            className={cn("input", errors.sku && "input-error")}
          />
        </Field>

        <Field label="Unit" error={errors.unit?.message}>
          <select
            {...register("unit")}
            className={cn("input", errors.unit && "input-error")}
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </FormSection>
  );
}

interface PricingProps {
  form: UseFormReturn<ProductFormData>;
}

export function PricingSection({ form }: PricingProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <FormSection title="Pricing" subtitle="Selling price, cost and discounts eg(selling price per Kg or per item)">
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Selling price (£)"
          error={errors.selling_price?.message}
          required
        >
          <input
            {...register("selling_price", { valueAsNumber: true })}
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            className={cn("input", errors.selling_price && "input-error")}
          />
        </Field>

        <Field
          label="Cost price (£)"
          error={errors.cost_price?.message}
          hint="for margins"
        >
          <input
            {...register("cost_price")}
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            className={cn("input", errors.cost_price && "input-error")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Discount price (£)"
          error={errors.discount_price?.message}
          hint="optional"
        >
          <input
            {...register("discount_price")}
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            className={cn("input", errors.discount_price && "input-error")}
          />
        </Field>

        <Field
          label="Discount expires"
          error={errors.discount_expires_at?.message}
          hint="optional"
        >
          <input
            {...register("discount_expires_at")}
            type="date"
            className={cn("input", errors.discount_expires_at && "input-error")}
          />
        </Field>
      </div>

      <Field
        label="Tax rate (%)"
        error={errors.tax_rate?.message}
        hint="defaults to 0"
      >
        <input
          {...register("tax_rate", { valueAsNumber: true })}
          type="number"
          min={0}
          max={100}
          step="0.01"
          placeholder="0.00"
          className={cn("input w-40", errors.tax_rate && "input-error")}
        />
      </Field>
    </FormSection>
  );
}

interface InventoryProps {
  form: UseFormReturn<ProductFormData>;
}

export function InventorySection({ form }: InventoryProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const isVariable = watch("is_variable_quantity");

  return (
    <FormSection
      title="Inventory"
      subtitle="Stock quantity, thresholds and measurement settings"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Quantity in stock"
          error={errors.quantity_in_stock?.message}
          required
        >
          <input
            {...register("quantity_in_stock", { valueAsNumber: true })}
            type="number"
            min={0}
            step={isVariable ? "0.001" : "1"}
            placeholder="0"
            className={cn("input", errors.quantity_in_stock && "input-error")}
          />
        </Field>

        <Field
          label="Low stock threshold"
          error={errors.low_stock_threshold?.message}
          hint="alert trigger"
        >
          <input
            {...register("low_stock_threshold", { valueAsNumber: true })}
            type="number"
            min={0}
            step={1}
            placeholder="10"
            className={cn("input", errors.low_stock_threshold && "input-error")}
          />
        </Field>
      </div>

      {/* Variable quantity toggle */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-bg-subtle border border-border">
        <div>
          <p className="text-sm font-medium text-text-secondary">
            Variable quantity product
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            Enable if quantity is measured at sale time (e.g. weight in kg)
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isVariable}
          onClick={() =>
            setValue("is_variable_quantity", !isVariable, {
              shouldValidate: true,
            })
          }
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
            "transition-colors duration-200 ease-in-out focus:outline-none",
            isVariable ? "bg-primary" : "bg-border",
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm",
              "transform transition-transform duration-200 ease-in-out",
              isVariable ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-info-subtle border border-info-muted">
        <div className="w-1.5 h-1.5 rounded-full bg-info mt-1.5 shrink-0" />
        <p className="text-xs text-info leading-relaxed">
          A unique barcode will be auto-generated after saving. You can print
          the label from the product detail page.
        </p>
      </div>
    </FormSection>
  );
}
