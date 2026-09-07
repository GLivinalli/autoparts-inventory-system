import { api } from "./client";
import type { Paginated, Role, User, UserPermissions } from "@/types";

export async function listUsers(search = "", page = 1) {
  const { data } = await api.get<Paginated<User>>("/users", { params: { search, page, pageSize: 20 } });
  return data;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  permissions?: Partial<UserPermissions>;
}

export async function createUser(payload: CreateUserPayload) {
  const { data } = await api.post<{ user: User }>("/users", payload);
  return data.user;
}

export interface UpdateUserPayload {
  name?: string;
  role?: Role;
  active?: boolean;
  permissions?: Partial<UserPermissions>;
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const { data } = await api.patch<{ user: User }>(`/users/${id}`, payload);
  return data.user;
}
