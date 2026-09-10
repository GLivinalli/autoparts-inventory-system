import { useEffect, useState } from "react";
import type { Movement } from "@/types";
import * as movementsApi from "@/api/movements";
import { Spinner } from "@/components/common/Spinner";
import { Badge } from "@/components/common/Badge";
import { Pagination } from "@/components/common/Pagination";
import { formatDateTime } from "@/utils/labels";

export function History() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    movementsApi
      .listMovements(page)
      .then((data) => {
        setMovements(data.items);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Histórico de movimentação</h1>
      <p className="mb-5 text-sm text-muted">Registro completo e definitivo de todas as entradas e retiradas</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="rounded border border-line bg-white">
          <ul className="divide-y divide-line">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge tone={m.type === "ENTRADA" ? "success" : "danger"}>{m.type}</Badge>
                    <span className="truncate font-medium text-ink">{m.part?.name}</span>
                    <span className="hidden font-mono text-xs text-muted sm:inline">{m.part?.sku}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {m.user.name} - {formatDateTime(m.createdAt)}
                    {m.description ? ` - ${m.description}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`font-display text-xl font-semibold ${m.type === "ENTRADA" ? "text-success" : "text-danger"}`}>
                    {m.type === "ENTRADA" ? "+" : "-"}
                    {m.quantity}
                  </p>
                  <p className="text-xs text-muted">
                    {m.quantityBefore} &rarr; {m.quantityAfter}
                  </p>
                </div>
              </li>
            ))}
            {movements.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">Nenhuma movimentacao registrada.</p>}
          </ul>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
