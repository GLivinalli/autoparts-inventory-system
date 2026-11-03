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
