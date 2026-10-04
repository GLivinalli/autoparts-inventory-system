import { FormEvent, useEffect, useRef, useState } from "react";
import type { Product } from "@/types";
import { getApiErrorMessage } from "@/api/client";
import * as productsApi from "@/api/products";
import { onlyDigits, sanitizeMoney } from "@/utils/inputs";

export interface ProductFormValues {
  name: string;
  manufacturer: string;
  initialQuantity: string;
  totalValueReais: string;
  // Preenchido quando o usuario escolhe um produto que JA existe na lista:
  // nesse caso o botao final registra uma ENTRADA nele, em vez de criar outro.
  existingProductId: string;
}

const NEW_OPTION = "__new__";

function emptyForm(): ProductFormValues {
  return { name: "", manufacturer: "", initialQuantity: "", totalValueReais: "", existingProductId: "" };
}

// O "0" e o "0,00" de sugestao somem assim que o campo e clicado.
const numberInputClass =
  "h-11 w-full rounded border border-line px-3 text-sm placeholder:text-muted focus:border-accent focus:placeholder:text-transparent";

interface ProductFormProps {
  open: boolean;
  editingProduct: Product | null;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}

export function ProductForm({ open, editingProduct, onClose, onSubmit }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(emptyForm());
  const [products, setProducts] = useState<Product[]>([]);
  const [newName, setNewName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialSnapshotRef = useRef("");

  useEffect(() => {
    if (!open) return;
    const initial: ProductFormValues = editingProduct
      ? { ...emptyForm(), name: editingProduct.name, manufacturer: editingProduct.manufacturer }
      : emptyForm();
    setValues(initial);
    initialSnapshotRef.current = JSON.stringify(initial);
    setNewName("");
    setNotice(null);
    setError(null);
  }, [open, editingProduct]);

  // Lista de produtos ja cadastrados (so no cadastro, nao na edicao).
  useEffect(() => {
    if (!open || editingProduct) return;
    productsApi
      .listProducts({ page: 1, pageSize: 500 })
      .then((data) => setProducts(data.items))
      .catch(() => undefined);
  }, [open, editingProduct]);

  if (!open) return null;

  const isExisting = !!values.existingProductId;
  const selectValue = values.existingProductId || (values.name ? NEW_OPTION : "");

  function handleRequestClose() {
    const isDirty = JSON.stringify(values) !== initialSnapshotRef.current;
    if (isDirty && !window.confirm("Voce tem alteracoes nao salvas. Deseja realmente fechar sem salvar?")) {
      return;
    }
    onClose();
  }

  function handleSelectChange(value: string) {
    setNotice(null);
    if (value === "") {
      setValues((v) => ({ ...v, name: "", manufacturer: "", existingProductId: "" }));
    } else if (value !== NEW_OPTION) {
      const product = products.find((p) => p.id === value);
      if (product) {
        setValues((v) => ({ ...v, name: "", manufacturer: product.manufacturer, existingProductId: product.id }));
      }
    }
  }

  // Botao "Adicionar": coloca um nome novo na lista. Se o nome ja existe,
  // seleciona o que ja existe (assim nao nasce produto repetido).
  function handleAddNew() {
    const typed = newName.trim().toUpperCase();
    if (!typed) return;

    const existing = products.find((p) => p.name.trim().toUpperCase() === typed);
    if (existing) {
      setValues((v) => ({ ...v, name: "", manufacturer: existing.manufacturer, existingProductId: existing.id }));
      setNotice(
        `"${existing.name}" ja esta na lista (${existing.manufacturer}). Selecionei ele pra voce - e so informar a quantidade e o valor.`
      );
    } else {
      setValues((v) => ({
        ...v,
        name: typed,
        existingProductId: "",
        manufacturer: v.existingProductId ? "" : v.manufacturer,
      }));
      setNotice(null);
    }
    setNewName("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!editingProduct) {
      if (!isExisting && !values.name.trim()) {
        return setError("Selecione um produto da lista ou adicione um novo");
      }
      if (!isExisting && !values.manufacturer.trim()) {
        return setError("Informe o fabricante");
      }
    }

    const quantity = Number(values.initialQuantity) || 0;
    if (isExisting && quantity <= 0) {
      return setError("Informe a quantidade que esta entrando");
    }
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
          {editingProduct ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Nome do produto</label>
              <input
                required
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                className="h-11 w-full rounded border border-line px-3 text-sm uppercase focus:border-accent"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Nome do produto</label>
              <select
                value={selectValue}
                onChange={(e) => handleSelectChange(e.target.value)}
                className="h-11 w-full rounded border border-line bg-white px-3 text-sm focus:border-accent"
              >
                <option value="">Selecione</option>
                {values.name && !isExisting && <option value={NEW_OPTION}>{values.name} (novo)</option>}
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.manufacturer}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNew();
                    }
                  }}
                  placeholder="Cadastrar novo produto"
                  className="h-9 flex-1 rounded border border-line px-3 text-sm uppercase focus:border-accent"
                />
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="rounded border border-line px-3 text-sm font-medium text-steel hover:bg-steel-soft disabled:opacity-60"
                >
                  Adicionar
                </button>
              </div>
              {notice && <p className="mt-2 text-xs text-steel">{notice}</p>}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Fabricante</label>
            <input
              required={!!editingProduct}
              disabled={isExisting}
              value={values.manufacturer}
              onChange={(e) => setValues((v) => ({ ...v, manufacturer: e.target.value }))}
              placeholder="Ex.: CHAMEX, DESCARPACK"
              className="h-11 w-full rounded border border-line px-3 text-sm uppercase focus:border-accent disabled:bg-surface disabled:text-muted"
            />
            {isExisting && <p className="mt-1 text-xs text-muted">Fabricante do produto selecionado.</p>}
          </div>

          {!editingProduct && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Quantidade</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={values.initialQuantity}
                  onChange={(e) => setValues((v) => ({ ...v, initialQuantity: onlyDigits(e.target.value) }))}
                  placeholder="0"
                  className={numberInputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Valor total (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={values.totalValueReais}
                  onChange={(e) => setValues((v) => ({ ...v, totalValueReais: sanitizeMoney(e.target.value) }))}
                  placeholder="0,00"
                  className={numberInputClass}
                />
              </div>
              <p className="col-span-2 text-xs text-muted">
                {isExisting
                  ? "Informe a quantidade que esta entrando e quanto voce pagou no total - a entrada soma no estoque desse produto."
                  : "Informe quanto voce pagou no total pela quantidade acima - o custo por unidade e calculado sozinho. Se deixar a quantidade vazia, o produto fica cadastrado sem estoque."}
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
            {submitting ? "Salvando..." : isExisting ? "Registrar entrada" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
