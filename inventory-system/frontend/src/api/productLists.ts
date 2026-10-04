import { api } from "./client";

export interface ListItem {
  id: string;
  name: string;
  createdAt: string;
}

export async function listSectors() {
  const { data } = await api.get<{ items: ListItem[] }>("/product-lists/sectors");
  return data.items;
}

export async function createSector(name: string) {
  const { data } = await api.post<{ item: ListItem }>("/product-lists/sectors", { name });
  return data.item;
}

export async function deleteSector(id: string) {
  await api.delete(`/product-lists/sectors/${id}`);
}

export async function listEmployees() {
  const { data } = await api.get<{ items: ListItem[] }>("/product-lists/employees");
  return data.items;
}

export async function createEmployee(name: string) {
  const { data } = await api.post<{ item: ListItem }>("/product-lists/employees", { name });
  return data.item;
}

export async function deleteEmployee(id: string) {
  await api.delete(`/product-lists/employees/${id}`);
}
