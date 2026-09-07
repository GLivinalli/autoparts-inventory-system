import { FormEvent, useEffect, useState } from "react";
import type { Role, User, UserPermissions } from "@/types";
import * as usersApi from "@/api/users";
import { Spinner } from "@/components/common/Spinner";
import { Badge } from "@/components/common/Badge";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/api/client";
import { ROLE_LABELS } from "@/utils/labels";

const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  canCreateParts: "Cadastrar pecas",
  canEditParts: "Editar pecas",
  canArchiveParts: "Arquivar pecas",
  canStockIn: "Fazer entradas",
  canStockOut: "Fazer retiradas",
  canManageUsers: "Gerenciar usuarios",
};

function emptyPermissions(): UserPermissions {
  return {
    canCreateParts: false,
    canEditParts: false,
    canArchiveParts: false,
    canStockIn: false,
    canStockOut: false,
    canManageUsers: false,
  };
}

export function Users() {
  const { notify } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [permissions, setPermissions] = useState<UserPermissions>(emptyPermissions());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadUsers() {
    setLoading(true);
    usersApi
      .listUsers()
      .then((data) => setUsers(data.items))
      .finally(() => setLoading(false));
  }

  useEffect(loadUsers, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await usersApi.createUser({ name, email, password, role, permissions });
      notify("Usuario criado com sucesso", "success");
      setShowCreate(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("USER");
      setPermissions(emptyPermissions());
      loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel criar o usuario"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdatePermission(user: User, key: keyof UserPermissions, value: boolean) {
    const updated = await usersApi.updateUser(user.id, { permissions: { [key]: value } });
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setSelected(updated);
  }

  async function handleToggleActive(user: User) {
    try {
      const updated = await usersApi.updateUser(user.id, { active: !user.active });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      notify(updated.active ? "Usuario ativado" : "Usuario desativado", "success");
    } catch (err) {
      notify(getApiErrorMessage(err), "error");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Usuarios</h1>
          <p className="text-sm text-muted">Gerencie acessos e permissoes</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          Novo usuario
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded border border-line bg-white">
            <ul className="divide-y divide-line">
              {users.map((u) => (
                <li
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className={`cursor-pointer px-4 py-3 hover:bg-surface ${selected?.id === u.id ? "bg-surface" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={u.role === "ADMIN" ? "accent" : "neutral"}>{ROLE_LABELS[u.role]}</Badge>
                      {!u.active && <Badge tone="danger">Inativo</Badge>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded border border-line bg-white p-4">
            {!selected ? (
              <p className="text-sm text-muted">Selecione um usuario para ver e editar as permissoes.</p>
            ) : (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink">{selected.name}</h3>
                    <p className="text-sm text-muted">{selected.email}</p>
                  </div>
                  <button
                    onClick={() => handleToggleActive(selected)}
                    className="rounded border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface"
                  >
                    {selected.active ? "Desativar" : "Ativar"}
                  </button>
                </div>

                {selected.role === "ADMIN" ? (
                  <p className="text-sm text-muted">Administradores tem acesso total ao sistema.</p>
                ) : (
                  <div className="space-y-2">
                    {(Object.keys(PERMISSION_LABELS) as (keyof UserPermissions)[]).map((key) => (
                      <label key={key} className="flex items-center justify-between rounded border border-line px-3 py-2 text-sm">
                        {PERMISSION_LABELS[key]}
                        <input
                          type="checkbox"
                          checked={Boolean(selected.permission?.[key])}
                          onChange={(e) => handleUpdatePermission(selected, key, e.target.checked)}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4">
          <form onSubmit={handleCreate} className="w-full max-w-md rounded-t-md bg-white p-6 shadow-lg sm:rounded-md">
            <h2 className="mb-4 font-display text-2xl font-semibold text-ink">Novo usuario</h2>

            <label className="mb-1 block text-sm font-medium text-ink">Nome</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-3 h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
            />

            <label className="mb-1 block text-sm font-medium text-ink">E-mail</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3 h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
            />

            <label className="mb-1 block text-sm font-medium text-ink">Senha provisoria</label>
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-3 h-11 w-full rounded border border-line px-3 text-sm focus:border-accent"
            />

            <label className="mb-1 block text-sm font-medium text-ink">Perfil</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="mb-3 h-11 w-full rounded border border-line bg-white px-3 text-sm focus:border-accent"
            >
              <option value="USER">Usuario comum</option>
              <option value="ADMIN">Administrador</option>
            </select>

            {role === "USER" && (
              <div className="mb-3 space-y-2">
                {(Object.keys(PERMISSION_LABELS) as (keyof UserPermissions)[]).map((key) => (
                  <label key={key} className="flex items-center justify-between rounded border border-line px-3 py-2 text-sm">
                    {PERMISSION_LABELS[key]}
                    <input
                      type="checkbox"
                      checked={permissions[key]}
                      onChange={(e) => setPermissions((p) => ({ ...p, [key]: e.target.checked }))}
                    />
                  </label>
                ))}
              </div>
            )}

            {error && <p className="mb-3 text-sm text-danger">{error}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
              >
                {submitting ? "Salvando..." : "Criar usuario"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
