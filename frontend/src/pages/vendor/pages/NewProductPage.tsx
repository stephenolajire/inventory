import { useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save, Zap } from "lucide-react";
import { ROUTES } from "../../../constants/routes";
import { useCreateProduct } from "../../../hooks/useCreateProducts";
import { useCategories } from "../../../hooks/useCategories";
import {
  productSchema,
  type ProductFormData,
} from "../component/product/product.schema";
import {
  BasicInfoSection,
  PricingSection,
  InventorySection,
} from "../component/product/ProductFormFields";

interface NewProductHeaderProps {
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

function NewProductHeader({
  isSubmitting,
  onBack,
  onSubmit,
}: NewProductHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all duration-150"
        >
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="font-heading font-extrabold text-xl text-text-primary">
            New product
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Fill in the details below to add a product to your inventory
          </p>
        </div>
      </div>
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={15} />
            Save product
          </>
        )}
      </button>
    </div>
  );
}

function ProcessingInfoCard() {
  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-subtle border border-primary-muted flex items-center justify-center shrink-0">
          <Zap size={16} className="text-primary" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-sm text-text-primary mb-1">
            Barcode auto-generation
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">
            After saving, StockSense will automatically generate a unique
            Code128 barcode for your product in the background. You will receive
            a notification when it is ready to print.
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-error-subtle border border-error-muted mb-5">
      <div className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 shrink-0" />
      <p className="text-sm text-error">{message}</p>
    </div>
  );
}

export default function NewProductPage() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const categories = useCategories();
  const categoryList = categories.data?.results ?? [];

  const form = useForm<ProductFormData, any, ProductFormData>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormData>,
    defaultValues: {
      unit: "each",
      tax_rate: 0,
      low_stock_threshold: 10,
      quantity_in_stock: 0,
      is_variable_quantity: false, // 👈 add this
      image: undefined,
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
  } = form;
  const hasErrors = Object.keys(errors).length > 0;

  async function onSubmit(data: ProductFormData) {
    await createProduct.mutateAsync(data, {
      onSuccess: () => navigate(ROUTES.PRODUCTS),
    });
  }

  return (
    <div className="p-6 lg:p-8 max-w-8xl mx-auto">
      <NewProductHeader
        isSubmitting={isSubmitting || createProduct.isPending}
        onBack={() => navigate(ROUTES.PRODUCTS)}
        onSubmit={handleSubmit(onSubmit)}
      />

      {hasErrors && (
        <ErrorBanner message="Please fix the errors below before saving." />
      )}

      {createProduct.isError && (
        <ErrorBanner
          message={
            (createProduct.error as any)?.response?.data?.message ??
            "Failed to save product. Please try again."
          }
        />
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <BasicInfoSection form={form} categories={categoryList} />
          <PricingSection form={form} />
          <InventorySection form={form} />
        </div>

        <div className="space-y-5">
          <ProcessingInfoCard />

          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-bg-surface border-t border-border z-10">
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || createProduct.isPending}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isSubmitting || createProduct.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={15} />
                  Save product
                </>
              )}
            </button>
          </div>

          <div className="bg-bg-surface rounded-2xl border border-border p-5">
            <h3 className="font-heading font-bold text-sm text-text-primary mb-3">
              Tips
            </h3>
            <ul className="space-y-2.5">
              {[
                "Set a cost price to unlock profit margin analytics",
                "Add a low stock threshold to get alerts before you run out",
                "Use discounts with an expiry date for promotions",
                "The barcode is generated automatically — no scanner needed",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="text-xs text-text-muted leading-relaxed">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
