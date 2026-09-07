import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const NAV_ICON_CLASS = "shrink-0";

function IconDashboard() {
  return (
    <svg className={NAV_ICON_CLASS} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}
function IconParts() {
  return (
    <svg className={NAV_ICON_CLASS} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8V6a2 2 0 0 0-2-2h-2.5L14 2h-4L8.5 4H6a2 2 0 0 0-2 2v2" />
      <path d="M3 8h18l-1.5 12.5A2 2 0 0 1 17.5 22h-11a2 2 0 0 1-2-1.5L3 8Z" />
      <path d="M9 12h6" />
    </svg>
  );
}
function IconHistory() {
  return (
    <svg className={NAV_ICON_CLASS} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg className={NAV_ICON_CLASS} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const linkBase =
  "flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors";
const linkInactive = "text-white/70 hover:bg-white/5 hover:text-white";
const linkActive = "bg-white/10 text-white";

export function Sidebar() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-ink px-3 py-5 lg:flex">
      <div className="mb-8 px-2">
        <p className="font-display text-2xl font-semibold leading-none text-white">AutoParts</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-white/50">Controle de inventario</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
          <IconDashboard /> Dashboard
        </NavLink>
        <NavLink to="/pecas" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
          <IconParts /> Pecas
        </NavLink>
        <NavLink to="/historico" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
          <IconHistory /> Historico
        </NavLink>
        {isAdmin && (
          <NavLink to="/usuarios" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <IconUsers /> Usuarios
          </NavLink>
        )}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="truncate px-2 text-sm font-medium text-white">{user?.name}</p>
        <p className="truncate px-2 text-xs text-white/50">{user?.email}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-3 w-full rounded px-2 py-2 text-left text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
