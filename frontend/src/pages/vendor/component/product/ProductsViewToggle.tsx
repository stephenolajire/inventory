// src/pages/vendor/products/components/ProductsViewToggle.tsx

import { LayoutGrid, List } from "lucide-react";
import { cn } from "../../../../lib/utils";

type ViewMode = "grid" | "table";

interface ProductsViewToggleProps {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}

export function ProductsViewToggle({
  view,
  onChange,
}: ProductsViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-bg-subtle rounded-xl border border-border">
      <button
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        className={cn(
          "w-8 h-7 rounded-lg flex items-center justify-center transition-all duration-150",
          view === "grid"
            ? "bg-bg-surface text-text-primary shadow-sm border border-border"
            : "text-text-muted hover:text-text-primary",
        )}
      >
        <LayoutGrid size={14} />
      </button>
      <button
        onClick={() => onChange("table")}
        aria-label="Table view"
        className={cn(
          "w-8 h-7 rounded-lg flex items-center justify-center transition-all duration-150",
          view === "table"
            ? "bg-bg-surface text-text-primary shadow-sm border border-border"
            : "text-text-muted hover:text-text-primary",
        )}
      >
        <List size={14} />
      </button>
    </div>
  );
}
