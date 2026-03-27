// src/types/cart.types.ts

export type CartStatus = "open" | "paid" | "abandoned";
export type PaymentMethod = "cash" | "card" | "transfer";

export interface CartItem {
  id: string;
  product: string;
  product_name: string;
  unit_price: string;
  quantity: number;
  tax_rate: string;
  tax_amount: string;
  line_total: string;
}

export interface Cart {
  id: string;
  label: string;
  status: CartStatus;
  currency: string;
  subtotal: string;
  tax_total: string;
  total_amount: string;
  payment_method: PaymentMethod | "";
  amount_tendered: string | null;
  change_due: string | null;
  paid_at: string | null;
  items: CartItem[];
}

export interface CartListItem {
  id: string;
  label: string;
  status: CartStatus;
  total_amount: string;
  item_count: number;
  created_at: string;
}

export interface OpenCartRequest {
  label?: string;
}

export interface ScanRequest {
  barcode: string;
}

export interface ScanResponse {
  success: boolean;
  message: string;
  action_taken: "added" | "incremented";
  data: Cart;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface SetPaymentRequest {
  payment_method: PaymentMethod;
  amount_tendered?: number;
}

export interface MarkPaidRequest {
  payment_method: PaymentMethod;
  amount_tendered?: number;
}

export interface MarkPaidResponse {
  success: boolean;
  message: string;
  total_paid: string;
  change_due: string;
  cart_id: string;
  paid_at: string;
}

export interface CartHistoryFilters {
  from_date?: string;
  to_date?: string;
  method?: PaymentMethod;
  page?: number;
}
