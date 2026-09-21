import { api } from "./client";
import type {
  ConsumptionReportRow,
  MonthlyBalanceRow,
  MovementType,
  Paginated,
  Product,
  ProductBatch,
  ProductMovement,
  ProductOutputByMonth,
} from "@/types";

export interface ProductsFilters {
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function listProducts(filters: ProductsFilters) {
  const { data } = await api.get<Paginated<Product>>("/products", { params: filters });
  return data;
}

export async function getProduct(id: string, historyPage = 1) {
  const { data } = await api.get<{
    product: Product;
    daysInStock: number | null;
    batches: ProductBatch[];
    history: Paginated<ProductMovement>;
  }>(`/products/${id}`, { params: { page: historyPage, pageSize: 10 } });
  return data;
}

export interface CreateProductPayload {
  name: string;
  manufacturer: string;
  initialQuantity: number;
  totalValueReais?: number;
}

export async function createProduct(payload: CreateProductPayload) {
  const { data } = await api.post<{ product: Product }>("/products", payload);
  return data.product;
}

export async function updateProduct(id: string, payload: { name?: string; manufacturer?: string }) {
  const { data } = await api.patch<{ product: Product }>(`/products/${id}`, payload);
  return data.product;
}

export async function createEntrada(
  productId: string,
  quantity: number,
  totalValueReais: number,
  description?: string
) {
  const { data } = await api.post<{ movement: ProductMovement }>(`/products/${productId}/entrada`, {
    quantity,
    totalValueReais,
    description,
  });
  return data.movement;
}

export async function createSaida(
  productId: string,
  quantity: number,
  setor: string,
  funcionario: string,
  description?: string
) {
  const { data } = await api.post<{ movement: ProductMovement }>(`/products/${productId}/saida`, {
    quantity,
    setor,
    funcionario,
    description,
  });
  return data.movement;
}

export async function deleteMovement(movementId: string) {
  await api.delete(`/products/movements/${movementId}`);
}

export async function listMovements(params: {
  page?: number;
  productId?: string;
  type?: MovementType;
  setor?: string;
  funcionario?: string;
}) {
  const { data } = await api.get<Paginated<ProductMovement>>("/products/movements", { params });
  return data;
}

export async function getConsumptionReport(params: { month?: string; setor?: string; funcionario?: string }) {
  const { data } = await api.get<{ items: ConsumptionReportRow[] }>("/products/reports/consumption", { params });
  return data.items;
}

export async function getMonthlyBalance() {
  const { data } = await api.get<{ items: MonthlyBalanceRow[] }>("/products/reports/monthly-balance");
  return data.items;
}

export async function getOutputByMonth() {
  const { data } = await api.get<{ items: ProductOutputByMonth[] }>("/products/reports/output-by-month");
  return data.items;
}
