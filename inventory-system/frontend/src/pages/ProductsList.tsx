import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import type { Product } from "@/types";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { Spinner } from "@/components/common/Spinner";
import { ProductTable } from "@/components/products/ProductTable";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductForm, ProductFormValues } from "@/components/products/ProductForm";
import { ProductDetailModal } from "@/components/products/ProductDetailModal";
import { QuickWithdrawalModal } from "@/components/products/QuickWithdrawalModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import * as productsApi from "@/api/products";
import { getApiErrorMessage } from "@/api/client";

const actionButtonClass =
  "rounded border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface";
const activeTabClass = "rounded bg-ink px-4 py-2.5 text-sm font-medium text-white";

export function ProductsList() {
  const { can } = useAuth();
  const { notify } = useToast();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [viewArchived, setViewArchived] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quickWithdrawalOpen, setQuickWithdrawalOpen] = useState(false);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, viewArchived]);

  function fetchProducts() {
    setLoading(true);
    productsApi
      .listProducts({ page, pageSize: 20, search: debouncedSearch || undefined, archived: viewArchived || undefined })
      .then((data) => {
        setProducts(data.items);
        setTotalPages(data.totalPages);
      })
      .catch((err) => notify(getApiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }

  useEffect(fetchProducts, [page, debouncedSearch, viewArchived]);

  function refreshList() {
    setDetailRefreshKey((k) => k + 1);
    fetchProducts();
  }

  async function handleCreateOrUpdate(values: ProductFormValues) {
    if (editingProduct) {
      await productsApi.updateProduct(editingProduct.id, { name: values.name, manufacturer: values.manufacturer });
      notify("Produto atualizado com sucesso", "success");
    } else {
      const initialQuantity = Number(values.initialQuantity) || 0;
      const totalValueReais = Number(values.totalValueReais.replace(",", "."));
      await productsApi.createProduct({
        name: values.name,
        manufacturer: values.manufacturer,
        initialQuantity,
        totalValueReais: initialQuantity > 0 ? totalValueReais : undefined,
      });
      notify("Produto cadastrado com sucesso", "success");
    }
    setFormOpen(false);
    setEditingProduct(null);
    refreshList();
  }

  async function handleQuickWithdrawal(
    productId: string,
    quantity: number,
    setor: string,
    funcionario: string,
    description?: string
  ) {
    await productsApi.createSaida(productId, quantity, setor, funcionario, description);
    notify("Saida registrada", "success");
    setQuickWithdrawalOpen(false);
    refreshList();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <NavLink to="/produtos" end className={({ isActive }) => (isActive ? activeTabClass : actionButtonClass)}>
          Estoque
        </NavLink>
        <NavLink to="/produtos/relatorios" className={({ isActive }) => (isActive ? activeTabClass : actionButtonClass)}>
          Relatorios
        </NavLink>
        {can("canStockOutProducts") && (
          <button onClick={() => setQuickWithdrawalOpen(true)} className={actionButtonClass}>
            Retirada
          </button>
        )}
        {can("canManageProducts") && (
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormOpen(true);
            }}
            className={actionButtonClass}
          >
            Cadastrar produto
          </button>
        )}
      </div>

      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">{viewArchived ? "Produtos arquivados" : "Produtos"}</h1>
          <p className="text-sm text-muted">Almoxarifado com custeio FIFO por lote</p>
        </div>
        <button
          type="button"
          onClick={() => setViewArchived((v) => !v)}
          className="text-sm font-medium text-steel hover:underline"
        >
          {viewArchived ? "Ver produtos ativos" : "Ver produtos arquivados"}
        </button>
      </div>

      <div className="my-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome ou fabricante" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded border border-dashed border-line bg-white py-16 text-center">
          <p className="text-sm text-muted">{viewArchived ? "Nenhum produto arquivado." : "Nenhum produto encontrado."}</p>
        </div>
      ) : (
        <>
          <div className="hidden rounded border border-line bg-white px-3 sm:block">
            <ProductTable products={products} onSelect={(p) => setSelectedProductId(p.id)} />
          </div>
          <div className="flex flex-col gap-2 sm:hidden">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => setSelectedProductId(p.id)} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <ProductForm
        open={formOpen}
        editingProduct={editingProduct}
        onClose={() => {
          setFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          refreshKey={detailRefreshKey}
          onClose={() => setSelectedProductId(null)}
          onEdit={(product) => {
            setEditingProduct(product);
            setFormOpen(true);
            setSelectedProductId(null);
          }}
          onChanged={refreshList}
        />
      )}

      <QuickWithdrawalModal
        open={quickWithdrawalOpen}
        onClose={() => setQuickWithdrawalOpen(false)}
        onSubmit={handleQuickWithdrawal}
      />
    </div>
  );
}
