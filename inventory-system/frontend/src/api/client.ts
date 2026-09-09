import axios, { AxiosError } from "axios";
import type { ApiErrorPayload } from "@/types";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export const api = axios.create({
  baseURL: API_BASE_URL,
  // Envia/recebe os cookies HttpOnly de sessao em toda requisicao.
  withCredentials: true,
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

// Se o access token expirou (401), tenta renovar via /auth/refresh uma unica
// vez e repete a requisicao original. Varias chamadas 401 simultaneas
// esperam a mesma renovacao em vez de disparar N refreshes em paralelo.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    const isAuthRoute = originalRequest?.url?.includes("/auth/");
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      await new Promise<void>((resolve) => pendingQueue.push(resolve));
      return api(originalRequest);
    }

    isRefreshing = true;
    try {
      await api.post("/auth/refresh");
      pendingQueue.forEach((resolve) => resolve());
      pendingQueue = [];
      return api(originalRequest);
    } catch (refreshError) {
      pendingQueue = [];
      window.location.assign("/login");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export function getApiErrorMessage(error: unknown, fallback = "Ocorreu um erro. Tente novamente."): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    if (payload?.error?.message) return payload.error.message;
  }
  return fallback;
}
// Cache simples em memoria para GETs, com validade curta. Reduz buscas
// repetidas quando o usuario navega rapido entre telas (ex.: sai da lista
// de pecas e volta), sem precisar de uma biblioteca externa. Chame
// invalidateCache(prefixo) depois de qualquer criacao/edicao para garantir
// que a proxima leitura venha atualizada.
const getCache = new Map<string, { expires: number; data: unknown }>();
const CACHE_TTL_MS = 20_000;

export async function cachedGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const key = url + JSON.stringify(params ?? {});
  const cached = getCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }
  const { data } = await api.get<T>(url, { params });
  getCache.set(key, { expires: Date.now() + CACHE_TTL_MS, data });
  return data as T;
}

export function invalidateCache(prefix: string) {
  for (const key of getCache.keys()) {
    if (key.startsWith(prefix)) getCache.delete(key);
  }
}
