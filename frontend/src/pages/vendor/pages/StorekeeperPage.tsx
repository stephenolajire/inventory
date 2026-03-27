// src/pages/vendor/storekeeper/StorekeeperPage.tsx
import { useState, useEffect } from "react";
import { useAuthStore } from "../../../store/auth.store";
import { useCartStore } from "../../../store/cart.store";
import {
  useOpenCarts,
  useOpenCart,
  useScan,
  useUpdateCartItem,
  useRemoveCartItem,
  useMarkPaid,
  useClearCart,
  useCartDetail,
} from "../../../hooks/vendor/useVendorStoreKeeper";
import { MeasuredQtyModal } from "../component/storekeeper/MeasuredQtyModal";
import type {
  // Cart,
  PaymentMethod,
  // MarkPaidResponse,
  CartItem,
} from "../../../types";
import { useVendorProfile } from "../../../hooks/vendor/useVendor";
import { printReceipt, type ReceiptVendor } from "../../../lib/printReceipts";

import { StorekeeperHeader } from "../component/storekeeper/StorekeeperHeader";
import { CartTabs } from "../component/storekeeper/CartTabs";
import { ScanInput } from "../component/storekeeper/ScanInput";
import { CartItemRow } from "../component/storekeeper/CartItemRows";
import { CartSummary } from "../component/storekeeper/CartSummary";
import { PaymentPanel } from "../component/storekeeper/PaymentPanel";
// import { PaymentSuccessModal } from "../component/storekeeper/PaymentSuccessModal";
import { EmptyCart } from "../component/storekeeper/EmptyCart";

// ─── Extended success result carries the cart snapshot for the receipt ────────
// interface SuccessResult {
//   response: MarkPaidResponse;
//   cartSnapshot: Cart;
// }

// ─────────────────────────────────────────────────────────────────────────────

export default function StorekeeperPage() {
  const user = useAuthStore((s) => s.user);
  const cartStore = useCartStore();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [paymentOpen, setPaymentOpen] = useState(false);
  // const [successResult, setSuccessResult] = useState<SuccessResult | null>(
  //   null,
  // );
  const [lastScannedMeasuredQty, setLastScannedMeasuredQty] = useState<
    number | undefined
  >(undefined);

  const [measuredQtyPrompt, setMeasuredQtyPrompt] = useState<{
    barcode: string;
    productName: string;
  } | null>(null);

  const activeCartId = cartStore.activeCartId;
  const isScanning = cartStore.isScanning;
  const lastScanned = cartStore.lastScannedItem;

  // ── Vendor profile — needed for auto-print ──
  const profileQuery = useVendorProfile();
  const profile = profileQuery.data?.data;

  // ── Online detector ──
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // ── Data hooks ──
  const openCarts = useOpenCarts();
  const cartDetail = useCartDetail(activeCartId ?? "", {
    enabled: !!activeCartId,
  });

  const openCart = useOpenCart();
  const scan = useScan();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const markPaid = useMarkPaid();
  const clearCart = useClearCart();

  // ── Derived ──
  const carts = openCarts.data?.data ?? [];
  const activeCart = cartStore.activeCart ?? cartDetail.data?.data ?? null;
  const cartItems = activeCart?.items ?? [];
  const vendorName = (user as any)?.first_name
    ? `${(user as any).first_name}'s store`
    : (user?.email ?? "Your store");

  // Sync active cart from detail query into store
  useEffect(() => {
    if (cartDetail.data?.data) {
      cartStore.updateActiveCart(cartDetail.data.data);
    }
  }, [cartDetail.data]);

  // Sync open carts into store
  useEffect(() => {
    if (openCarts.data?.data) {
      cartStore.setCarts(
        openCarts.data.data.map((c) => ({
          ...c,
          item_count: c.item_count ?? 0,
          status: c.status ?? "open",
          created_at: c.created_at ?? new Date().toISOString(),
        })),
      );
    }
  }, [openCarts.data]);

  // ── Handlers ──

  function handleNewCart() {
    openCart.mutate(
      { label: "" },
      {
        onSuccess: (res) => {
          if (res.data) cartStore.setActiveCartId(res.data.id);
        },
      },
    );
  }

  function handleSelectCart(id: string) {
    cartStore.setActiveCartId(id);
    cartStore.setActiveCart(null);
  }

  function handleCloseCart(id: string) {
    const confirmed = window.confirm(
      "Remove this cart? Unpaid items will be lost.",
    );
    if (!confirmed) return;
    clearCart.mutate(
      { cart_id: id, abandoned: true },
      {
        onSuccess: () => {
          if (activeCartId === id) cartStore.clearActiveCart();
        },
      },
    );
  }

  function handleScan(barcode: string, measuredQuantity?: number) {
    if (!activeCartId) return;
    scan.mutate(
      {
        cart_id: activeCartId,
        barcode,
        measured_quantity: measuredQuantity,
      },
      {
        onSuccess: () => {
          setLastScannedMeasuredQty(undefined);
          setMeasuredQtyPrompt(null);
        },
        onError: (err: any) => {
          // Check if the error is specifically the measured_quantity validation
          const data = err?.response?.data;
          if (data?.errors?.measured_quantity) {
            // Extract product name from error message
            // e.g. "'Yam' is sold by kg. Please enter the measured quantity."
            const msg: string = data.errors.measured_quantity[0] ?? "";
            const match = msg.match(/^'(.+?)' is sold by/);
            const productName = match?.[1] ?? "This product";
            setMeasuredQtyPrompt({ barcode, productName });
          } else {
            setLastScannedMeasuredQty(measuredQuantity);
          }
        },
      },
    );
  }

  function handleMeasuredQtyConfirm(barcode: string, qty: number) {
    handleScan(barcode, qty);
  }
  function handleIncrement(item: CartItem) {
    if (!activeCartId) return;
    updateItem.mutate({
      cart_id: activeCartId,
      item_id: item.id,
      quantity: item.quantity + 1,
    });
  }

  function handleDecrement(item: CartItem) {
    if (!activeCartId) return;
    if (item.quantity === 1) {
      handleRemove(item);
      return;
    }
    updateItem.mutate({
      cart_id: activeCartId,
      item_id: item.id,
      quantity: item.quantity - 1,
    });
  }

  function handleRemove(item: CartItem) {
    if (!activeCartId) return;
    removeItem.mutate({ cart_id: activeCartId, item_id: item.id });
  }

  function handlePay(method: PaymentMethod, tendered?: number) {
    if (!activeCartId) return;

    const cartSnapshot = activeCart;

    markPaid.mutate(
      {
        cart_id: activeCartId,
        payment_method: method,
        amount_tendered: tendered,
      },
      {
        onSuccess: (res) => {
          setPaymentOpen(false);

          // Auto-print receipt
          if (cartSnapshot) {
            const vendor: ReceiptVendor = {
              businessName: profile?.business_name ?? "Your Store",
              businessEmail: profile?.business_email ?? undefined,
              streetAddress: profile?.street_address ?? undefined,
              cityTown: profile?.city_town ?? undefined,
              stateName: (profile?.state as any)?.name ?? undefined,
              businessLogo: profile?.business_logo ?? undefined,
            };
            printReceipt(res, cartSnapshot, vendor);
          }

          // Open next cart immediately
          handleNewCart();
        },
      },
    );
  }

  // function handleSuccessClose() {
  //   setSuccessResult(null);
  // }

  const isUpdating = updateItem.isPending || removeItem.isPending;

  return (
    <div className="flex flex-col h-screen bg-bg-base overflow-hidden">
      {/* Header */}
      <StorekeeperHeader vendorName={vendorName} isOnline={isOnline} />

      {/* Cart tabs */}
      <div className="px-4 pt-3 pb-2 bg-bg-surface border-b border-border">
        <CartTabs
          carts={carts}
          activeCartId={activeCartId}
          onSelect={handleSelectCart}
          onNew={handleNewCart}
          onClose={handleCloseCart}
          isCreating={openCart.isPending}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* ── Left panel — scan + items ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-border">
            <ScanInput
              onScan={handleScan}
              isScanning={isScanning || scan.isPending}
              lastScanned={lastScanned}
              lastScannedMeasuredQty={lastScannedMeasuredQty}
              disabled={!activeCartId}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2">
            {!activeCartId || cartItems.length === 0 ? (
              <EmptyCart hasCart={!!activeCartId} />
            ) : (
              <div>
                {cartItems.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    onRemove={handleRemove}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel — summary + pay ── */}
        <div
          className="
            w-full lg:w-80 xl:w-96 shrink-0
            border-t lg:border-t-0 lg:border-l border-border
            bg-bg-surface flex flex-col
          "
        >
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {activeCart ? (
              <CartSummary cart={activeCart} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-text-muted">
                  Open a cart to see the total
                </p>
              </div>
            )}
          </div>

          <div className="px-5 pb-5 pt-3 border-t border-border">
            <button
              onClick={() => setPaymentOpen(true)}
              disabled={
                !activeCart || cartItems.length === 0 || markPaid.isPending
              }
              className="
                w-full py-4 rounded-2xl text-base font-semibold
                bg-primary text-white hover:bg-primary-hover
                shadow-lg disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-150 active:scale-[0.98]
              "
            >
              {activeCart && cartItems.length > 0
                ? `Pay · ${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(parseFloat(activeCart.total_amount))}`
                : "Scan items to checkout"}
            </button>
          </div>
        </div>
      </div>

      {/* Payment panel */}
      {paymentOpen && activeCart && (
        <PaymentPanel
          cart={activeCart}
          onPay={handlePay}
          onClose={() => setPaymentOpen(false)}
          isPaying={markPaid.isPending}
        />
      )}

      {/* Success modal */}
      {/* {successResult && (
        <PaymentSuccessModal
          result={successResult.response}
          cart={successResult.cartSnapshot}
          onClose={handleSuccessClose}
        />
      )} */}

      {measuredQtyPrompt && (
        <MeasuredQtyModal
          barcode={measuredQtyPrompt.barcode}
          productName={measuredQtyPrompt.productName}
          onConfirm={handleMeasuredQtyConfirm}
          onClose={() => setMeasuredQtyPrompt(null)}
        />
      )}
    </div>
  );
}
