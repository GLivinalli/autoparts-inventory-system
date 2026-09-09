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
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import * as partsApi from "@/api/parts";
import * as manufacturersApi from "@/api/manufacturers";
import * as movementsApi from "@/api/movements";
import { getApiErrorMessage } from "@/api/client";
import type { MovementType } from "@/types";

const EMPTY_FILTERS: FilterValues = { manufacturerId: "", side: "", condition: "", stock: "" };

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
        side: (filters.side || undefined) as never,
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
        side: (filters.side || undefined) as never,
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
        side: values.side,
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
        side: values.side,
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
