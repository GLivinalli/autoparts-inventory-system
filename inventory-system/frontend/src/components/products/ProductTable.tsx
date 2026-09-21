import type { Product } from "@/types";
import { formatCentsToBRL } from "@/utils/labels";

export function ProductTable({ products, onSelect }: { products: Product[]; onSelect: (product: Product) => void }) {
  return (
    <table className="w-full border-separate border-spacing-0 text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-muted">
          <th className="border-b border-line py-2.5 pl-1 font-medium">Produto</th>
          <th className="border-b border-line py-2.5 font-medium">Fabricante</th>
          <th className="border-b border-line py-2.5 font-medium">Dias em estoque</th>
          <th className="border-b border-line py-2.5 text-right font-medium">Valor em estoque</th>
          <th className="border-b border-line py-2.5 pr-1 text-right font-medium">Estoque</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id} onClick={() => onSelect(product)} className="cursor-pointer hover:bg-white">
            <td className="border-b border-line py-2.5 pl-1 font-medium text-ink">{product.name}</td>
            <td className="border-b border-line py-2.5 text-ink-soft">{product.manufacturer}</td>
            <td className="border-b border-line py-2.5 text-ink-soft">
              {product.daysInStock !== null ? `${product.daysInStock} dias` : "-"}
            </td>
            <td className="border-b border-line py-2.5 text-right text-ink-soft">
              {formatCentsToBRL(product.stockValueCents)}
            </td>
            <td className="border-b border-line py-2.5 pr-1 text-right">
              <span className={`font-display text-lg font-semibold ${product.quantity === 0 ? "text-danger" : "text-ink"}`}>
                {product.quantity}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
