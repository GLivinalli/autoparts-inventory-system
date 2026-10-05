import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { ManageListsModal } from "@/components/products/ManageListsModal";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/api/client";
import * as productsApi from "@/api/products";
import * as listsApi from "@/api/productLists";
import type { ListItem } from "@/api/productLists";
import { onlyDigits } from "@/utils/inputs";

interface QuickWithdrawalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    productId: string,
    quantity: number,
    setor: string,
    funcionario: string,
    description?: string
  ) => Promise<void>;
}

const selectClass = "mb-3 h-11 w-full rounded border border-line bg-white px-3 text-sm focus:border-accent";
// Mesmo formato do campo "Quantidade" do cadastro de produto.
const numberInputClass =
  "mb-3 h-11 w-full rounded border border-line px-3 text-sm placeholder:text-muted focus:border-accent focus:placeholder:text-transparent";

export function QuickWithdrawalModal({ open, onClose, onSubmit }: QuickWithdrawalModalProps) {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [sectors, setSectors] = useState<ListItem[]>([]);
  const [employees, setEmployees] = useState<ListItem[]>([]);
  const [managing, setManaging] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [setor, setSetor] = useState("");
  const [funcionario, setFuncionario] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function loadLists() {
    Promise.all([listsApi.listSectors(), listsApi.listEmployees()])
      .then(([s, e]) => {
        setSectors(s);
        setEmployees(e);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    if (!open) return;
    setLoadingProducts(true);
    productsApi
      .listProducts({ page: 1, pageSize: 500 })
      .then((data) => setProducts(data.items))
      .finally(() => setLoadingProducts(false));
    loadLists();
  }, [open]);

  if (!open) return null;

  const selectedProduct = products.find((p) => p.id === productId) ?? null;
  const parsedQuantity = Number(quantity);
  const projected = selectedProduct ? selectedProduct.quantity - parsedQuantity : null;

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.name} - ${p.manufacturer} (estoque: ${p.quantity})`,
  }));

  function validate(): string | null {
    if (!productId) return "Selecione um produto";
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) return "Informe uma quantidade valida";
    if (!setor) return "Selecione o setor";
    if (!funcionario) return "Selecione o funcionario";
    if (selectedProduct && parsedQuantity > selectedProduct.quantity) return "Quantidade insuficiente em estoque.";
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
      await onSubmit(productId, parsedQuantity, setor, funcionario, description.trim() || undefined);
      setConfirming(false);
      setProductId("");
      setQuantity("");
      setSetor("");
      setFuncionario("");
      setDescription("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel registrar a saida"));
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }

  const emptyListHint = isAdmin
    ? "Lista vazia. Use \"Gerenciar setores e funcionarios\" para adicionar."
    : "Lista vazia. Peca a um administrador para adicionar.";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/40 sm:items-center sm:p-4">
        <div className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-md bg-white p-5 shadow-lg sm:rounded-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">Retirada de produto</h2>
            <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:bg-surface" aria-label="Fechar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <label className="mb-1 block text-sm font-medium text-ink">Produto</label>
          <SearchableSelect
            className="mb-1"
            options={productOptions}
            value={productId}
            onChange={setProductId}
            disabled={loadingProducts}
            placeholder={loadingProducts ? "Carregando..." : "Selecione"}
          />
          {selectedProduct && (
            <p className="mb-3 text-xs text-muted">Estoque atual: {selectedProduct.quantity} unidades</p>
          )}
          {!selectedProduct && <div className="mb-3" />}

          <label className="mb-1 block text-sm font-medium text-ink">Quantidade</label>
          <input
            type="text"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(onlyDigits(e.target.value))}
            placeholder="0"
            className={numberInputClass}
          />

          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-ink">Setor</label>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setManaging(true)}
                className="text-xs font-medium text-steel hover:underline"
              >
                Gerenciar setores e funcionarios
              </button>
            )}
          </div>
          <select value={setor} onChange={(e) => setSetor(e.target.value)} className={selectClass}>
            <option value="">Selecione</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          {sectors.length === 0 && <p className="-mt-2 mb-3 text-xs text-muted">{emptyListHint}</p>}

          <label className="mb-1 block text-sm font-medium text-ink">Funcionario</label>
          <select value={funcionario} onChange={(e) => setFuncionario(e.target.value)} className={selectClass}>
            <option value="">Selecione</option>
            {employees.map((e) => (
              <option key={e.id} value={e.name}>
                {e.name}
              </option>
            ))}
          </select>
          {employees.length === 0 && <p className="-mt-2 mb-3 text-xs text-muted">{emptyListHint}</p>}

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
              className="rounded bg-danger px-5 py-2.5 text-sm font-semibold text-white hover:bg-danger/90"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>

      <ManageListsModal open={managing} onClose={() => setManaging(false)} onChanged={loadLists} />

      <ConfirmDialog
        open={confirming}
        title="Confirmar saida"
        tone="danger"
        loading={submitting}
        description={
          selectedProduct && (
            <>
              Tem certeza que deseja retirar <strong>{parsedQuantity}</strong> unidade(s) de{" "}
              <strong>{selectedProduct.name}</strong>? Estoque: {selectedProduct.quantity} &rarr; {projected}.
            </>
          )
        }
        confirmLabel="Confirmar saida"
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
