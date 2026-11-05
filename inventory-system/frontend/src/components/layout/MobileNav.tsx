import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { IconDashboard, IconParts, IconHistory, IconUsers, IconBox } from "./icons";

// Todos os itens tem a mesma altura, o mesmo tamanho de icone e o texto em uma
// unica linha, para os icones ficarem alinhados na mesma linha horizontal.
const itemBase =
  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 border-t-2 px-1 py-2 text-[11px] font-medium leading-none transition-colors";
const active = "border-accent text-accent";
const inactive = "border-transparent text-white/60";

function Item({ to, end, label, icon }: { to: string; end?: boolean; label: string; icon: JSX.Element }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `${itemBase} ${isActive ? active : inactive}`}>
      <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
      <span className="w-full truncate text-center">{label}</span>
    </NavLink>
  );
}

export function MobileNav() {
  const { isAdmin } = useAuth();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-white/10 bg-ink pb-[env(safe-area-inset-bottom)] lg:hidden">
      <Item to="/" end label="Dashboard" icon={<IconDashboard size={22} />} />
      <Item to="/pecas" label="Peças" icon={<IconParts size={22} />} />
      <Item to="/produtos" label="Produtos" icon={<IconBox size={22} />} />
      <Item to="/historico" label="Histórico" icon={<IconHistory size={22} />} />
      {isAdmin && <Item to="/usuarios" label="Usuários" icon={<IconUsers size={22} />} />}
    </nav>
  );
}
