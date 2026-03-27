// src/pages/vendor/products/components/EditProductImageUpload.tsx

import { useRef, useState } from "react";
import { Camera, Loader2, Package, Scan, Copy } from "lucide-react";
import { useUploadProductImage } from "../../../../hooks/vendor/useVendorProduct";
import { copyToClipboard } from "../../../../lib/utils";
import toast from "react-hot-toast";
import type { ProductDetail } from "../../../../types";

interface EditProductImageUploadProps {
  product: ProductDetail;
}

export function EditProductImageUpload({
  product,
}: EditProductImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const uploadImage = useUploadProductImage();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProgress(0);
    uploadImage.mutate({
      product_id: product.id,
      file,
      onProgress: (pct) => setProgress(pct),
    });
  }

  async function handleCopyBarcode() {
    const ok = await copyToClipboard(product.barcode);
    if (ok) toast.success("Barcode copied to clipboard");
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5 space-y-4">
      <h3 className="font-heading font-bold text-sm text-text-primary">
        Product image
      </h3>

      {/* Image preview */}
      <div
        className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-bg-subtle flex items-center justify-center cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain p-4"
          />
        ) : (
          <Package size={40} className="text-text-muted opacity-30" />
        )}

        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {uploadImage.isPending ? (
            <Loader2 size={22} className="text-white animate-spin" />
          ) : (
            <>
              <Camera size={22} className="text-white" />
              <span className="text-xs text-white font-medium">
                {product.image_url ? "Change image" : "Upload image"}
              </span>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Upload progress */}
      {uploadImage.isPending && (
        <div>
          <div className="flex items-center justify-between text-xs text-text-muted mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-text-muted">
        Click to upload · JPG, PNG, WebP · Max 2MB
      </p>

      {/* Barcode info */}
      <div className="pt-2 border-t border-border space-y-2">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Barcode
        </p>

        {product.barcode_image && (
          <div className="flex justify-center p-3 bg-white rounded-xl border border-border">
            <img
              src={product.barcode_image}
              alt={`Barcode ${product.barcode}`}
              className="max-h-16 object-contain"
            />
          </div>
        )}

        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-bg-subtle border border-border">
          <div className="flex items-center gap-2">
            <Scan size={13} className="text-text-muted" />
            <span className="text-xs font-mono text-text-secondary">
              {product.barcode || "Generating..."}
            </span>
          </div>
          {product.barcode && (
            <button
              onClick={handleCopyBarcode}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-subtle transition-all duration-150"
            >
              <Copy size={12} />
            </button>
          )}
        </div>

        {/* Processing status */}
        {product.processing_status !== "active" && (
          <div
            className={`
            flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium
            ${
              product.processing_status === "processing"
                ? "bg-info-subtle border-info-muted text-info"
                : "bg-error-subtle border-error-muted text-error"
            }
          `}
          >
            {product.processing_status === "processing" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-error" />
            )}
            {product.processing_status === "processing"
              ? "Barcode is being generated..."
              : "Barcode generation failed"}
          </div>
        )}
      </div>
    </div>
  );
}
