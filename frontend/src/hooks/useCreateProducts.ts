import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { QK } from "../lib/queryClient";
import { apiPost, getApiErrorMessage } from "../lib/axios";
import toast from "react-hot-toast";
import type { ApiResponse, ProductListItem } from "../types";
import type { ProductFormData } from "../pages/vendor/component/product/product.schema";

type CreateProductResult = UseMutationResult<
  ApiResponse<ProductListItem>,
  Error,
  ProductFormData
>;

export function useCreateProduct(): CreateProductResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductFormData) => {
      const fd = new FormData();

      fd.append("name", data.name);
      fd.append("category", data.category);
      fd.append("unit", data.unit);
      fd.append("selling_price", String(data.selling_price));
      fd.append("quantity_in_stock", String(data.quantity_in_stock));
      fd.append("tax_rate", String(data.tax_rate ?? 0));
      fd.append("low_stock_threshold", String(data.low_stock_threshold ?? 10));
      fd.append(
        "is_variable_quantity",
        data.is_variable_quantity ? "true" : "false",
      ); // ✅ once, as string

      if (data.description) fd.append("description", data.description);
      if (data.brand) fd.append("brand", data.brand);
      if (data.sku) fd.append("sku", data.sku);
      if (data.cost_price != null)
        fd.append("cost_price", String(data.cost_price));
      if (data.discount_price != null)
        fd.append("discount_price", String(data.discount_price));
      if (data.discount_expires_at)
        fd.append("discount_expires_at", data.discount_expires_at);
      if (data.image) fd.append("image", data.image);
      if (data.is_variable_quantity)
        fd.append(
          "is_variable_quantity",
          data.is_variable_quantity ? "true" : "false",
        );

      return apiPost<ApiResponse<ProductListItem>>("/products/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },

    onSuccess: () => {
      toast.success("Product saved. Barcode is being generated in the background.");
      qc.invalidateQueries({ queryKey: QK.products.all() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },
  });
}