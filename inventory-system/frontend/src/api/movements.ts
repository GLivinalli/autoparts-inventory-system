import { api, invalidateCache } from "./client";
import type { Movement, MovementType, Paginated } from "@/types";

export async function createMovement(
  partId: string,
  type: MovementType,
  quantity: number,
  description?: string
) {
  const { data } = await api.post<{ movement: Movement }>(`/parts/${partId}/movements`, {
    type,
    quantity,
    description,
  });
  invalidateCache("/parts");
  invalidateCache("/dashboard");
  return data.movement;
}

export async function listMovementsForPart(partId: string, page = 1) {
  const { data } = await api.get<Paginated<Movement>>(`/parts/${partId}/movements`, {
    params: { page, pageSize: 10 },
  });
  return data;
}

export async function listMovements(page = 1) {
  const { data } = await api.get<Paginated<Movement>>("/movements", { params: { page, pageSize: 20 } });
  return data;
}
