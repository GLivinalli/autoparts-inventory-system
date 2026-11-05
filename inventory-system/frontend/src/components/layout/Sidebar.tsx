import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import { IconDashboard, IconParts, IconHistory, IconUsers, IconBox } from "./icons";

const linkBase =
  "flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors";
const linkInactive = "text-white/70 hover:bg-white/5 hover:text-white";
const linkActive = "bg-white/10 text-white";

export function Sidebar() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-ink px-3 py-5 lg:flex">
      <div className="mb-8 px-2 text-center">
        <img src="/logo-autogama.png" alt="Auto Gama Service" className="mx-auto mb-3 h-28 w-auto" />
        <p className="text-xs uppercase tracking-wide text-white/50">Controle de inventário</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
          <IconDashboard /> Dashboard
        </NavLink>
        <NavLink to="/pecas" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
          <IconParts /> Peças
        </NavLink>
        <NavLink to="/historico" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
          <IconHistory /> Histórico
        </NavLink>
        <div className="my-2 border-t border-white/10" />
        <NavLink to="/produtos" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
          <IconBox /> Produtos
        </NavLink>
        {isAdmin && (
          <>
            <div className="my-2 border-t border-white/10" />
            <NavLink to="/usuarios" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <IconUsers /> Usuários
            </NavLink>
          </>
        )}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="truncate px-2 text-sm font-medium text-white">{user?.name}</p>
        <p className="truncate px-2 text-xs text-white/50">{user?.email}</p>
        <Link
          to="/trocar-senha"
          className="mt-3 block rounded px-2 py-2 text-left text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
        >
          Trocar senha
        </Link>
        <button
          type="button"
          onClick={logout}
          className="w-full rounded px-2 py-2 text-left text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
