// src/pages/vendor/products/EditProductPage.tsx

import { useState, useEffect }   from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft }             from "lucide-react";
import { ROUTES }                from "../../../constants/routes";
import {
  useProductDetail,
  useUpdateProduct,
}                                from "../../../hooks/vendor/useVendorProduct";
import { useCategories }         from "../../../hooks/vendor/useVendorProduct";
import {
  productSchema,
  type ProductFormData,
}                                from "../component/product/product.schema";

// ── Sub-components ──
import { EditProductHeader }        from "../component/product/EditProductHeader";
import { EditProductImageUpload }   from "../component/product/EditProductImageModal";
import { EditProductStockModal }    from "../component/product/EditProductstockModal";
import { EditProductDiscountModal } from "../component/product/EditProductDiscountModal";
import {
  BasicInfoSection,
  PricingSection,
  InventorySection,
}                                   from "../component/product/ProductFormFields";

// ─────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────

function EditProductSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-bg-muted rounded-xl" />
          <div className="space-y-1.5">
            <div className="h-5 w-28 bg-bg-muted rounded-full" />
            <div className="h-3 w-48 bg-bg-muted rounded-full" />
          </div>
        </div>
        <div className="h-10 w-32 bg-bg-muted rounded-xl" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="h-56 bg-bg-muted rounded-2xl" />
          <div className="h-48 bg-bg-muted rounded-2xl" />
          <div className="h-40 bg-bg-muted rounded-2xl" />
        </div>
        <div className="space-y-5">
          <div className="h-64 bg-bg-muted rounded-2xl" />
          <div className="h-40 bg-bg-muted rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Not found
// ─────────────────────────────────────────────────────────────

function ProductNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-sm text-text-muted">Product not found</p>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
      >
        <ArrowLeft size={13} />
        Back to products
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function EditProductPage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();

  const [stockOpen,    setStockOpen]    = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);

  // ── Data hooks ──
  const productQuery = useProductDetail(id ?? "");
  const categories   = useCategories();
  const updateProduct = useUpdateProduct();

  const product      = productQuery.data?.data;
  const categoryList = (categories.data as any)?.results
    ?? (categories.data as any)?.data
    ?? [];

  // ── Form ──
  const form = useForm<ProductFormData, any, ProductFormData>({
      resolver: zodResolver(productSchema) as Resolver<ProductFormData>,
      defaultValues: {
        unit: "each",
        tax_rate: 0,
        low_stock_threshold: 10,
        quantity_in_stock: 0,
        image: undefined,
      },
    });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty, errors },
  } = form;

  // Populate form once product loads
  useEffect(() => {
    if (product) {
      reset({
        name:                product.name,
        description:         product.description         ?? "",
        category:            product.category?.id        ?? "",
        brand:               product.brand               ?? "",
        sku:                 product.sku                 ?? "",
        unit:               (product.unit as any)        ?? "each",
        selling_price:       parseFloat(product.selling_price),
        cost_price:          product.cost_price
          ? parseFloat(product.cost_price)
          : undefined,
        discount_price:      product.discount_price
          ? parseFloat(product.discount_price)
          : undefined,
        discount_expires_at: product.discount_expires_at
          ? product.discount_expires_at.split("T")[0]
          : "",
        tax_rate:            parseFloat(product.tax_rate)            ?? 0,
        quantity_in_stock:   product.quantity_in_stock,
        low_stock_threshold: product.low_stock_threshold             ?? 10,
      });
    }
  }, [product, reset]);

  // ── Handlers ──

  async function onSubmit(data: ProductFormData) {
    if (!id) return;
    await updateProduct.mutateAsync(
      {
        product_id:          id,
        name:                data.name,
        description:         data.description,
        category:            data.category,
        brand:               data.brand,
        sku:                 data.sku,
        unit:                data.unit,
        selling_price:       data.selling_price,
        cost_price:          data.cost_price,
        tax_rate:            data.tax_rate,
        low_stock_threshold: data.low_stock_threshold,
      },
      {
        onSuccess: () => {
          // Reset dirty state after save
          reset(data);
        },
      }
    );
  }

  // ── Loading / error states ──
  if (productQuery.isLoading) return <EditProductSkeleton />;
  if (!product)               return <ProductNotFound onBack={() => navigate(ROUTES.PRODUCTS)} />;

  const hasFormErrors = Object.keys(errors).length > 0;

  return (
    <div className="p-6 lg:p-8 max-w-8xl mx-auto">

      {/* Header */}
      <EditProductHeader
        product={product}
        isSubmitting={isSubmitting || updateProduct.isPending}
        isDirty={isDirty}
        onBack={() => navigate(ROUTES.PRODUCTS)}
        onSubmit={handleSubmit(onSubmit)}
        onStockOpen={() => setStockOpen(true)}
        onDiscountOpen={() => setDiscountOpen(true)}
      />

      {/* Form error banner */}
      {hasFormErrors && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-error-subtle border border-error-muted mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 shrink-0" />
          <p className="text-sm text-error">
            Please fix the errors below before saving.
          </p>
        </div>
      )}

      {/* API error banner */}
      {updateProduct.isError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-error-subtle border border-error-muted mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 flex-shrink-0" />
          <p className="text-sm text-error">
            {(updateProduct.error as any)?.response?.data?.message
              ?? "Failed to update product. Please try again."}
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Left — form */}
        <div className="lg:col-span-2 space-y-5">
          <BasicInfoSection
            form={form}
            categories={categoryList}
          />
          <PricingSection form={form} />
          <InventorySection form={form} />
        </div>

        {/* Right — sidebar */}
        <div className="space-y-5">

          {/* Image upload + barcode */}
          <EditProductImageUpload product={product} />

          {/* Product stats card */}
          <div className="bg-bg-surface rounded-2xl border border-border p-5">
            <h3 className="font-heading font-bold text-sm text-text-primary mb-3">
              Product stats
            </h3>
            <div className="space-y-2.5">
              {[
                { label: "Total sold",     value: `${product.total_sold.toLocaleString()} units` },
                { label: "In stock",       value: `${product.quantity_in_stock.toLocaleString()} units` },
                { label: "Low threshold",  value: `${product.low_stock_threshold} units`           },
                { label: "Effective price", value: `£${parseFloat(product.effective_price).toLocaleString()}` },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">{s.label}</span>
                  <span className="text-xs font-semibold text-text-primary">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Discount card */}
          {product.discount_price && (
            <div className="bg-warning-subtle rounded-2xl border border-warning-muted p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-warning">Active discount</span>
                <button
                  onClick={() => setDiscountOpen(true)}
                  className="text-xs text-warning hover:underline"
                >
                  Edit
                </button>
              </div>
              <p className="text-sm font-bold text-warning">
                £{parseFloat(product.discount_price).toLocaleString()}
              </p>
              {product.discount_expires_at && (
                <p className="text-xs text-warning mt-0.5">
                  Expires {product.discount_expires_at.split("T")[0]}
                </p>
              )}
            </div>
          )}

          {/* Mobile sticky save */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-bg-surface border-t border-border z-10">
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || updateProduct.isPending || !isDirty}
              className="
                w-full inline-flex items-center justify-center gap-2
                py-3 rounded-xl bg-primary text-white text-sm font-semibold
                hover:bg-primary-hover shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150
              "
            >
              Save changes
            </button>
          </div>
        </div>
      </div>

      {/* Stock modal */}
      <EditProductStockModal
        product={product}
        isOpen={stockOpen}
        onClose={() => setStockOpen(false)}
      />

      {/* Discount modal */}
      <EditProductDiscountModal
        product={product}
        isOpen={discountOpen}
        onClose={() => setDiscountOpen(false)}
      />

    </div>
  );
}