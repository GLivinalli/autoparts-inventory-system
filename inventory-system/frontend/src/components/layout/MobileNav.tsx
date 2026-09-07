import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const itemBase = "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium";
const active = "text-accent";
const inactive = "text-white/60";

export function MobileNav() {
  const { isAdmin } = useAuth();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-ink lg:hidden">
      <NavLink to="/" end className={({ isActive }) => `${itemBase} ${isActive ? active : inactive}`}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
        Dashboard
      </NavLink>
      <NavLink to="/pecas" className={({ isActive }) => `${itemBase} ${isActive ? active : inactive}`}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 8h18l-1.5 12.5A2 2 0 0 1 17.5 22h-11a2 2 0 0 1-2-1.5L3 8Z" />
          <path d="M9 12h6" />
        </svg>
        Pecas
      </NavLink>
      <NavLink to="/historico" className={({ isActive }) => `${itemBase} ${isActive ? active : inactive}`}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
          <path d="M12 7v5l3 3" />
        </svg>
        Historico
      </NavLink>
      {isAdmin && (
        <NavLink to="/usuarios" className={({ isActive }) => `${itemBase} ${isActive ? active : inactive}`}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          Usuarios
        </NavLink>
      )}
    </nav>
  );
}
