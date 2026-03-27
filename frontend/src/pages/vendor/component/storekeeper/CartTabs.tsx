// src/pages/vendor/storekeeper/components/CartTabs.tsx

import { Plus, X, ShoppingCart } from "lucide-react";
import { cn} from "../../../../lib/utils";
import type { CartListItem } from "../../../../types";

interface CartTabsProps {
  carts: CartListItem[];
  activeCartId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClose: (id: string) => void;
  isCreating: boolean;
}

export function CartTabs({
  carts,
  activeCartId,
  onSelect,
  onNew,
  onClose,
  isCreating,
}: CartTabsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
      {/* Cart tabs */}
      {carts.map((cart) => {
        const isActive = cart.id === activeCartId;
        return (
          <div
            key={cart.id}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0",
              "transition-all duration-150 group cursor-pointer select-none",
              isActive
                ? "bg-primary text-white border-primary shadow-md"
                : "bg-bg-surface text-text-muted border-border hover:border-primary-muted hover:text-text-primary",
            )}
            onClick={() => onSelect(cart.id)}
          >
            <ShoppingCart size={13} />
            <span className="text-xs font-semibold whitespace-nowrap max-w-25 truncate">
              {cart.label || `Cart ${cart.id.slice(0, 4)}`}
            </span>
            {cart.item_count > 0 && (
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-bg-subtle text-text-muted",
                )}
              >
                {cart.item_count}
              </span>
            )}
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(cart.id);
              }}
              className={cn(
                "w-4 h-4 rounded-md flex items-center justify-center shrink-0",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                isActive
                  ? "hover:bg-white/20 text-white"
                  : "hover:bg-bg-subtle text-text-muted",
              )}
            >
              <X size={10} />
            </button>
          </div>
        );
      })}

      {/* New cart button */}
      <button
        onClick={onNew}
        disabled={isCreating}
        className="
          flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed
          border-border text-text-muted hover:text-primary hover:border-primary-muted
          hover:bg-primary-subtle shrink-0 text-xs font-medium
          transition-all duration-150 disabled:opacity-50
        "
      >
        {isCreating ? (
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus size={13} />
        )}
        New cart
      </button>
    </div>
  );
}
