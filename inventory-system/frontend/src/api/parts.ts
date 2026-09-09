import { api, cachedGet, invalidateCache } from "./client";
import type { Movement, Paginated, Part } from "@/types";

export interface PartsFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  manufacturerId?: string;
  side?: string;
  condition?: string;
  stock?: "available" | "out";
  includeArchived?: boolean;
}

export async function listParts(filters: PartsFilters) {
  return cachedGet<Paginated<Part>>("/parts", filters as Record<string, unknown>);
}

export async function getPart(id: string, historyPage = 1) {
  const { data } = await api.get<{ part: Part; history: Paginated<Movement> }>(`/parts/${id}`, {
    params: { page: historyPage, pageSize: 10 },
  });
  return data;
}

export interface CreatePartPayload {
  name: string;
  sku?: string;
  manufacturerId: string;
  side: string;
  condition: string;
  damageNotes?: string;
  damagePhotoUrl?: string | null;
  initialQuantity: number;
  inventoryDate: string;
  photoUrl?: string | null;
}

export async function createPart(payload: CreatePartPayload) {
  const { data } = await api.post<{ part: Part }>("/parts", payload);
  invalidateCache("/parts");
  invalidateCache("/dashboard");
  return data.part;
}

export async function updatePart(id: string, payload: Partial<CreatePartPayload>) {
  const { data } = await api.patch<{ part: Part }>(`/parts/${id}`, payload);
  invalidateCache("/parts");
  invalidateCache("/dashboard");
  return data.part;
}

export async function archivePart(id: string) {
  const { data } = await api.post<{ part: Part }>(`/parts/${id}/archive`);
  invalidateCache("/parts");
  invalidateCache("/dashboard");
  return data.part;
}

export async function unarchivePart(id: string) {
  const { data } = await api.post<{ part: Part }>(`/parts/${id}/unarchive`);
  invalidateCache("/parts");
  invalidateCache("/dashboard");
  return data.part;
}

export async function uploadPartPhoto(file: File) {
  const form = new FormData();
  form.append("photo", file);
  const { data } = await api.post<{ url: string }>("/uploads/part-photo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
}
