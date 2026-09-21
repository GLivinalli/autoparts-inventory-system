import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import type { ConsumptionReportRow, MonthlyBalanceRow, ProductOutputByMonth } from "@/types";
import { Spinner } from "@/components/common/Spinner";
import * as productsApi from "@/api/products";
import { formatCentsToBRL } from "@/utils/labels";

const actionButtonClass =
  "rounded border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface";
const activeTabClass = "rounded bg-ink px-4 py-2.5 text-sm font-medium text-white";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  return `${MONTH_NAMES[Number(m) - 1]}/${year}`;
}

type PeriodType = "all" | "month" | "year";

export function ProductReports() {
  const [consumption, setConsumption] = useState<ConsumptionReportRow[]>([]);
  const [balance, setBalance] = useState<MonthlyBalanceRow[]>([]);
  const [output, setOutput] = useState<ProductOutputByMonth[]>([]);
  const [loadingConsumption, setLoadingConsumption] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingOutput, setLoadingOutput] = useState(true);
  const [setorFilter, setSetorFilter] = useState("");
  const [funcionarioFilter, setFuncionarioFilter] = useState("");

  const [periodType, setPeriodType] = useState<PeriodType>("all");
  const [periodMonth, setPeriodMonth] = useState(new Date().toISOString().slice(0, 7));
  const [periodYear, setPeriodYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    productsApi.getMonthlyBalance().then(setBalance).finally(() => setLoadingBalance(false));
    productsApi.getOutputByMonth().then(setOutput).finally(() => setLoadingOutput(false));
  }, []);

  useEffect(() => {
    setLoadingConsumption(true);
    productsApi
      .getConsumptionReport({ setor: setorFilter || undefined, funcionario: funcionarioFilter || undefined })
      .then(setConsumption)
      .finally(() => setLoadingConsumption(false));
  }, [setorFilter, funcionarioFilter]);

  function monthInPeriod(month: string) {
    if (periodType === "month") return month === periodMonth;
    if (periodType === "year") return month.startsWith(periodYear);
    return true;
  }

  const periodLabel =
    periodType === "month" ? formatMonth(periodMonth) : periodType === "year" ? periodYear : "Todo o periodo";

  const filteredBalance = useMemo(() => balance.filter((r) => monthInPeriod(r.month)), [balance, periodType, periodMonth, periodYear]);

  const valuesTotals = useMemo(() => {
    const totalCompra = filteredBalance.reduce((sum, r) => sum + r.entradasCents, 0);
    const totalGasto = filteredBalance.reduce((sum, r) => sum + r.saidasCents, 0);
    return { totalCompra, totalGasto };
  }, [filteredBalance]);

  const itemsSummary = useMemo(() => {
    return output
      .map((product) => {
        const monthsInPeriod = product.months.filter((m) => monthInPeriod(m.month));
        if (monthsInPeriod.length === 0) return null;
        const totalQuantity = monthsInPeriod.reduce((sum, m) => sum + m.quantity, 0);
        const totalCents = monthsInPeriod.reduce((sum, m) => sum + m.totalCents, 0);
        const averageQuantity = totalQuantity / monthsInPeriod.length;
        return {
          productId: product.productId,
          productName: product.productName,
          averageQuantity,
          totalCents,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }, [output, periodType, periodMonth, periodYear]);

  const filteredConsumption = useMemo(
    () => consumption.filter((r) => monthInPeriod(r.month)),
    [consumption, periodType, periodMonth, periodYear]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <NavLink to="/produtos" end className={({ isActive }) => (isActive ? activeTabClass : actionButtonClass)}>
          Estoque
        </NavLink>
        <NavLink to="/produtos/relatorios" className={({ isActive }) => (isActive ? activeTabClass : actionButtonClass)}>
          Relatorios
        </NavLink>
      </div>

      <h1 className="font-display text-3xl font-semibold text-ink">Relatorios</h1>
      <p className="mb-4 text-sm text-muted">Valores, resumo de itens e consumo por setor/funcionario</p>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded border border-line bg-white p-3">
        <span className="text-sm font-medium text-ink">Periodo:</span>
        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value as PeriodType)}
          className="h-10 rounded border border-line bg-white px-3 text-sm focus:border-accent"
        >
          <option value="all">Todo o periodo</option>
          <option value="month">Um mes especifico</option>
          <option value="year">Um ano especifico</option>
        </select>
        {periodType === "month" && (
          <input
            type="month"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="h-10 rounded border border-line bg-white px-3 text-sm focus:border-accent"
          />
        )}
        {periodType === "year" && (
          <input
            type="number"
            value={periodYear}
            onChange={(e) => setPeriodYear(e.target.value)}
            className="h-10 w-28 rounded border border-line bg-white px-3 text-sm focus:border-accent"
          />
        )}
      </div>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-xl font-semibold text-ink">Valores</h2>

        {loadingBalance ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded border border-line bg-white p-4">
              <p className="text-xs text-muted">Valor total de compra</p>
              <p className="mt-1 font-display text-2xl font-semibold text-success">
                {formatCentsToBRL(valuesTotals.totalCompra)}
              </p>
            </div>
            <div className="rounded border border-line bg-white p-4">
              <p className="text-xs text-muted">Valor total de gasto</p>
              <p className="mt-1 font-display text-2xl font-semibold text-danger">
                {formatCentsToBRL(valuesTotals.totalGasto)}
              </p>
            </div>
          </div>
        )}

        {!loadingBalance && filteredBalance.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded border border-line bg-white">
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
                {filteredBalance.map((row) => (
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

      <section className="mb-8">
        <h2 className="mb-2 font-display text-xl font-semibold text-ink">Resumo de Itens</h2>

        {loadingOutput ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : itemsSummary.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma saida registrada nesse periodo.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-line bg-white">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="border-b border-line px-3 py-2.5 font-medium">Mes</th>
                  <th className="border-b border-line px-3 py-2.5 font-medium">Produto</th>
                  <th className="border-b border-line px-3 py-2.5 text-right font-medium">Quantidade</th>
                  <th className="border-b border-line px-3 py-2.5 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {itemsSummary.map((row) => (
                  <tr key={row.productId}>
                    <td className="border-b border-line px-3 py-2.5 text-ink-soft">{periodLabel}</td>
                    <td className="border-b border-line px-3 py-2.5 font-medium text-ink">{row.productName}</td>
                    <td className="border-b border-line px-3 py-2.5 text-right text-ink">
                      {row.averageQuantity.toFixed(1)}
                    </td>
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

      <section>
        <h2 className="mb-2 font-display text-xl font-semibold text-ink">Consumo por setor/funcionario</h2>

        <div className="mb-3 flex flex-wrap gap-2">
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
        ) : filteredConsumption.length === 0 ? (
          <p className="text-sm text-muted">Nenhum consumo encontrado nesse periodo/filtros.</p>
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
                {filteredConsumption.map((row) => (
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
