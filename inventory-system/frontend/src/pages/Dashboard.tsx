import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { DashboardSummary } from "@/types";
import { getDashboardSummary } from "@/api/dashboard";
import { Spinner } from "@/components/common/Spinner";
import { Badge } from "@/components/common/Badge";
import { formatDateTime } from "@/utils/labels";
import { useAuth } from "@/context/AuthContext";

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "danger" | "success" }) {
  return (
    <div className="rounded border border-line bg-white p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 font-display text-4xl font-semibold ${tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const { totals, recentlyAdded, recentEntradas, recentRetiradas } = summary;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Bem Vindo, {user?.name.split(" ")[0]}!</h1>
          <p className="text-sm text-muted">Visão geral do inventário</p>
        </div>
        <Link
          to="/pecas"
          className="hidden rounded bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark sm:block"
        >
          Ver peças
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Peças cadastradas" value={totals.totalParts} />
        <StatCard label="Total em estoque" value={totals.totalQuantity} />
        <StatCard label="Com dano" value={totals.damaged} tone="danger" />
        <StatCard label="Sem dano" value={totals.undamaged} tone="success" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded border border-line bg-white p-4">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Peças adicionadas recentemente</h2>
          <ul className="divide-y divide-line">
            {recentlyAdded.map((p) => (
              <li key={p.id} className="py-2.5 text-sm">
                <p className="font-medium text-ink">{p.name}</p>
                <p className="font-mono text-xs text-muted">{p.sku}</p>
              </li>
            ))}
            {recentlyAdded.length === 0 && <p className="text-sm text-muted">Nenhuma peça cadastrada ainda.</p>}
          </ul>
        </section>

        <section className="rounded border border-line bg-white p-4">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Últimas entradas</h2>
          <ul className="divide-y divide-line">
            {recentEntradas.map((m) => (
              <li key={m.id} className="py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{m.part?.name}</p>
                  <Badge tone="success">+{m.quantity}</Badge>
                </div>
                <p className="text-xs text-muted">
                  {m.user.name} - {formatDateTime(m.createdAt)}
                </p>
              </li>
            ))}
            {recentEntradas.length === 0 && <p className="text-sm text-muted">Nenhuma entrada registrada ainda.</p>}
          </ul>
        </section>

        <section className="rounded border border-line bg-white p-4">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Últimas retiradas</h2>
          <ul className="divide-y divide-line">
            {recentRetiradas.map((m) => (
              <li key={m.id} className="py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{m.part?.name}</p>
                  <Badge tone="danger">-{m.quantity}</Badge>
                </div>
                <p className="text-xs text-muted">
                  {m.user.name} - {formatDateTime(m.createdAt)}
                </p>
              </li>
            ))}
            {recentRetiradas.length === 0 && <p className="text-sm text-muted">Nenhuma retirada registrada ainda.</p>}
          </ul>
        </section>
      </div>
    </div>
  );
}
