import { useEffect, useState } from "react";
import type { Manufacturer, Part } from "@/types";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterBar, FilterValues } from "@/components/common/FilterBar";
import { Pagination } from "@/components/common/Pagination";
import { Spinner } from "@/components/common/Spinner";
import { PartTable } from "@/components/parts/PartTable";
import { PartCard } from "@/components/parts/PartCard";
import { PartForm, PartFormValues } from "@/components/parts/PartForm";
import { PartDetailModal } from "@/components/parts/PartDetailModal";
import { StockMovementModal } from "@/components/parts/StockMovementModal";
import { useAuth } from "@/context/AuthContext";import { useEffect, useState } from "react";
import type { Movement, Part } from "@/types";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { Pagination } from "@/components/common/Pagination";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ImageLightbox } from "@/components/common/ImageLightbox";
import { useAuth } from "@/context/AuthContext";
import { getPart, archivePart, unarchivePart } from "@/api/parts";
import { getApiErrorMessage } from "@/api/client";
import { CONDITION_LABELS, formatDate, formatDateTime } from "@/utils/labels";

interface PartDetailModalProps {
  partId: string;
  onClose: () => void;
  onEdit: (part: Part) => void;
  onStockIn: (part: Part) => void;
  onStockOut: (part: Part) => void;
  onArchived: () => void;
  refreshKey: number;
}

export function PartDetailModal({
  partId,
  onClose,
  onEdit,
  onStockIn,
  onStockOut,
  onArchived,
  refreshKey,
}: PartDetailModalProps) {
  const { can } = useAuth();
  const [part, setPart] = useState<Part | null>(null);
  const [history, setHistory] = useState<Movement[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPart(partId, historyPage)
      .then((data) => {
        if (!active) return;
        setPart(data.part);
        setHistory(data.history.items);
        setTotalPages(data.history.totalPages);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
    return () => {
      active = false;
    };
  }, [partId, historyPage, refreshKey]);

  async function handleArchiveToggle() {
    if (!part) return;
    setArchiving(true);
    try {
      if (part.archivedAt) {
        const updated = await unarchivePart(part.id);
        setPart(updated);
      } else {
        const updated = await archivePart(part.id);
        setPart(updated);
        onArchived();
      }
      setConfirmingArchive(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/40 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-md bg-white shadow-lg sm:rounded-md">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <h2 className="font-display text-2xl font-semibold text-ink">Detalhes da peca</h2>
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

        {part && !loading && (
          <div className="p-5">
            <div className="flex gap-4">
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => part.photoUrl && setLightboxSrc(part.photoUrl)}
                  disabled={!part.photoUrl}
                  className="h-28 w-28 overflow-hidden rounded bg-surface disabled:cursor-default"
                  aria-label="Ampliar foto da peca"
                >
                  {part.photoUrl ? (
                    <img
                      src={part.photoUrl}
                      alt={part.name}
                      className="h-full w-full cursor-zoom-in object-cover transition hover:opacity-90"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 8h18l-1.5 12.5A2 2 0 0 1 17.5 22h-11a2 2 0 0 1-2-1.5L3 8Z" />
                      </svg>
                    </div>
                  )}
                </button>

                {part.condition === "COM_DANO" && part.damagePhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setLightboxSrc(part.damagePhotoUrl)}
                    className="relative h-28 w-28 overflow-hidden rounded bg-surface"
                    aria-label="Ampliar foto do dano"
                  >
                    <img
                      src={part.damagePhotoUrl}
                      alt={`Dano em ${part.name}`}
                      className="h-full w-full cursor-zoom-in object-cover transition hover:opacity-90"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-danger/85 py-0.5 text-center text-[10px] font-medium text-white">
                      Dano
                    </span>
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-ink">{part.name}</h3>
                    <p className="font-mono text-sm text-muted">{part.sku || "Sem SKU"}</p>
                  </div>
                  {part.archivedAt && <Badge tone="neutral">Arquivada</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="steel">{part.manufacturer.name}</Badge>
                  <Badge tone={part.condition === "COM_DANO" ? "danger" : "success"}>
                    {CONDITION_LABELS[part.condition]}
                  </Badge>
                </div>
                {part.damageNotes && <p className="mt-2 text-sm text-muted">{part.damageNotes}</p>}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded border border-line p-3">
                <p className="text-xs text-muted">Estoque</p>
                <p className={`font-display text-3xl font-semibold ${part.quantity === 0 ? "text-danger" : "text-ink"}`}>
                  {part.quantity}
                </p>
              </div>
              <div className="rounded border border-line p-3">
                <p className="text-xs text-muted">Inventario</p>
                <p className="mt-1 text-sm font-medium text-ink">{formatDate(part.inventoryDate)}</p>
              </div>
              <div className="rounded border border-line p-3">
                <p className="text-xs text-muted">Adicionado por</p>
                <p className="mt-1 truncate text-sm font-medium text-ink">{part.createdBy.name}</p>
              </div>
              <div className="rounded border border-line p-3">
                <p className="text-xs text-muted">Cadastro no sistema</p>
                <p className="mt-1 text-sm font-medium text-ink">{formatDateTime(part.createdAt)}</p>
              </div>
            </div>

            {!part.archivedAt && (
              <div className="mt-4 flex flex-wrap gap-2">
                {can("canStockIn") && (
                  <button
                    onClick={() => onStockIn(part)}
                    className="rounded bg-success px-4 py-2.5 text-sm font-semibold text-white hover:bg-success/90"
                  >
                    Entrada
                  </button>
                )}
                {can("canStockOut") && (
                  <button
                    onClick={() => onStockOut(part)}
                    className="rounded bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:bg-danger/90"
                  >
                    Retirada
                  </button>
                )}
                {can("canEditParts") && (
                  <button
                    onClick={() => onEdit(part)}
                    className="rounded border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface"
                  >
                    Editar
                  </button>
                )}
                {can("canArchiveParts") && (
                  <button
                    onClick={() => setConfirmingArchive(true)}
                    className="rounded px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface"
                  >
                    Arquivar
                  </button>
                )}
              </div>
            )}
            {part.archivedAt && can("canArchiveParts") && (
              <div className="mt-4">
                <button
                  onClick={handleArchiveToggle}
                  disabled={archiving}
                  className="rounded border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface"
                >
                  Reativar peca
                </button>
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
                        {m.user.name} - {m.quantityBefore} &rarr; {m.quantityAfter}
                        {m.description ? ` - ${m.description}` : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 font-display text-xl font-semibold ${
                        m.type === "ENTRADA" ? "text-success" : "text-danger"
                      }`}
                    >
                      {m.type === "ENTRADA" ? "+" : "-"}
                      {m.quantity}
                    </span>
                  </li>
                ))}
              </ul>
              <Pagination page={historyPage} totalPages={totalPages} onChange={setHistoryPage} />
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmingArchive}
        title="Arquivar peca"
        tone="danger"
        loading={archiving}
        description="A peca sai da listagem ativa, mas todo o historico e mantido. Voce pode reativar depois."
        confirmLabel="Arquivar"
        onConfirm={handleArchiveToggle}
        onCancel={() => setConfirmingArchive(false)}
      />

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} alt={part?.name ?? "Foto"} onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  );
}
import { useToast } from "@/context/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import * as partsApi from "@/api/parts";
import * as manufacturersApi from "@/api/manufacturers";
import * as movementsApi from "@/api/movements";
import { getApiErrorMessage } from "@/api/client";
import type { MovementType } from "@/types";

const EMPTY_FILTERS: FilterValues = { manufacturerId: "", condition: "", stock: "" };

export function PartsList() {
  const { can } = useAuth();
  const { notify } = useToast();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const [parts, setParts] = useState<Part[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [movementModal, setMovementModal] = useState<{ part: Part; type: MovementType } | null>(null);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  function loadManufacturers() {
    manufacturersApi.listManufacturers().then(setManufacturers).catch(() => undefined);
  }

  useEffect(() => {
    loadManufacturers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    partsApi
      .listParts({
        page,
        pageSize: 20,
        search: debouncedSearch || undefined,
        manufacturerId: filters.manufacturerId || undefined,
        condition: (filters.condition || undefined) as never,
        stock: (filters.stock || undefined) as never,
      })
      .then((data) => {
        if (!active) return;
        setParts(data.items);
        setTotalPages(data.totalPages);
      })
      .catch((err) => notify(getApiErrorMessage(err), "error"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, debouncedSearch, filters]);

  function refreshList() {
    setPage((p) => p);
    setDetailRefreshKey((k) => k + 1);
    partsApi
      .listParts({
        page,
        pageSize: 20,
        search: debouncedSearch || undefined,
        manufacturerId: filters.manufacturerId || undefined,
        condition: (filters.condition || undefined) as never,
        stock: (filters.stock || undefined) as never,
      })
      .then((data) => {
        setParts(data.items);
        setTotalPages(data.totalPages);
      });
  }

  async function handleCreateOrUpdate(values: PartFormValues) {
    if (editingPart) {
      await partsApi.updatePart(editingPart.id, {
        name: values.name,
        sku: values.sku || undefined,
        manufacturerId: values.manufacturerId,
        condition: values.condition,
        damageNotes: values.condition === "COM_DANO" ? values.damageNotes : undefined,
        damagePhotoUrl: values.condition === "COM_DANO" ? values.damagePhotoUrl : null,
        inventoryDate: values.inventoryDate,
        photoUrl: values.photoUrl,
      });
      notify("Peca atualizada com sucesso", "success");
    } else {
      await partsApi.createPart({
        name: values.name,
        sku: values.sku || undefined,
        manufacturerId: values.manufacturerId,
        condition: values.condition,
        damageNotes: values.condition === "COM_DANO" ? values.damageNotes : undefined,
        damagePhotoUrl: values.condition === "COM_DANO" ? values.damagePhotoUrl : null,
        initialQuantity: Number(values.initialQuantity) || 0,
        inventoryDate: values.inventoryDate,
        photoUrl: values.photoUrl,
      });
      notify("Peca cadastrada com sucesso", "success");
    }
    setFormOpen(false);
    setEditingPart(null);
    refreshList();
  }

  async function handleMovementSubmit(quantity: number, description?: string) {
    if (!movementModal) return;
    await movementsApi.createMovement(movementModal.part.id, movementModal.type, quantity, description);
    notify(movementModal.type === "ENTRADA" ? "Entrada registrada" : "Retirada registrada", "success");
    setMovementModal(null);
    refreshList();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Pecas</h1>
          <p className="text-sm text-muted">Consulte, cadastre e controle o estoque</p>
        </div>
        {can("canCreateParts") && (
          <button
            onClick={() => {
              setEditingPart(null);
              setFormOpen(true);
            }}
            className="hidden rounded bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark sm:block"
          >
            Cadastrar peca
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <SearchBar value={search} onChange={setSearch} />
        <FilterBar manufacturers={manufacturers} values={filters} onChange={setFilters} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : parts.length === 0 ? (
        <div className="rounded border border-dashed border-line bg-white py-16 text-center">
          <p className="text-sm text-muted">Nenhuma peca encontrada com estes filtros.</p>
        </div>
      ) : (
        <>
          <div className="hidden rounded border border-line bg-white px-3 sm:block">
            <PartTable parts={parts} onSelect={(p) => setSelectedPartId(p.id)} />
          </div>
          <div className="flex flex-col gap-2 sm:hidden">
            {parts.map((p) => (
              <PartCard key={p.id} part={p} onClick={() => setSelectedPartId(p.id)} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {can("canCreateParts") && (
        <button
          onClick={() => {
            setEditingPart(null);
            setFormOpen(true);
          }}
          className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg sm:hidden"
          aria-label="Cadastrar peca"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}

      <PartForm
        open={formOpen}
        editingPart={editingPart}
        manufacturers={manufacturers}
        onManufacturersChange={loadManufacturers}
        onClose={() => {
          setFormOpen(false);
          setEditingPart(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      {selectedPartId && (
        <PartDetailModal
          partId={selectedPartId}
          refreshKey={detailRefreshKey}
          onClose={() => setSelectedPartId(null)}
          onEdit={(part) => {
            setEditingPart(part);
            setFormOpen(true);
            setSelectedPartId(null);
          }}
          onStockIn={(part) => setMovementModal({ part, type: "ENTRADA" })}
          onStockOut={(part) => setMovementModal({ part, type: "RETIRADA" })}
          onArchived={refreshList}
        />
      )}

      {movementModal && (
        <StockMovementModal
          open
          part={movementModal.part}
          type={movementModal.type}
          onClose={() => setMovementModal(null)}
          onSubmit={handleMovementSubmit}
        />
      )}
    </div>
  );
}
