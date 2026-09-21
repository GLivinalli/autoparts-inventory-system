import type { Product } from "@/types";
import { Badge } from "@/components/common/Badge";

export function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const outOfStock = product.quantity === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded border border-line bg-white p-3 text-left active:bg-surface"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{product.name}</p>
        <p className="truncate text-xs text-muted">{product.manufacturer}</p>
        {product.daysInStock !== null && (
          <div className="mt-1">
            <Badge tone={product.daysInStock > 90 ? "danger" : "neutral"}>{product.daysInStock} dias em estoque</Badge>
          </div>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className={`font-display text-2xl font-semibold leading-none ${outOfStock ? "text-danger" : "text-ink"}`}>
          {product.quantity}
        </p>
        <p className="text-[11px] text-muted">unid.</p>
      </div>
    </button>
  );
}
