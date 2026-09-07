import { useState } from "react";
import type { MovementType, Part } from "@/types";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getApiErrorMessage } from "@/api/client";

interface StockMovementModalProps {
  open: boolean;
  part: Part;
  type: MovementType;
  onClose: () => void;
  onSubmit: (quantity: number, description?: string) => Promise<void>;
}

export function StockMovementModal({ open, part, type, onClose, onSubmit }: StockMovementModalProps) {
  const [quantity, setQuantity] = useState("1");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const isEntrada = type === "ENTRADA";
  const parsedQuantity = Number(quantity);
  const projected = isEntrada ? part.quantity + parsedQuantity : part.quantity - parsedQuantity;

  function validate(): string | null {
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      return "Informe uma quantidade valida";
    }
    if (!isEntrada && parsedQuantity > part.quantity) {
      return "Quantidade insuficiente em estoque.";
    }
    return null;
  }

  function handleContinue() {
    const validationError = validate();
    if (validationError) return setError(validationError);
    setError(null);
    setConfirming(true);
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onSubmit(parsedQuantity, description.trim() || undefined);
      setConfirming(false);
      setQuantity("1");
      setDescription("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel registrar a movimentacao"));
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4">
        <div className="w-full max-w-sm rounded-t-md bg-white p-5 shadow-lg sm:rounded-md">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">
              {isEntrada ? "Entrada de estoque" : "Retirada de estoque"}
            </h2>
            <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:bg-surface" aria-label="Fechar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mb-4 text-sm text-muted">
            {part.name} <span className="font-mono">({part.sku})</span> - estoque atual: {part.quantity}
          </p>

          <label className="mb-1 block text-sm font-medium text-ink">Quantidade</label>
          <input
            type="number"
            min={1}
            autoFocus
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-12 w-full rounded border border-line px-3 text-center text-lg font-semibold focus:border-accent"
          />

          <label className="mb-1 mt-3 block text-sm font-medium text-ink">
            Observacao/motivo <span className="font-normal text-muted">(opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded border border-line px-3 py-2 text-sm focus:border-accent"
          />

          {error && <p className="mt-2 text-sm text-danger">{error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className={`rounded px-5 py-2.5 text-sm font-semibold text-white ${
                isEntrada ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
              }`}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title={isEntrada ? "Confirmar entrada" : "Confirmar retirada"}
        tone={isEntrada ? "accent" : "danger"}
        loading={submitting}
        description={
          <>
            Tem certeza que deseja {isEntrada ? "adicionar" : "retirar"} <strong>{parsedQuantity}</strong> unidade(s) de{" "}
            <strong>{part.name}</strong>? Estoque: {part.quantity} &rarr; {projected}.
          </>
        }
        confirmLabel={isEntrada ? "Confirmar entrada" : "Confirmar retirada"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
