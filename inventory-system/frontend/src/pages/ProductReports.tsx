import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ConsumptionReportRow, MonthlyBalanceRow } from "@/types";
import { Spinner } from "@/components/common/Spinner";
import * as productsApi from "@/api/products";
import { formatCentsToBRL } from "@/utils/labels";

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  const names = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return `${names[Number(m) - 1]}/${year}`;
}

export function ProductReports() {
  const [consumption, setConsumption] = useState<ConsumptionReportRow[]>([]);
  const [balance, setBalance] = useState<MonthlyBalanceRow[]>([]);
  const [loadingConsumption, setLoadingConsumption] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [monthFilter, setMonthFilter] = useState("");
  const [setorFilter, setSetorFilter] = useState("");
  const [funcionarioFilter, setFuncionarioFilter] = useState("");

  useEffect(() => {
    productsApi.getMonthlyBalance().then(setBalance).finally(() => setLoadingBalance(false));
  }, []);

  useEffect(() => {
    setLoadingConsumption(true);
    productsApi
      .getConsumptionReport({
        month: monthFilter || undefined,
        setor: setorFilter || undefined,
        funcionario: funcionarioFilter || undefined,
      })
      .then(setConsumption)
      .finally(() => setLoadingConsumption(false));
  }, [monthFilter, setorFilter, funcionarioFilter]);

  return (
    <div>
      <div className="mb-4">
        <Link to="/produtos" className="text-sm font-medium text-steel hover:underline">
          &larr; Voltar para Produtos
        </Link>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Relatorios</h1>
        <p className="text-sm text-muted">Balanco mensal e consumo por setor/funcionario</p>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-xl font-semibold text-ink">Balanco mensal</h2>
        {loadingBalance ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : balance.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma movimentacao registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-line bg-white">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="border-b border-line px-3 py-2.5 font-medium">Mes</th>
                  <th className="border-b border-line px-3 py-2.5 text-right font-medium">Entradas</th>
                  <th className="border-b border-line px-3 py-2.5 text-right font-medium">Saidas</th>
                  <th className="border-b border-line px-3 py-2.5 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {balance.map((row) => (
                  <tr key={row.month}>
                    <td className="border-b border-line px-3 py-2.5 font-medium text-ink">{formatMonth(row.month)}</td>
                    <td className="border-b border-line px-3 py-2.5 text-right text-success">
                      {formatCentsToBRL(row.entradasCents)}
                    </td>
                    <td className="border-b border-line px-3 py-2.5 text-right text-danger">
                      {formatCentsToBRL(row.saidasCents)}
                    </td>
                    <td className="border-b border-line px-3 py-2.5 text-right font-semibold text-ink">
                      {formatCentsToBRL(row.saldoCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-display text-xl font-semibold text-ink">Consumo por setor/funcionario</h2>

        <div className="mb-3 flex flex-wrap gap-2">
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="h-10 rounded border border-line bg-white px-3 text-sm focus:border-accent"
          />
          <input
            value={setorFilter}
            onChange={(e) => setSetorFilter(e.target.value)}
            placeholder="Filtrar por setor"
            className="h-10 rounded border border-line bg-white px-3 text-sm focus:border-accent"
          />
          <input
            value={funcionarioFilter}
            onChange={(e) => setFuncionarioFilter(e.target.value)}
            placeholder="Filtrar por funcionario"
            className="h-10 rounded border border-line bg-white px-3 text-sm focus:border-accent"
          />
        </div>

        {loadingConsumption ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : consumption.length === 0 ? (
          <p className="text-sm text-muted">Nenhum consumo encontrado com esses filtros.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-line bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="border-b border-line px-3 py-2.5 font-medium">Mes</th>
                  <th className="border-b border-line px-3 py-2.5 font-medium">Setor</th>
                  <th className="border-b border-line px-3 py-2.5 font-medium">Funcionario</th>
                  <th className="border-b border-line px-3 py-2.5 font-medium">Produto</th>
                  <th className="border-b border-line px-3 py-2.5 text-right font-medium">Qtd.</th>
                  <th className="border-b border-line px-3 py-2.5 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {consumption.map((row) => (
                  <tr key={`${row.month}-${row.setor}-${row.funcionario}-${row.productId}`}>
                    <td className="border-b border-line px-3 py-2.5 text-ink-soft">{formatMonth(row.month)}</td>
                    <td className="border-b border-line px-3 py-2.5 text-ink-soft">{row.setor}</td>
                    <td className="border-b border-line px-3 py-2.5 text-ink-soft">{row.funcionario}</td>
                    <td className="border-b border-line px-3 py-2.5 font-medium text-ink">{row.productName}</td>
                    <td className="border-b border-line px-3 py-2.5 text-right text-ink">{row.quantity}</td>
                    <td className="border-b border-line px-3 py-2.5 text-right text-ink">
                      {formatCentsToBRL(row.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
