import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import type { ProductMovement } from "@/types";
import { Spinner } from "@/components/common/Spinner";
import { EditMovementModal } from "@/components/products/EditMovementModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/api/client";
import { listAllProductMovements } from "@/api/productReport";
import { formatCentsToBRL } from "@/utils/labels";
import { onlyDigits, sanitizeMoney } from "@/utils/inputs";
import { PageHeader } from "@/components/common/PageHeader";

const actionButtonClass =
  "rounded border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface";
const activeTabClass = "rounded bg-ink px-4 py-2.5 text-sm font-medium text-white";
const filterClass = "h-8 w-full rounded border border-line bg-white px-2 text-xs focus:border-accent";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type TypeFilter = "" | "ENTRADA" | "RETIRADA";

// Mes (AAAA-MM) no fuso do usuario, para o filtro nao "virar" de mes por
// causa do horario.
function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthKey(key: string) {
  const [year, month] = key.split("-");
  return `${MONTH_NAMES[Number(month) - 1]}/${year}`;
}

// Ignora acentos e maiusculas/minusculas na busca por produto.
function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function sum(list: ProductMovement[], pick: (m: ProductMovement) => number) {
  return list.reduce((acc, m) => acc + pick(m), 0);
}

// No PDF o espaco "especial" entre R$ e o numero vira espaco comum.
function pdfMoney(cents: number) {
  return formatCentsToBRL(cents).replace(/\u00a0/g, " ");
}

export function ProductReports() {
  const { isAdmin } = useAuth();
  const { notify } = useToast();
  const [movements, setMovements] = useState<ProductMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductMovement | null>(null);
  const [exporting, setExporting] = useState(false);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [monthFilter, setMonthFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [minValue, setMinValue] = useState("");

  function loadMovements() {
    return listAllProductMovements()
      .then((data) => setMovements(data.items))
      .catch((err) => notify(getApiErrorMessage(err), "error"));
  }

  useEffect(() => {
    loadMovements().finally(() => setLoading(false));
  }, []);

  const months = useMemo(
    () => Array.from(new Set(movements.map((m) => monthKey(m.createdAt)))).sort().reverse(),
    [movements]
  );
  const sectors = useMemo(
    () => Array.from(new Set(movements.map((m) => m.setor).filter((s): s is string => !!s))).sort(),
    [movements]
  );
  const employees = useMemo(
    () => Array.from(new Set(movements.map((m) => m.funcionario).filter((s): s is string => !!s))).sort(),
    [movements]
  );

  const rows = useMemo(() => {
    const words = normalize(productFilter).split(/\s+/).filter(Boolean);
    const quantity = parseInt(minQuantity) || 0;
    const valueCents = Math.round((parseFloat(minValue.replace(",", ".")) || 0) * 100);

    return movements.filter(
      (m) =>
        (!typeFilter || m.type === typeFilter) &&
        (!monthFilter || monthKey(m.createdAt) === monthFilter) &&
        (!sectorFilter || m.setor === sectorFilter) &&
        (!employeeFilter || m.funcionario === employeeFilter) &&
        words.every((w) => normalize(m.product?.name ?? "").includes(w)) &&
        m.quantity >= quantity &&
        m.totalCents >= valueCents
    );
  }, [movements, typeFilter, monthFilter, sectorFilter, employeeFilter, productFilter, minQuantity, minValue]);

  const entries = rows.filter((m) => m.type === "ENTRADA");
  const exits = rows.filter((m) => m.type === "RETIRADA");

  function clearFilters() {
    setTypeFilter("");
    setMonthFilter("");
    setSectorFilter("");
    setEmployeeFilter("");
    setProductFilter("");
    setMinQuantity("");
    setMinValue("");
  }

  async function exportPdf() {
    if (rows.length === 0) {
      notify("Nada para exportar com esses filtros", "error");
      return;
    }
    setExporting(true);
    try {
      // As bibliotecas so sao baixadas quando voce clica em exportar.
      const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const autoTable = autoTableModule.default;

      const filterParts: string[] = [];
      if (typeFilter) filterParts.push(`Tipo: ${typeFilter === "ENTRADA" ? "só entradas" : "só retiradas"}`);
      if (monthFilter) filterParts.push(`Mês: ${formatMonthKey(monthFilter)}`);
      if (sectorFilter) filterParts.push(`Setor: ${sectorFilter}`);
      if (employeeFilter) filterParts.push(`Funcionário: ${employeeFilter}`);
      if (productFilter.trim()) filterParts.push(`Produto contém: ${productFilter.trim()}`);
      if (minQuantity) filterParts.push(`Quantidade mín.: ${minQuantity}`);
      if (minValue) filterParts.push(`Valor mín.: R$ ${minValue}`);

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(16);
      doc.text("Relatório de produtos", 14, 16);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 22);

      const filtersText = filterParts.length ? `Filtros: ${filterParts.join("  |  ")}` : "Sem filtros (todos os registros)";
      const filterLines = doc.splitTextToSize(filtersText, 269) as string[];
      doc.text(filterLines, 14, 27);
      doc.setTextColor(0);

      autoTable(doc, {
        startY: 27 + filterLines.length * 4 + 3,
        head: [["Data", "Setor", "Funcionário", "Produto", "Quantidade", "Valor"]],
        body: rows.map((m) => [
          new Date(m.createdAt).toLocaleDateString("pt-BR"),
          m.setor || "-",
          m.funcionario || "-",
          m.product?.name ?? "-",
          `${m.type === "ENTRADA" ? "+" : "-"}${m.quantity}`,
          pdfMoney(m.totalCents),
        ]),
        foot: [
          [
            { content: `Entradas - ${entries.length} registros`, colSpan: 4 },
            `+${sum(entries, (m) => m.quantity)}`,
            pdfMoney(sum(entries, (m) => m.totalCents)),
          ],
          [
            { content: `Retiradas - ${exits.length} registros`, colSpan: 4 },
            `-${sum(exits, (m) => m.quantity)}`,
            pdfMoney(sum(exits, (m) => m.totalCents)),
          ],
        ],
        showFoot: "lastPage",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [31, 41, 55] },
        footStyles: { fillColor: [243, 244, 246], textColor: 20, fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 30 },
          2: { cellWidth: 34 },
          4: { cellWidth: 24, halign: "right" },
          5: { cellWidth: 30, halign: "right" },
        },
      });

      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${pages}`,
          doc.internal.pageSize.getWidth() - 14,
          doc.internal.pageSize.getHeight() - 8,
          { align: "right" }
        );
      }

      doc.save(`relatorio-produtos-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      notify(getApiErrorMessage(err, "Não foi possível gerar o PDF"), "error");
    } finally {
      setExporting(false);
    }
  }

  const dash = <span className="text-muted">—</span>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <NavLink to="/produtos" end className={({ isActive }) => (isActive ? activeTabClass : actionButtonClass)}>
          Estoque
        </NavLink>
        <NavLink to="/produtos/relatorios" className={({ isActive }) => (isActive ? activeTabClass : actionButtonClass)}>
          Relatórios
        </NavLink>
      </div>

      <PageHeader
        title="Relatórios"
        subtitle={
          <>
            Todas as entradas e retiradas em uma tabela, com filtro em cada coluna
            {isAdmin && ". Clique em uma linha para editar data, funcionário ou quantidade"}
          </>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : movements.length === 0 ? (
        <div className="rounded border border-dashed border-line bg-white py-16 text-center">
          <p className="text-sm text-muted">Nenhuma movimentação registrada ainda.</p>
        </div>
      ) : (
        <div className="rounded-md bg-surface-1 p-3">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="h-8 rounded border border-line bg-white px-2 text-sm focus:border-accent"
              >
                <option value="">Entradas e retiradas</option>
                <option value="ENTRADA">Só entradas</option>
                <option value="RETIRADA">Só retiradas</option>
              </select>
              <span className="text-sm text-muted">
                {rows.length} de {movements.length} registros
              </span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={clearFilters} className={`${actionButtonClass} !py-1.5`}>
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={exportPdf}
                disabled={exporting}
                className={`${actionButtonClass} !py-1.5 disabled:opacity-60`}
              >
                {exporting ? "Gerando PDF..." : "Exportar PDF"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-line bg-white">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
              <colgroup>
                <col style={{ width: "104px" }} />
                <col style={{ width: "112px" }} />
                <col style={{ width: "120px" }} />
                <col />
                <col style={{ width: "92px" }} />
                <col style={{ width: "108px" }} />
              </colgroup>
              <thead>
                <tr className="text-left text-xs font-medium text-muted">
                  <th className="px-2 pb-1 pt-2.5 font-medium">Data</th>
                  <th className="px-2 pb-1 pt-2.5 font-medium">Setor</th>
                  <th className="px-2 pb-1 pt-2.5 font-medium">Funcionário</th>
                  <th className="px-2 pb-1 pt-2.5 font-medium">Produto</th>
                  <th className="px-2 pb-1 pt-2.5 text-right font-medium">Quantidade</th>
                  <th className="px-2 pb-1 pt-2.5 text-right font-medium">Valor</th>
                </tr>
                <tr>
                  <td className="px-2 pb-2">
                    <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className={filterClass}>
                      <option value="">Todas</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {formatMonthKey(m)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 pb-2">
                    <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className={filterClass}>
                      <option value="">Todos</option>
                      {sectors.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 pb-2">
                    <select
                      value={employeeFilter}
                      onChange={(e) => setEmployeeFilter(e.target.value)}
                      className={filterClass}
                    >
                      <option value="">Todos</option>
                      {employees.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 pb-2">
                    <input
                      value={productFilter}
                      onChange={(e) => setProductFilter(e.target.value)}
                      placeholder="Buscar produto"
                      className={filterClass}
                    />
                  </td>
                  <td className="px-2 pb-2">
                    <input
                      inputMode="numeric"
                      value={minQuantity}
                      onChange={(e) => setMinQuantity(onlyDigits(e.target.value))}
                      placeholder="min."
                      className={filterClass}
                    />
                  </td>
                  <td className="px-2 pb-2">
                    <input
                      inputMode="decimal"
                      value={minValue}
                      onChange={(e) => setMinValue(sanitizeMoney(e.target.value))}
                      placeholder="min. R$"
                      className={filterClass}
                    />
                  </td>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border-t border-line px-2 py-6 text-center text-muted">
                      Nada encontrado com esses filtros.
                    </td>
                  </tr>
                ) : (
                  rows.map((m) => (
                    <tr
                      key={m.id}
                      onClick={isAdmin ? () => setEditing(m) : undefined}
                      title={isAdmin ? "Clique para editar" : undefined}
                      className={`border-t border-line ${isAdmin ? "cursor-pointer hover:bg-surface" : ""}`}
                    >
                      <td className="px-2 py-2 align-top text-ink-soft">
                        {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-2 py-2 align-top text-ink-soft">{m.setor || dash}</td>
                      <td className="px-2 py-2 align-top text-ink-soft">{m.funcionario || dash}</td>
                      <td className="px-2 py-2 align-top font-medium text-ink">{m.product?.name ?? "-"}</td>
                      <td className="px-2 py-2 text-right align-top font-medium">
                        {m.type === "ENTRADA" ? (
                          <span className="text-success">+{m.quantity}</span>
                        ) : (
                          <span className="text-danger">−{m.quantity}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right align-top text-ink">{formatCentsToBRL(m.totalCents)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-surface-1">
                <tr className="border-t border-line font-medium">
                  <td colSpan={4} className="px-2 py-2 text-ink">
                    Entradas · {entries.length} registros
                  </td>
                  <td className="px-2 py-2 text-right text-success">+{sum(entries, (m) => m.quantity)}</td>
                  <td className="px-2 py-2 text-right text-ink">{formatCentsToBRL(sum(entries, (m) => m.totalCents))}</td>
                </tr>
                <tr className="border-t border-line font-medium">
                  <td colSpan={4} className="px-2 py-2 text-ink">
                    Retiradas · {exits.length} registros
                  </td>
                  <td className="px-2 py-2 text-right text-danger">−{sum(exits, (m) => m.quantity)}</td>
                  <td className="px-2 py-2 text-right text-ink">{formatCentsToBRL(sum(exits, (m) => m.totalCents))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <EditMovementModal
        movement={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          notify("Registro atualizado", "success");
          loadMovements();
        }}
      />
    </div>
  );
}
