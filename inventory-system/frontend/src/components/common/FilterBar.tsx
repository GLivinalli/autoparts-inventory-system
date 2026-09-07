import type { Manufacturer } from "@/types";
import { CONDITION_LABELS, SIDE_LABELS } from "@/utils/labels";

export interface FilterValues {
  manufacturerId: string;
  side: string;
  condition: string;
  stock: string;
}

interface FilterBarProps {
  manufacturers: Manufacturer[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
}

const selectClass =
  "h-10 rounded border border-line bg-white px-3 text-sm text-ink focus:border-accent min-w-0";

export function FilterBar({ manufacturers, values, onChange }: FilterBarProps) {
  function set<K extends keyof FilterValues>(key: K, value: string) {
    onChange({ ...values, [key]: value });
  }

  const hasActiveFilters = Object.values(values).some(Boolean);

  return (
    <div className="flex flex-wrap gap-2">
      <select className={selectClass} value={values.manufacturerId} onChange={(e) => set("manufacturerId", e.target.value)}>
        <option value="">Montadora</option>
        {manufacturers.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <select className={selectClass} value={values.condition} onChange={(e) => set("condition", e.target.value)}>
        <option value="">Estado</option>
        {Object.entries(CONDITION_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select className={selectClass} value={values.side} onChange={(e) => set("side", e.target.value)}>
        <option value="">Lado/parte</option>
        {Object.entries(SIDE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select className={selectClass} value={values.stock} onChange={(e) => set("stock", e.target.value)}>
        <option value="">Estoque</option>
        <option value="available">Disponivel</option>
        <option value="out">Sem estoque</option>
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange({ manufacturerId: "", side: "", condition: "", stock: "" })}
          className="h-10 rounded px-3 text-sm font-medium text-steel hover:bg-steel-soft"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
