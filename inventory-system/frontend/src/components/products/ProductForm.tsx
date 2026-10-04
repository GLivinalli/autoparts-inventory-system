import { FormEvent, useEffect, useRef, useState } from "react";
import type { Product } from "@/types";
import { getApiErrorMessage } from "@/api/client";
import { useDebounce } from "@/hooks/useDebounce";
import * as productsApi from "@/api/products";

export interface ProductFormValues {
  name: string;
  manufacturer: string;
  initialQuantity: string;
  totalValueReais: string;
}

function emptyForm(): ProductFormValues {
  return { name: "", manufacturer: "", initialQuantity: "", totalValueReais: "" };
}

interface ProductFormProps {
  open: boolean;
  editingProduct: Product | null;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}

export function ProductForm({ open, editingProduct, onClose, onSubmit }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [searchingSimilar, setSearchingSimilar] = useState(false);
  const initialSnapshotRef = useRef("");
  const debouncedName = useDebounce(values.name.trim(), 300);

  useEffect(() => {
    if (!open) return;
    const initial: ProductFormValues = editingProduct
      ? {
          name: editingProduct.name,
          manufacturer: editingProduct.manufacturer,
          initialQuantity: "",
          totalValueReais: "",
        }
      : emptyForm();
    setValues(initial);
    initialSnapshotRef.current = JSON.stringify(initial);
    setError(null);
  }, [open, editingProduct]);

  // Lista de produtos ja cadastrados parecidos com o nome que esta sendo
  // digitado - para evitar cadastrar o mesmo item duas vezes.
  useEffect(() => {
    if (!open || editingProduct || debouncedName.length < 2) {
      setSimilar([]);
      return;
    }
    let active = true;
    setSearchingSimilar(true);
    productsApi
      .listProducts({ page: 1, pageSize: 8, search: debouncedName })
      .then((data) => {
        if (active) setSimilar(data.items);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setSearchingSimilar(false);
      });
    return () => {
      active = false;
    };
  }, [open, editingProduct, debouncedName]);

  if (!open) return null;

  function handleRequestClose() {
    const isDirty = JSON.stringify(values) !== initialSnapshotRef.current;
    if (isDirty && !window.confirm("Voce tem alteracoes nao salvas. Deseja realmente fechar sem salvar?")) {
      return;
    }
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const quantity = Number(values.initialQuantity) || 0;
    if (quantity > 0) {
      if (!values.totalValueReais.trim()) return setError("Informe o valor total pago");
      const value = Number(values.totalValueReais.replace(",", "."));
      if (Number.isNaN(value) || value < 0) return setError("Informe um valor total valido");
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel salvar o produto"));
    } finally {
      setSubmitting(false);
    }
  }

  const showSimilar = !editingProduct && debouncedName.length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/40 sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-md bg-white p-5 shadow-lg sm:rounded-md sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">
            {editingProduct ? "Editar produto" : "Cadastrar produto"}
          </h2>
          <button type="button" onClick={handleRequestClose} className="rounded p-1 text-muted hover:bg-surface" aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Nome do produto</label>
            <input
              required
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder="Ex.: PAPEL A4, LUVA DE PROCEDIMENTO"
              className="h-11 w-full rounded border border-line px-3 text-sm uppercase focus:border-accent"
            />

            {showSimilar && (
              <div className="mt-2 rounded border border-line bg-surface p-2">
                <p className="mb-1 text-xs font-medium text-muted">Produtos ja cadastrados parecidos:</p>
                {searchingSimilar ? (
                  <p className="text-xs text-muted">Buscando...</p>
                ) : similar.length === 0 ? (
                  <p className="text-xs text-muted">Nenhum parecido encontrado - pode cadastrar.</p>
                ) : (
                  <ul className="max-h-36 space-y-1 overflow-y-auto">
                    {similar.map((p) => (
                      <li key={p.id} className="text-xs text-ink">
                        {p.name} <span className="text-muted">- {p.manufacturer} (estoque: {p.quantity})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Fabricante</label>
            <input
              required
              value={values.manufacturer}
              onChange={(e) => setValues((v) => ({ ...v, manufacturer: e.target.value }))}
              placeholder="Ex.: CHAMEX, DESCARPACK"
              className="h-11 w-full rounded border border-line px-3 text-sm uppercase focus:border-accent"
            />
          </div>

          {!editingProduct && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Quantidade</label>
                <input
                  type="number"
                  min={0}
                  value={values.initialQuantity}
                  onChange={(e) => setValues((v) => ({ ...v, initialQuantity: e.target.value }))}
                  placeholder="0"
                  className="h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Valor total (R$)</label>
                <input
                  inputMode="decimal"
                  value={values.totalValueReais}
                  onChange={(e) => setValues((v) => ({ ...v, totalValueReais: e.target.value }))}
                  placeholder="0,00"
                  className="h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
                />
              </div>
              <p className="col-span-2 text-xs text-muted">
                Informe quanto voce pagou no total pela quantidade acima - o custo por unidade e calculado sozinho.
                Se deixar a quantidade vazia, o produto fica cadastrado sem estoque.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={handleRequestClose} className="rounded px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
          >
            {submitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
