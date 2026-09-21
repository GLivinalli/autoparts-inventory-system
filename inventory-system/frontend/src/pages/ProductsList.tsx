import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import type { MovementType, Product } from "@/types";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { Spinner } from "@/components/common/Spinner";
import { ProductTable } from "@/components/products/ProductTable";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductForm, ProductFormValues } from "@/components/products/ProductForm";
import { ProductDetailModal } from "@/components/products/ProductDetailModal";
import { ProductMovementModal } from "@/components/products/ProductMovementModal";
import { QuickWithdrawalModal } from "@/components/products/QuickWithdrawalModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import * as productsApi from "@/api/products";
import { getApiErrorMessage } from "@/api/client";

const tabBase = "rounded px-3 py-2 text-sm font-medium";
const tabActive = "bg-ink text-white";
const tabInactive = "text-muted hover:bg-white";

export function ProductsList() {
  const { can } = useAuth();
  const { notify } = useToast();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [movementModal, setMovementModal] = useState<{ product: Product; type: MovementType } | null>(null);
  const [quickWithdrawalOpen, setQuickWithdrawalOpen] = useState(false);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  function fetchProducts() {
    setLoading(true);
    productsApi
      .listProducts({ page, pageSize: 20, search: debouncedSearch || undefined })
      .then((data) => {
        setProducts(data.items);
        setTotalPages(data.totalPages);
      })
      .catch((err) => notify(getApiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }

  useEffect(fetchProducts, [page, debouncedSearch]);

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

  async function handleEntradaSubmit(quantity: number, totalValueReais: number, description?: string) {
    if (!movementModal) return;
    await productsApi.createEntrada(movementModal.product.id, quantity, totalValueReais, description);
    notify("Entrada registrada", "success");
    setMovementModal(null);
    refreshList();
  }

  async function handleSaidaSubmit(quantity: number, setor: string, funcionario: string, description?: string) {
    if (!movementModal) return;
    await productsApi.createSaida(movementModal.product.id, quantity, setor, funcionario, description);
    notify("Saida registrada", "success");
    setMovementModal(null);
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
      <div className="mb-4 flex gap-1">
        <NavLink to="/produtos" end className={({ isActive }) => `${tabBase} ${isActive ? tabActive : tabInactive}`}>
          Estoque
        </NavLink>
        <NavLink to="/produtos/relatorios" className={({ isActive }) => `${tabBase} ${isActive ? tabActive : tabInactive}`}>
          Relatorios
        </NavLink>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Produtos</h1>
          <p className="text-sm text-muted">Almoxarifado com custeio FIFO por lote</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can("canStockOutProducts") && (
            <button
              onClick={() => setQuickWithdrawalOpen(true)}
              className="rounded border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft/80"
            >
              Retirada
            </button>
          )}
          {can("canManageProducts") && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setFormOpen(true);
              }}
              className="hidden rounded bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark sm:block"
            >
              Cadastrar produto
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome ou fabricante" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded border border-dashed border-line bg-white py-16 text-center">
          <p className="text-sm text-muted">Nenhum produto encontrado.</p>
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

      {can("canManageProducts") && (
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormOpen(true);
          }}
          className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg sm:hidden"
          aria-label="Cadastrar produto"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
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
          onStockIn={(product) => setMovementModal({ product, type: "ENTRADA" })}
          onStockOut={(product) => setMovementModal({ product, type: "RETIRADA" })}
          onChanged={refreshList}
        />
      )}

      {movementModal && (
        <ProductMovementModal
          open
          product={movementModal.product}
          type={movementModal.type}
          onClose={() => setMovementModal(null)}
          onSubmitEntrada={handleEntradaSubmit}
          onSubmitSaida={handleSaidaSubmit}
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
