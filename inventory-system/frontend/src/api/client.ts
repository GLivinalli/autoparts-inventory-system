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
