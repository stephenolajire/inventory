// src/store/cart.store.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Cart, CartListItem } from "../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface CartStore {
  // ── State ──
  carts: CartListItem[];
  activeCartId: string | null;
  activeCart: Cart | null;
  isScanning: boolean;
  lastScannedItem: string | null;
  isPaymentOpen: boolean;

  // ── Cart list management ──
  setCarts: (carts: CartListItem[]) => void;
  addCart: (cart: CartListItem) => void;
  removeCart: (cartId: string) => void;
  updateCartInList: (cartId: string, updates: Partial<CartListItem>) => void;

  // ── Active cart ──
  setActiveCartId: (id: string | null) => void;
  setActiveCart: (cart: Cart | null) => void;
  updateActiveCart: (cart: Cart) => void;
  clearActiveCart: () => void;

  // ── Scan state ──
  setIsScanning: (v: boolean) => void;
  setLastScannedItem: (name: string | null) => void;
  flashScan: (productName: string) => void;

  // ── Payment panel ──
  openPayment: () => void;
  closePayment: () => void;

  // ── Computed helpers ──
  getActiveCartItemCount: () => number;
  getActiveCartTotal: () => string;
  hasOpenCarts: () => boolean;
  getCartById: (id: string) => CartListItem | undefined;
}

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ──
      carts: [],
      activeCartId: null,
      activeCart: null,
      isScanning: false,
      lastScannedItem: null,
      isPaymentOpen: false,

      // ── Cart list management ──

      setCarts: (carts) => {
        set({ carts });
        // If active cart is no longer in the list, clear it
        const activeId = get().activeCartId;
        if (activeId && !carts.find((c) => c.id === activeId)) {
          set({ activeCartId: null, activeCart: null });
        }
      },

      addCart: (cart) => {
        set((state) => ({
          carts: [...state.carts, cart],
        }));
      },

      removeCart: (cartId) => {
        set((state) => {
          const updatedCarts = state.carts.filter((c) => c.id !== cartId);
          const wasActive = state.activeCartId === cartId;
          const nextActiveId = wasActive
            ? (updatedCarts[0]?.id ?? null)
            : state.activeCartId;

          return {
            carts: updatedCarts,
            activeCartId: nextActiveId,
            activeCart: wasActive ? null : state.activeCart,
          };
        });
      },

      updateCartInList: (cartId, updates) => {
        set((state) => ({
          carts: state.carts.map((c) =>
            c.id === cartId ? { ...c, ...updates } : c,
          ),
        }));
      },

      // ── Active cart ──

      setActiveCartId: (id) => {
        set({ activeCartId: id });
      },

      setActiveCart: (cart) => {
        set({
          activeCart: cart,
          activeCartId: cart?.id ?? null,
        });
      },

      updateActiveCart: (cart) => {
        set({ activeCart: cart });

        // Also sync totals in the cart list
        get().updateCartInList(cart.id, {
          total_amount: cart.total_amount,
          item_count: cart.items.length,
          label: cart.label,
          status: cart.status,
        });
      },

      clearActiveCart: () => {
        set({ activeCart: null, activeCartId: null });
      },

      // ── Scan state ──

      setIsScanning: (v) => {
        set({ isScanning: v });
      },

      setLastScannedItem: (name) => {
        set({ lastScannedItem: name });
      },

      // Flash the scan banner for 800ms then clear
      flashScan: (productName) => {
        set({ lastScannedItem: productName, isScanning: true });
        setTimeout(() => {
          set({ lastScannedItem: null, isScanning: false });
        }, 800);
      },

      // ── Payment panel ──

      openPayment: () => set({ isPaymentOpen: true }),
      closePayment: () => set({ isPaymentOpen: false }),

      // ── Computed helpers ──

      getActiveCartItemCount: () => {
        return get().activeCart?.items.length ?? 0;
      },

      getActiveCartTotal: () => {
        return get().activeCart?.total_amount ?? "0.00";
      },

      hasOpenCarts: () => {
        return get().carts.length > 0;
      },

      getCartById: (id) => {
        return get().carts.find((c) => c.id === id);
      },
    }),

    {
      name: "stocksense-cart",
      storage: createJSONStorage(() => sessionStorage),

      // Persist cart list and active cart ID across page refreshes
      // but not the full active cart detail (re-fetched from API)
      partialize: (state) => ({
        carts: state.carts,
        activeCartId: state.activeCartId,
      }),
    },
  ),
);

// ─────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────

export const selectCarts = (s: CartStore) => s.carts;
export const selectActiveCartId = (s: CartStore) => s.activeCartId;
export const selectActiveCart = (s: CartStore) => s.activeCart;
export const selectIsScanning = (s: CartStore) => s.isScanning;
export const selectLastScannedItem = (s: CartStore) => s.lastScannedItem;
export const selectIsPaymentOpen = (s: CartStore) => s.isPaymentOpen;
