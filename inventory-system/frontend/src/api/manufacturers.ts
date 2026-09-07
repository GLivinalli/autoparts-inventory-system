import { api } from "./client";
import type { Manufacturer } from "@/types";

export async function listManufacturers() {
  const { data } = await api.get<{ manufacturers: Manufacturer[] }>("/manufacturers");
  return data.manufacturers;
}

export async function createManufacturer(name: string) {
  const { data } = await api.post<{ manufacturer: Manufacturer }>("/manufacturers", { name });
  return data.manufacturer;
}
