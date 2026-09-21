import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getApiErrorMessage } from "@/api/client";
import * as productsApi from "@/api/products";

interface QuickEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (productId: string, quantity: number, totalValueReais: number, description?: string) => Promise<void>;
}

export function QuickEntryModal({ open, onClose, onSubmit }: QuickEntryModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [totalValueReais, setTotalValueReais] = useState("0,00");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingProducts(true);
    productsApi
      .listProducts({ page: 1, pageSize: 500 })
      .then((data) => setProducts(data.items))
      .finally(() => setLoadingProducts(false));
  }, [open]);

  if (!open) return null;

  const selectedProduct = products.find((p) => p.id === productId) ?? null;
  const parsedQuantity = Number(quantity);
  const parsedValue = Number(totalValueReais.replace(",", "."));
  const projected = selectedProduct ? selectedProduct.quantity + parsedQuantity : null;

  function validate(): string | null {
    if (!productId) return "Selecione um produto";
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) return "Informe uma quantidade valida";
    if (Number.isNaN(parsedValue) || parsedValue < 0) return "Informe um valor total valido";
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
      await onSubmit(productId, parsedQuantity, parsedValue, description.trim() || undefined);
      setConfirming(false);
      setProductId("");
      setQuantity("1");
      setTotalValueReais("0,00");
      setDescription("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel registrar a entrada"));
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4">
        <div className="w-full max-w-sm rounded-t-md bg-white p-5 shadow-lg sm:rounded-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">Entrada de produto</h2>
            <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:bg-surface" aria-label="Fechar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <label className="mb-1 block text-sm font-medium text-ink">Produto</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={loadingProducts}
            className="mb-1 h-11 w-full rounded border border-line bg-white px-3 text-sm focus:border-accent"
          >
            <option value="">{loadingProducts ? "Carregando..." : "Selecione"}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.manufacturer} (estoque: {p.quantity})
              </option>
            ))}
          </select>
          {selectedProduct && (
            <p className="mb-3 text-xs text-muted">Estoque atual: {selectedProduct.quantity} unidades</p>
          )}

          <label className="mb-1 block text-sm font-medium text-ink">Quantidade</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mb-3 h-12 w-full rounded border border-line px-3 text-center text-lg font-semibold focus:border-accent"
          />

          <label className="mb-1 block text-sm font-medium text-ink">Valor total pago (R$)</label>
          <input
            inputMode="decimal"
            value={totalValueReais}
            onChange={(e) => setTotalValueReais(e.target.value)}
            placeholder="0,00"
            className="mb-1 h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
          />
          <p className="mb-3 text-xs text-muted">
            Valor total da compra dessas {parsedQuantity || 0} unidades - o custo por unidade e calculado sozinho.
          </p>

          <label className="mb-1 block text-sm font-medium text-ink">
            Observacao <span className="font-normal text-muted">(opcional)</span>
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
              className="rounded bg-success px-5 py-2.5 text-sm font-semibold text-white hover:bg-success/90"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Confirmar entrada"
        tone="accent"
        loading={submitting}
        description={
          selectedProduct && (
            <>
              Tem certeza que deseja adicionar <strong>{parsedQuantity}</strong> unidade(s) de{" "}
              <strong>{selectedProduct.name}</strong>? Estoque: {selectedProduct.quantity} &rarr; {projected}.
            </>
          )
        }
        confirmLabel="Confirmar entrada"
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
