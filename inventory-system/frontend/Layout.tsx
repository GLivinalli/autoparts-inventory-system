import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

// Barra superior so no celular: o menu lateral fica escondido nessa largura,
// entao e aqui que ficam "Trocar senha" e "Sair".
function MobileTopBar() {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-2.5 lg:hidden">
      <div className="min-w-0">
        <p className="font-display text-xl font-semibold leading-none text-white">AutoParts</p>
        <p className="mt-0.5 truncate text-[11px] text-white/50">{user?.name}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Link to="/trocar-senha" className="rounded px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/5 hover:text-white">
          Trocar senha
        </Link>
        <button
          type="button"
          onClick={logout}
          className="rounded px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/5 hover:text-white"
        >
          Sair
        </button>
      </div>
    </header>
  );
}

export function Layout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
