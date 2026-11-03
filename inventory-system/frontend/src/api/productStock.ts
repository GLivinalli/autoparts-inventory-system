import { api } from "./client";

export interface StockSummary {
  totalValueCents: number;
  totalUnits: number;
  productCount: number;
}

export async function getStockSummary(archived = false) {
  const { data } = await api.get<StockSummary>("/products/stock-summary", {
    params: archived ? { archived: true } : {},
  });
  return data;
}
