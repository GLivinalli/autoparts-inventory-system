import type { Part } from "@/types";
import { Badge } from "@/components/common/Badge";
import { SIDE_LABELS, formatDate } from "@/utils/labels";

export function PartTable({ parts, onSelect }: { parts: Part[]; onSelect: (part: Part) => void }) {
  return (
    <table className="w-full border-separate border-spacing-0 text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-muted">
          <th className="border-b border-line py-2.5 pl-1 font-medium">Peca</th>
          <th className="border-b border-line py-2.5 font-medium">SKU</th>
          <th className="border-b border-line py-2.5 font-medium">Montadora</th>
          <th className="border-b border-line py-2.5 font-medium">Lado/parte</th>
          <th className="border-b border-line py-2.5 font-medium">Estado</th>
          <th className="border-b border-line py-2.5 font-medium">Inventario</th>
          <th className="border-b border-line py-2.5 pr-1 text-right font-medium">Estoque</th>
        </tr>
      </thead>
      <tbody>
        {parts.map((part) => (
          <tr
            key={part.id}
            onClick={() => onSelect(part)}
            className="cursor-pointer hover:bg-white"
          >
            <td className="border-b border-line py-2.5 pl-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-surface">
                  {part.photoUrl && <img src={part.photoUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <span className="font-medium text-ink">{part.name}</span>
              </div>
            </td>
            <td className="border-b border-line py-2.5 font-mono text-xs text-muted">{part.sku}</td>
            <td className="border-b border-line py-2.5 text-ink-soft">{part.manufacturer.name}</td>
            <td className="border-b border-line py-2.5 text-ink-soft">{SIDE_LABELS[part.side]}</td>
            <td className="border-b border-line py-2.5">
              {part.condition === "COM_DANO" ? <Badge tone="danger">Com dano</Badge> : <Badge tone="success">Sem dano</Badge>}
            </td>
            <td className="border-b border-line py-2.5 text-ink-soft">{formatDate(part.inventoryDate)}</td>
            <td className="border-b border-line py-2.5 pr-1 text-right">
              <span className={`font-display text-lg font-semibold ${part.quantity === 0 ? "text-danger" : "text-ink"}`}>
                {part.quantity}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
