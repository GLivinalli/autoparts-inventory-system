import { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "accent";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Usado para toda operacao importante ("Tem certeza que deseja retirar 2
// unidades?", arquivar peca, etc.) conforme spec item 11.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "accent",
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-md bg-white p-5 shadow-lg sm:rounded-md">
        <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
        <div className="mt-2 text-sm text-muted">{description}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
              tone === "danger" ? "bg-danger hover:bg-danger/90" : "bg-accent hover:bg-accent-dark"
            }`}
          >
            {loading ? "Aguarde..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
