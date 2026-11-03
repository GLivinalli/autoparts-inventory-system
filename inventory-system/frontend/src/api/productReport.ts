import { api } from "./client";
import type { Paginated, ProductMovement } from "@/types";

// Traz as movimentacoes (entradas e retiradas) de todos os produtos, da mais
// nova para a mais antiga. O relatorio faz todos os filtros na propria tela.
export async function listAllProductMovements() {
  const { data } = await api.get<Paginated<ProductMovement>>("/products/movements", {
    params: { page: 1, pageSize: 1000 },
  });
  return data;
}

export interface EditMovementPayload {
  date?: string;
  quantity?: number;
  funcionario?: string;
}

// Somente administrador. Manda so os campos que mudaram.
export async function editMovement(movementId: string, payload: EditMovementPayload) {
  await api.patch(`/products/movements/${movementId}/edit`, payload);
}
