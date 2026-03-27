// src/types/product.types.ts

export type ProductUnit =
  | "each"
  | "carton"
  | "kg"
  | "litre"
  | "pack"
  | "dozen"
  | "bag"
  | "box";

export type ProcessingStatus = "processing" | "active" | "failed";

export interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface ProductListItem {
  id: string;
  name: string;
  category_name: string;
  unit: ProductUnit;
  selling_price: string;
  effective_price: string;
  quantity_in_stock: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_active: boolean;
  processing_status: ProcessingStatus;
  barcode: string;
  created_at: string;
  barcode_image:any;
  image_url: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  category: Category;
  brand: string;
  unit: ProductUnit;
  image: string;
  sku: string;
  barcode: string;
  barcode_image: string;
  selling_price: string;
  cost_price: string | null;
  discount_price: string | null;
  discount_expires_at: string | null;
  effective_price: string;
  tax_rate: string;
  quantity_in_stock: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  total_sold: number;
  is_active: boolean;
  processing_status: ProcessingStatus;
  created_at: string;
  updated_at: string;
  image_url:string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  category: string;
  brand?: string;
  unit?: ProductUnit;
  sku?: string;
  selling_price: number;
  cost_price?: number;
  discount_price?: number;
  discount_expires_at?: string;
  tax_rate?: number;
  quantity_in_stock: number;
  low_stock_threshold?: number;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface StockUpdateRequest {
  quantity_in_stock: number;
}

export interface DiscountUpdateRequest {
  discount_price: number | null;
  discount_expires_at: string | null;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  low_stock?: boolean;
  ordering?: string;
  page?: number;
}
