import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import type { ConsumptionReportRow, MonthlyBalanceRow, ProductOutputByMonth } from "@/types";
import { Spinner } from "@/components/common/Spinner";
import * as productsApi from "@/api/products";
import { formatCentsToBRL } from "@/utils/labels";

const tabBase = "rounded px-3 py-2 text-sm font-medium";
const tabActive = "bg-ink text-white";
const tabInactive = "text-muted hover:bg-white";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  return `${MONTH_NAMES[Number(m) - 1]}/${year}`;
}

function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

type PeriodType = "all" | "month" | "year";

export function ProductReports() {
  const [consumption, setConsumption] = useState<ConsumptionReportRow[]>([]);
  const [balance, setBalance] = useState<MonthlyBalanceRow[]>([]);
  const [output, setOutput] = useState<ProductOutputByMonth[]>([]);
  const [loadingConsumption, setLoadingConsumption] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingOutput, setLoadingOutput] = useState(true);
  const [monthFilter, setMonthFilter] = useState("");
  const [setorFilter, setSetorFilter] = useState("");
  const [funcionarioFilter, setFuncionarioFilter] = useState("");

  const [periodType, setPeriodType] = useState<PeriodType>("all");
  const [periodMonth, setPeriodMonth] = useState(new Date().toISOString().slice(0, 7));
  const [periodYear, setPeriodYear] = useState(String(new Date().getFullYear()));

  const [selectedMonthsForAverage, setSelectedMonthsForAverage] = useState<string[]>([]);

  useEffect(() => {
    productsApi.getMonthlyBalance().then(setBalance).finally(() => setLoadingBalance(false));
    productsApi.getOutputByMonth().then(setOutput).finally(() => setLoadingOutput(false));
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

  const valuesTotals = useMemo(() => {
    let rows = balance;
    if (periodType === "month") {
      rows = balance.filter((r) => r.month === periodMonth);
    } else if (periodType === "year") {
      rows = balance.filter((r) => r.month.startsWith(periodYear));
    }
    const totalCompra = rows.reduce((sum, r) => sum + r.entradasCents, 0);
    const totalGasto = rows.reduce((sum, r) => sum + r.saidasCents, 0);
    return { totalCompra, totalGasto };
  }, [balance, periodType, periodMonth, periodYear]);

  const allMonthsWithData = useMemo(() => {
    const set = new Set<string>();
    for (const p of output) {
      for (const m of p.months) set.add(m.month);
    }
    return Array.from(set).sort();
  }, [output]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const previousMonth = shiftMonth(currentMonth, -1);

  function quantityInMonth(product: ProductOutputByMonth, month: string) {
    return product.months.find((m) => m.month === month)?.quantity ?? 0;
  }

  function toggleMonth(month: string) {
    setSelectedMonthsForAverage((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-1">
        <NavLink to="/produtos" end className={({ isActive }) => `${tabBase} ${isActive ? tabActive : tabInactive}`}>
          Estoque
        </NavLink>
        <NavLink to="/produtos/relatorios" className={({ isActive }) => `${tabBase} ${isActive ? tabActive : tabInactive}`}>
          Relatorios
        </NavLink>
      </div>

      <h1 className="font-display text-3xl font-semibold text-ink">Relatorios</h1>
      <p className="mb-6 text-sm text-muted">Valores, saida media por produto e consumo por setor/funcionario</p>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-xl font-semibold text-ink">Valores</h2>

        <div className="mb-3 flex flex-wrap items-center gap-2">
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

        {!loadingBalance && balance.length > 0 && (
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

      <section className="mb-8">
        <h2 className="mb-1 font-display text-xl font-semibold text-ink">Produtos - saida por mes</h2>
        <p className="mb-3 text-sm text-muted">
          {selectedMonthsForAverage.length === 0
            ? `Comparando ${formatMonth(currentMonth)} com ${formatMonth(previousMonth)} (mes anterior)`
            : `Media entre os ${selectedMonthsForAverage.length} meses selecionados`}
        </p>

        {allMonthsWithData.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {allMonthsWithData.map((month) => (
              <label
                key={month}
                className={`flex cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-medium ${
                  selectedMonthsForAverage.includes(month)
                    ? "border-accent bg-accent-soft text-accent-dark"
                    : "border-line bg-white text-muted"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedMonthsForAverage.includes(month)}
                  onChange={() => toggleMonth(month)}
                />
                {formatMonth(month)}
              </label>
            ))}
            {selectedMonthsForAverage.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedMonthsForAverage([])}
                className="rounded px-2.5 py-1.5 text-xs font-medium text-steel hover:bg-steel-soft"
              >
                Voltar ao padrao
              </button>
            )}
          </div>
        )}

        {loadingOutput ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : output.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma saida registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-line bg-white">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="border-b border-line px-3 py-2.5 font-medium">Produto</th>
                  {selectedMonthsForAverage.length === 0 ? (
                    <>
                      <th className="border-b border-line px-3 py-2.5 text-right font-medium">Mes anterior</th>
                      <th className="border-b border-line px-3 py-2.5 text-right font-medium">Mes atual</th>
                      <th className="border-b border-line px-3 py-2.5 text-right font-medium">Diferenca</th>
                    </>
                  ) : (
                    <th className="border-b border-line px-3 py-2.5 text-right font-medium">Media no periodo</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {output.map((product) => {
                  if (selectedMonthsForAverage.length === 0) {
                    const prevQty = quantityInMonth(product, previousMonth);
                    const currQty = quantityInMonth(product, currentMonth);
                    const diffLabel =
                      prevQty === 0
                        ? currQty === 0
                          ? "-"
                          : "novo"
                        : `${(((currQty - prevQty) / prevQty) * 100).toFixed(0)}%`;
                    const diffTone =
                      prevQty === 0 ? "text-muted" : currQty > prevQty ? "text-danger" : currQty < prevQty ? "text-success" : "text-muted";
                    return (
                      <tr key={product.productId}>
                        <td className="border-b border-line px-3 py-2.5 font-medium text-ink">{product.productName}</td>
                        <td className="border-b border-line px-3 py-2.5 text-right text-ink-soft">{prevQty}</td>
                        <td className="border-b border-line px-3 py-2.5 text-right text-ink-soft">{currQty}</td>
                        <td className={`border-b border-line px-3 py-2.5 text-right font-semibold ${diffTone}`}>
                          {diffLabel}
                        </td>
                      </tr>
                    );
                  }

                  const total = selectedMonthsForAverage.reduce((sum, m) => sum + quantityInMonth(product, m), 0);
                  const average = total / selectedMonthsForAverage.length;
                  return (
                    <tr key={product.productId}>
                      <td className="border-b border-line px-3 py-2.5 font-medium text-ink">{product.productName}</td>
                      <td className="border-b border-line px-3 py-2.5 text-right font-semibold text-ink">
                        {average.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
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
