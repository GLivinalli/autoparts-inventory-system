import { useEffect, useState } from "react";
import type { ProductMovement } from "@/types";
import { getApiErrorMessage } from "@/api/client";
import { editMovement } from "@/api/productReport";
import type { EditMovementPayload } from "@/api/productReport";
import { listEmployees } from "@/api/productLists";
import type { ListItem } from "@/api/productLists";
import { formatCentsToBRL } from "@/utils/labels";
import { onlyDigits } from "@/utils/inputs";

// Data local no formato AAAA-MM-DD (o mesmo dia que a tabela mostra).
function toLocalDateInput(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface EditMovementModalProps {
  movement: ProductMovement | null;
  onClose: () => void;
  onSaved: () => void;
}

// Somente o administrador chega aqui (a linha so e clicavel para ele, e o
// backend tambem recusa quem nao for admin).
export function EditMovementModal({ movement, onClose, onSaved }: EditMovementModalProps) {
  const [date, setDate] = useState("");
  const [employee, setEmployee] = useState("");
  const [quantity, setQuantity] = useState("");
  const [employees, setEmployees] = useState<ListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movement) return;
    setDate(toLocalDateInput(movement.createdAt));
    setEmployee(movement.funcionario ?? "");
    setQuantity(String(movement.quantity));
    setError(null);
    if (movement.type === "RETIRADA") {
      listEmployees()
        .then(setEmployees)
        .catch(() => undefined);
    }
  }, [movement]);

  if (!movement) return null;

  const current: ProductMovement = movement;
  const isExit = current.type === "RETIRADA";
  const today = toLocalDateInput(new Date().toISOString());
  const currentEmployee = current.funcionario ?? "";
  const names = employees.map((e) => e.name);
  // Se o funcionario atual saiu da lista depois, ele continua aparecendo.
  const employeeOptions = currentEmployee && !names.includes(currentEmployee) ? [currentEmployee, ...names] : names;

  async function handleSave() {
    const newQuantity = Number(quantity);
    if (!date) return setError("Informe a data");
    if (!Number.isInteger(newQuantity) || newQuantity <= 0) return setError("Informe uma quantidade valida");

    const payload: EditMovementPayload = {};
    if (date !== toLocalDateInput(current.createdAt)) payload.date = date;
    if (newQuantity !== current.quantity) payload.quantity = newQuantity;
    if (isExit && employee && employee !== currentEmployee) payload.funcionario = employee;

    if (Object.keys(payload).length === 0) return onClose();

    setSaving(true);
    setError(null);
    try {
      await editMovement(current.id, payload);
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível salvar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/40 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-md bg-white p-5 shadow-lg sm:rounded-md">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">
            {isExit ? "Editar retirada" : "Editar entrada"}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:bg-surface" aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">
          {current.product?.name ?? "Produto"} - valor atual {formatCentsToBRL(current.totalCents)}
        </p>

        <label className="mb-1 block text-sm font-medium text-ink">Data</label>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          className="mb-3 h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
        />

        {isExit && (
          <>
            <label className="mb-1 block text-sm font-medium text-ink">Funcionário</label>
            <select
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              className="mb-3 h-11 w-full rounded border border-line bg-white px-3 text-sm focus:border-accent"
            >
              {employeeOptions.length === 0 && <option value="">Carregando...</option>}
              {employeeOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                  {name === currentEmployee && !names.includes(name) ? " (fora da lista)" : ""}
                </option>
              ))}
            </select>
          </>
        )}

        <label className="mb-1 block text-sm font-medium text-ink">Quantidade</label>
        <input
          type="text"
          inputMode="numeric"
          value={quantity}
          onChange={(e) => setQuantity(onlyDigits(e.target.value))}
          placeholder="0"
          className="h-11 w-full rounded border border-line px-3 text-sm placeholder:text-muted focus:border-accent"
        />
        <p className="mt-2 text-xs text-muted">
          {isExit
            ? "Ao mudar a quantidade, a retirada e recalculada pelos lotes mais antigos (FIFO), entao o valor pode mudar."
            : "Ao mudar a quantidade, o valor por unidade e mantido e o valor total muda junto."}
        </p>

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
