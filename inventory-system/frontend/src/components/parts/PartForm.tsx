import { FormEvent, useEffect, useRef, useState } from "react";
import type { Manufacturer, Part, PartCondition, PartSide } from "@/types";
import { SIDE_LABELS } from "@/utils/labels";
import { PhotoUpload } from "./PhotoUpload";
import * as manufacturersApi from "@/api/manufacturers";
import { getApiErrorMessage } from "@/api/client";

export interface PartFormValues {
  name: string;
  sku: string;
  manufacturerId: string;
  side: PartSide | "";
  condition: PartCondition;
  damageNotes: string;
  initialQuantity: string;
  inventoryDate: string;
  photoUrl: string | null;
}

function toISODate(value: string) {
  return value ? new Date(value).toISOString() : "";
}

function emptyForm(): PartFormValues {
  return {
    name: "",
    sku: "",
    manufacturerId: "",
    side: "",
    condition: "SEM_DANO",
    damageNotes: "",
    initialQuantity: "0",
    inventoryDate: new Date().toISOString().slice(0, 10),
    photoUrl: null,
  };
}

interface PartFormProps {
  open: boolean;
  editingPart: Part | null;
  manufacturers: Manufacturer[];
  onManufacturersChange: () => void;
  onClose: () => void;
  onSubmit: (values: PartFormValues) => Promise<void>;
}

export function PartForm({
  open,
  editingPart,
  manufacturers,
  onManufacturersChange,
  onClose,
  onSubmit,
}: PartFormProps) {
  const [values, setValues] = useState<PartFormValues>(emptyForm());
  const [newManufacturer, setNewManufacturer] = useState("");
  const [addingManufacturer, setAddingManufacturer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialSnapshotRef = useRef("");

  useEffect(() => {
    if (!open) return;
    const initial: PartFormValues = editingPart
      ? {
          name: editingPart.name,
          sku: editingPart.sku,
          manufacturerId: editingPart.manufacturerId,
          side: editingPart.side,
          condition: editingPart.condition,
          damageNotes: editingPart.damageNotes ?? "",
          initialQuantity: "0",
          inventoryDate: editingPart.inventoryDate.slice(0, 10),
          photoUrl: editingPart.photoUrl,
        }
      : emptyForm();
    setValues(initial);
    initialSnapshotRef.current = JSON.stringify(initial);
    setError(null);
  }, [open, editingPart]);

  if (!open) return null;

  function handleRequestClose() {
    const isDirty = JSON.stringify(values) !== initialSnapshotRef.current;
    if (isDirty && !window.confirm("Voce tem alteracoes nao salvas. Deseja realmente fechar sem salvar?")) {
      return;
    }
    onClose();
  }

  async function handleAddManufacturer() {
    if (!newManufacturer.trim()) return;
    setAddingManufacturer(true);
    try {
      const created = await manufacturersApi.createManufacturer(newManufacturer.trim());
      onManufacturersChange();
      setValues((v) => ({ ...v, manufacturerId: created.id }));
      setNewManufacturer("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel cadastrar a montadora"));
    } finally {
      setAddingManufacturer(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!values.manufacturerId) return setError("Selecione a montadora");
    if (!values.side) return setError("Selecione o lado/parte");
    if (values.condition === "COM_DANO" && !values.damageNotes.trim()) {
      return setError("Descreva o dano da peca");
    }

    setSubmitting(true);
    try {
      await onSubmit({ ...values, inventoryDate: toISODate(values.inventoryDate) });
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel salvar a peca"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/40 sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-md bg-white p-5 shadow-lg sm:rounded-md sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">
            {editingPart ? "Editar peca" : "Cadastrar peca"}
          </h2>
          <button type="button" onClick={handleRequestClose} className="rounded p-1 text-muted hover:bg-surface" aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <PhotoUpload value={values.photoUrl} onChange={(url) => setValues((v) => ({ ...v, photoUrl: url }))} />

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Nome da peca</label>
            <input
              required
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder="Ex.: Farol dianteiro"
              className="h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
            />
          </div>

          {editingPart && (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">SKU</label>
              <input
                disabled
                value={values.sku}
                className="h-11 w-full rounded border border-line bg-surface px-3 font-mono text-sm text-muted"
              />
            </div>
          )}

          {!editingPart && (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                SKU <span className="font-normal text-muted">(opcional - gerado automaticamente se vazio)</span>
              </label>
              <input
                value={values.sku}
                onChange={(e) => setValues((v) => ({ ...v, sku: e.target.value.toUpperCase() }))}
                placeholder="AUT-000001"
                className="h-11 w-full rounded border border-line px-3 font-mono text-sm focus:border-accent"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Montadora</label>
            <select
              required
              value={values.manufacturerId}
              onChange={(e) => setValues((v) => ({ ...v, manufacturerId: e.target.value }))}
              className="h-11 w-full rounded border border-line bg-white px-3 text-sm focus:border-accent"
            >
              <option value="">Selecione</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <div className="mt-2 flex gap-2">
              <input
                value={newManufacturer}
                onChange={(e) => setNewManufacturer(e.target.value)}
                placeholder="Cadastrar nova montadora"
                className="h-9 flex-1 rounded border border-line px-3 text-sm focus:border-accent"
              />
              <button
                type="button"
                disabled={addingManufacturer}
                onClick={handleAddManufacturer}
                className="rounded border border-line px-3 text-sm font-medium text-steel hover:bg-steel-soft disabled:opacity-60"
              >
                Adicionar
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Lado/parte</label>
            <select
              required
              value={values.side}
              onChange={(e) => setValues((v) => ({ ...v, side: e.target.value as PartSide }))}
              className="h-11 w-full rounded border border-line bg-white px-3 text-sm focus:border-accent"
            >
              <option value="">Selecione</option>
              {Object.entries(SIDE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-ink">Estado da peca</span>
            <div className="flex gap-4">
              {(["SEM_DANO", "COM_DANO"] as PartCondition[]).map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="radio"
                    checked={values.condition === c}
                    onChange={() => setValues((v) => ({ ...v, condition: c }))}
                  />
                  {c === "SEM_DANO" ? "Sem dano" : "Com dano"}
                </label>
              ))}
            </div>
            {values.condition === "COM_DANO" && (
              <textarea
                required
                value={values.damageNotes}
                onChange={(e) => setValues((v) => ({ ...v, damageNotes: e.target.value }))}
                placeholder="Descreva o dano. Ex.: Risco na lateral direita."
                rows={2}
                className="mt-2 w-full rounded border border-line px-3 py-2 text-sm focus:border-accent"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!editingPart && (
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Estoque inicial</label>
                <input
                  type="number"
                  min={0}
                  value={values.initialQuantity}
                  onChange={(e) => setValues((v) => ({ ...v, initialQuantity: e.target.value }))}
                  className="h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
                />
              </div>
            )}
            <div className={editingPart ? "col-span-2" : ""}>
              <label className="mb-1 block text-sm font-medium text-ink">Data do inventario</label>
              <input
                type="date"
                required
                value={values.inventoryDate}
                onChange={(e) => setValues((v) => ({ ...v, inventoryDate: e.target.value }))}
                className="h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
              />
            </div>
          </div>

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
