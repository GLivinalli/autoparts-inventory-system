import { useEffect, useState } from "react";
import type { MovementType, Product, ProductBatch, ProductMovement } from "@/types";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { Pagination } from "@/components/common/Pagination";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as productsApi from "@/api/products";
import { getApiErrorMessage } from "@/api/client";
import { formatCentsToBRL, formatDateTime } from "@/utils/labels";

interface ProductDetailModalProps {
  productId: string;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onChanged: () => void;
  refreshKey: number;
}

export function ProductDetailModal({ productId, onClose, onEdit, onChanged, refreshKey }: ProductDetailModalProps) {
  const { can, isAdmin } = useAuth();
  const { notify } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [daysInStock, setDaysInStock] = useState<number | null>(null);
  const [stockValueCents, setStockValueCents] = useState(0);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [history, setHistory] = useState<ProductMovement[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingMovement, setDeletingMovement] = useState<ProductMovement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [editingDateMovement, setEditingDateMovement] = useState<ProductMovement | null>(null);
  const [newDate, setNewDate] = useState("");
  const [savingDate, setSavingDate] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let active = true;
    setLoading(true);
    productsApi
      .getProduct(productId, historyPage)
      .then((data) => {
        if (!active) return;
        setProduct(data.product);
        setDaysInStock(data.daysInStock);
        setStockValueCents(data.stockValueCents);
        setBatches(data.batches);
        setHistory(data.history.items);
        setTotalPages(data.history.totalPages);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
    return () => {
      active = false;
    };
  }, [productId, historyPage, refreshKey]);

  async function handleConfirmDelete() {
    if (!deletingMovement) return;
    setDeleting(true);
    try {
      await productsApi.deleteMovement(deletingMovement.id);
      notify("Movimentacao excluida", "success");
      setDeletingMovement(null);
      onChanged();
    } catch (err) {
      notify(getApiErrorMessage(err, "Nao foi possivel excluir"), "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleArchiveToggle() {
    if (!product) return;
    setArchiving(true);
    try {
      const updated = product.archivedAt
        ? await productsApi.unarchiveProduct(product.id)
        : await productsApi.archiveProduct(product.id);
      setProduct(updated);
      setConfirmingArchive(false);
      onChanged();
    } catch (err) {
      notify(getApiErrorMessage(err), "error");
    } finally {
      setArchiving(false);
    }
  }

  function openDateEditor(movement: ProductMovement) {
    setEditingDateMovement(movement);
    setNewDate(movement.createdAt.slice(0, 10));
  }

  async function handleSaveDate() {
    if (!editingDateMovement || !newDate) return;
    setSavingDate(true);
    try {
      await productsApi.updateMovementDate(editingDateMovement.id, newDate);
      notify("Data da entrada alterada", "success");
      setEditingDateMovement(null);
      onChanged();
    } catch (err) {
      notify(getApiErrorMessage(err, "Nao foi possivel alterar a data"), "error");
    } finally {
      setSavingDate(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/40 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-md bg-white shadow-lg sm:rounded-md">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <h2 className="font-display text-2xl font-semibold text-ink">Detalhes do produto</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:bg-surface" aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {error && <p className="px-5 py-4 text-sm text-danger">{error}</p>}

        {product && !loading && (
          <div className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-2xl font-semibold text-ink">{product.name}</h3>
                <p className="text-sm text-muted">{product.manufacturer}</p>
              </div>
              {product.archivedAt && <Badge tone="neutral">Arquivado</Badge>}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded border border-line p-3">
                <p className="text-xs text-muted">Estoque</p>
                <p className={`font-display text-3xl font-semibold ${product.quantity === 0 ? "text-danger" : "text-ink"}`}>
                  {product.quantity}
                </p>
              </div>
              <div className="rounded border border-line p-3">
                <p className="text-xs text-muted">Valor em estoque</p>
                <p className="mt-1 text-sm font-semibold text-ink">{formatCentsToBRL(stockValueCents)}</p>
              </div>
              <div className="rounded border border-line p-3">
                <p className="text-xs text-muted">Dias em estoque</p>
                <p className="mt-1 text-sm font-medium text-ink">{daysInStock ?? "-"}</p>
              </div>
              <div className="rounded border border-line p-3">
                <p className="text-xs text-muted">Cadastrado por</p>
                <p className="mt-1 truncate text-sm font-medium text-ink">{product.createdBy.name}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {can("canManageProducts") && !product.archivedAt && (
                <button
                  onClick={() => onEdit(product)}
                  className="rounded border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface"
                >
                  Editar
                </button>
              )}
              {can("canManageProducts") && (
                <button
                  onClick={() => (product.archivedAt ? handleArchiveToggle() : setConfirmingArchive(true))}
                  disabled={archiving}
                  className={`rounded px-4 py-2.5 text-sm font-medium ${
                    product.archivedAt
                      ? "border border-line text-ink hover:bg-surface"
                      : "text-muted hover:bg-surface"
                  }`}
                >
                  {product.archivedAt ? "Reativar" : "Arquivar"}
                </button>
              )}
            </div>

            {batches.length > 0 && (
              <div className="mt-6">
                <h4 className="mb-2 font-display text-lg font-semibold text-ink">Lotes em aberto (FIFO)</h4>
                <ul className="divide-y divide-line rounded border border-line">
                  {batches.map((b) => (
                    <li key={b.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p className="text-ink">
                          {b.quantityRemaining} de {b.quantityOriginal} unid. a {formatCentsToBRL(b.unitCostCents)}/un.
                        </p>
                        <p className="text-xs text-muted">Entrada em {formatDateTime(b.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <h4 className="mb-2 font-display text-lg font-semibold text-ink">Historico de movimentacoes</h4>
              {history.length === 0 && <p className="text-sm text-muted">Nenhuma movimentacao registrada ainda.</p>}
              <ul className="divide-y divide-line rounded border border-line">
                {history.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge tone={m.type === "ENTRADA" ? "success" : "danger"}>{m.type}</Badge>
                        <span className="text-sm text-ink-soft">{formatDateTime(m.createdAt)}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted">
                        {m.type === "ENTRADA"
                          ? `${m.user.name} - custo ${formatCentsToBRL(m.unitCostCents ?? 0)}/un.`
                          : `${m.setor} / ${m.funcionario} - ${m.user.name}`}
                        {m.description ? ` - ${m.description}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <div className="mr-1 text-right">
                        <p
                          className={`font-display text-lg font-semibold ${
                            m.type === "ENTRADA" ? "text-success" : "text-danger"
                          }`}
                        >
                          {m.type === "ENTRADA" ? "+" : "-"}
                          {m.quantity}
                        </p>
                        <p className="text-xs text-muted">{formatCentsToBRL(m.totalCents)}</p>
                      </div>
                      {isAdmin && m.type === "ENTRADA" && (
                        <button
                          onClick={() => openDateEditor(m)}
                          className="rounded p-1.5 text-muted hover:bg-steel-soft hover:text-steel"
                          aria-label="Alterar data da entrada"
                          title="Alterar data da entrada"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" />
                          </svg>
                        </button>
                      )}
                      {can("canDeleteProductMoves") && (
                        <button
                          onClick={() => setDeletingMovement(m)}
                          className="rounded p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
                          aria-label="Excluir movimentacao"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination page={historyPage} totalPages={totalPages} onChange={setHistoryPage} />
            </div>
          </div>
        )}
      </div>

      {editingDateMovement && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-sm rounded-t-md bg-white p-5 shadow-lg sm:rounded-md">
            <h3 className="font-display text-xl font-semibold text-ink">Alterar data da entrada</h3>
            <p className="mt-1 text-sm text-muted">
              Entrada de {editingDateMovement.quantity} unidade(s). A nova data passa a valer no historico, nos dias em
              estoque, na ordem do FIFO e nos relatorios por mes. Saidas que ja foram feitas nao sao recalculadas.
            </p>
            <label className="mb-1 mt-4 block text-sm font-medium text-ink">Nova data</label>
            <input
              type="date"
              value={newDate}
              max={today}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDateMovement(null)}
                className="rounded px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveDate}
                disabled={savingDate || !newDate}
                className="rounded bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
              >
                {savingDate ? "Salvando..." : "Salvar data"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deletingMovement}
        title="Excluir movimentacao"
        tone="danger"
        loading={deleting}
        description={
          deletingMovement?.type === ("ENTRADA" as MovementType)
            ? "So e possivel excluir se este lote ainda nao foi consumido por nenhuma saida. Isso nao pode ser desfeito."
            : "A quantidade sera devolvida automaticamente aos lotes de origem. Isso nao pode ser desfeito."
        }
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingMovement(null)}
      />

      <ConfirmDialog
        open={confirmingArchive}
        title="Arquivar produto"
        tone="danger"
        loading={archiving}
        description="O produto sai da listagem ativa, mas todo o historico e mantido. Voce pode reativar depois."
        confirmLabel="Arquivar"
        onConfirm={handleArchiveToggle}
        onCancel={() => setConfirmingArchive(false)}
      />
    </div>
  );
}
