import type { Part } from "@/types";
import { Badge } from "@/components/common/Badge";
import { SIDE_LABELS } from "@/utils/labels";

export function PartCard({ part, onClick }: { part: Part; onClick: () => void }) {
  const outOfStock = part.quantity === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded border border-line bg-white p-3 text-left active:bg-surface"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-surface">
        {part.photoUrl ? (
          <img src={part.photoUrl} alt={part.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 8h18l-1.5 12.5A2 2 0 0 1 17.5 22h-11a2 2 0 0 1-2-1.5L3 8Z" />
            </svg>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{part.name}</p>
        <p className="font-mono text-xs text-muted">{part.sku || "Sem SKU"}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge tone="steel">{part.manufacturer.name}</Badge>
          <Badge tone="neutral">{SIDE_LABELS[part.side]}</Badge>
          {part.condition === "COM_DANO" && <Badge tone="danger">Com dano</Badge>}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className={`font-display text-2xl font-semibold leading-none ${outOfStock ? "text-danger" : "text-ink"}`}>
          {part.quantity}
        </p>
        <p className="text-[11px] text-muted">unid.</p>
      </div>
    </button>
  );
}
