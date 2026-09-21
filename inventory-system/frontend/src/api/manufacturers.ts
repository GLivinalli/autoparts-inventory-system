import { api, invalidateCache } from "./client";
import type { Manufacturer } from "@/types";

// Cache proprio, mais longo que o padrao (5 min) - lista de montadoras
// raramente muda, entao nao faz sentido rebuscar toda vez que o formulario
// de cadastro de peca e aberto.
let manufacturersCache: { expires: number; data: Manufacturer[] } | null = null;
const MANUFACTURERS_CACHE_TTL_MS = 5 * 60_000;

export async function listManufacturers() {
  if (manufacturersCache && manufacturersCache.expires > Date.now()) {
    return manufacturersCache.data;
  }
  const { data } = await api.get<{ manufacturers: Manufacturer[] }>("/manufacturers");
  manufacturersCache = { expires: Date.now() + MANUFACTURERS_CACHE_TTL_MS, data: data.manufacturers };
  return data.manufacturers;
}

export async function createManufacturer(name: string) {
  const { data } = await api.post<{ manufacturer: Manufacturer }>("/manufacturers", { name });
  manufacturersCache = null;
  invalidateCache("/parts");
  return data.manufacturer;
}
