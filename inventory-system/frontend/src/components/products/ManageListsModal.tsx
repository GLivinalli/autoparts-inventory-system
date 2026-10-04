import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getApiErrorMessage } from "@/api/client";
import * as listsApi from "@/api/productLists";
import type { ListItem } from "@/api/productLists";

type Kind = "sector" | "employee";

interface ManageListsModalProps {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

// Somente o ADMINISTRADOR chega aqui (o botao so aparece para ele, e o
// backend tambem recusa quem nao for admin).
export function ManageListsModal({ open, onClose, onChanged }: ManageListsModalProps) {
  const [sectors, setSectors] = useState<ListItem[]>([]);
  const [employees, setEmployees] = useState<ListItem[]>([]);
  const [newSector, setNewSector] = useState("");
  const [newEmployee, setNewEmployee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<{ kind: Kind; item: ListItem } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [s, e] = await Promise.all([listsApi.listSectors(), listsApi.listEmployees()]);
      setSectors(s);
      setEmployees(e);
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel carregar as listas"));
    }
  }

  useEffect(() => {
    if (!open) return;
    setError(null);
    load();
  }, [open]);

  if (!open) return null;

  async function handleAdd(kind: Kind) {
    const name = (kind === "sector" ? newSector : newEmployee).trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      if (kind === "sector") {
        await listsApi.createSector(name);
        setNewSector("");
      } else {
        await listsApi.createEmployee(name);
        setNewEmployee("");
      }
      await load();
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel adicionar"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!removing) return;
    setBusy(true);
    setError(null);
    try {
      if (removing.kind === "sector") {
        await listsApi.deleteSector(removing.item.id);
      } else {
        await listsApi.deleteEmployee(removing.item.id);
      }
      setRemoving(null);
      await load();
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel remover"));
      setRemoving(null);
    } finally {
      setBusy(false);
    }
  }

  function renderSection(
    kind: Kind,
    title: string,
    items: ListItem[],
    value: string,
    setValue: (v: string) => void,
    placeholder: string
  ) {
    return (
      <div>
        <h3 className="mb-2 font-display text-lg font-semibold text-ink">{title}</h3>
        <div className="mb-2 flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd(kind);
              }
            }}
            placeholder={placeholder}
            className="h-9 flex-1 rounded border border-line px-3 text-sm uppercase focus:border-accent"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => handleAdd(kind)}
            className="rounded border border-line px-3 text-sm font-medium text-steel hover:bg-steel-soft disabled:opacity-60"
          >
            Adicionar
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-muted">Nenhum item na lista ainda.</p>
        ) : (
          <ul className="max-h-40 divide-y divide-line overflow-y-auto rounded border border-line">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-3 py-1.5 text-sm text-ink">
                {item.name}
                <button
                  type="button"
                  onClick={() => setRemoving({ kind, item })}
                  className="rounded px-2 py-0.5 text-xs font-medium text-danger hover:bg-danger-soft"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/40 sm:items-center sm:p-4">
        <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-md bg-white p-5 shadow-lg sm:rounded-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">Setores e funcionarios</h2>
            <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:bg-surface" aria-label="Fechar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {renderSection("sector", "Setores", sectors, newSector, setNewSector, "Novo setor")}
            {renderSection("employee", "Funcionarios", employees, newEmployee, setNewEmployee, "Novo funcionario")}
          </div>

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={onClose} className="rounded px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface">
              Fechar
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!removing}
        title="Remover da lista"
        tone="danger"
        loading={busy}
        description={
          removing && (
            <>
              Remover <strong>{removing.item.name}</strong> da lista? As retiradas ja registradas continuam com esse
              nome no historico.
            </>
          )
        }
        confirmLabel="Remover"
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}
