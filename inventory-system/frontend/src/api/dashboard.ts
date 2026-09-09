import { cachedGet } from "./client";
import type { DashboardSummary } from "@/types";

export async function getDashboardSummary() {
  return cachedGet<DashboardSummary>("/dashboard/summary");
}
