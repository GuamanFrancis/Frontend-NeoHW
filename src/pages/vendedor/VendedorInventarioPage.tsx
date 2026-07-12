import { useEffect, useState, useMemo } from 'react';
import { Search, Filter, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageCard } from '../../components/ui/PageCard';
import { Modal } from '../../components/ui/Modal';
import { getCatalogComponents, updateCatalogComponent } from '../../services/catalogService';
import { getCategories } from '../../services/categoryService';
import type { CatalogComponent, CatalogStockStatus, BackendCategory } from '../../types/catalog';

const statusLabel: Record<CatalogStockStatus, string> = {
  disponible: 'Disponible',
  'stock-bajo': 'Stock bajo',
  agotado: 'Agotado',
};

const statusTextStyle: Record<CatalogStockStatus, string> = {
  disponible: 'text-emerald-600 dark:text-emerald-400 font-medium',
  'stock-bajo': 'text-amber-600 dark:text-amber-400 font-medium',
  agotado: 'text-rose-600 dark:text-rose-400 font-medium',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

const fieldClass =
  'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:border-teal-400 dark:disabled:bg-neutral-900';

const actionButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-teal-500/60 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 dark:hover:text-teal-200';

export const VendedorInventarioPage = () => {
  const [items, setItems] = useState<CatalogComponent[]>([]);
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | CatalogStockStatus>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedComponent, setSelectedComponent] = useState<CatalogComponent | null>(null);
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [newStock, setNewStock] = useState(0);
  const [isSavingStock, setIsSavingStock] = useState(false);
  const [stockError, setStockError] = useState('');

  const handleSaveStock = async () => {
    if (!selectedComponent) return;
    try {
      setIsSavingStock(true);
      setStockError('');
      const updated = await updateCatalogComponent(selectedComponent.id, {
        stock: newStock,
      });
      setItems((prev) => prev.map((item) => item.id === selectedComponent.id ? updated : item));
      setSelectedComponent(updated);
      setIsEditingStock(false);
    } catch (err) {
      console.error(err);
      setStockError('No se pudo actualizar el stock.');
    } finally {
      setIsSavingStock(false);
    }
  };

  const [maxVisitedPage, setMaxVisitedPage] = useState(1);

  useEffect(() => {
    if (currentPage === 1) {
      setMaxVisitedPage(1);
    } else {
      setMaxVisitedPage((prev) => Math.max(prev, currentPage));
    }
  }, [currentPage]);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const categoryParam = categoryFilter === 'todos' ? undefined : categoryFilter;
      const response = await getCatalogComponents({
        page: currentPage,
        limit: pageSize,
        search: search.trim() || undefined,
        category: categoryParam,
      });
      setItems(response.items);
      setTotalItems(response.total);
      setPageError('');
    } catch (err) {
      setPageError('No fue posible sincronizar inventario con backend. Verifica la conexion e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [currentPage, pageSize, search, categoryFilter]);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'todos') return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const categoryOptions = useMemo(() => {
    return [
      { label: 'Categorías: Todas', value: 'todos' },
      ...categories.map((cat) => ({ label: cat.name, value: cat.slug })),
    ];
  }, [categories]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageItems = filteredItems;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('todos');
    setStatusFilter('todos');
    setCurrentPage(1);
  };

  return (
    <PageCard>
      {pageError && (
        <div className="mb-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
          {pageError}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_180px_180px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar componente o descripción..."
              className={`${fieldClass} w-full pl-10`}
            />
          </label>

          <select
            className={fieldClass}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className={fieldClass}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'todos' | CatalogStockStatus);
              setCurrentPage(1);
            }}
          >
            <option value="todos">Disponibilidad: Todos</option>
            <option value="disponible">Disponible</option>
            <option value="stock-bajo">Stock bajo</option>
            <option value="agotado">Agotado</option>
          </select>

          <Button type="button" variant="outline" className="h-10 px-4 text-sm" onClick={clearFilters}>
            <Filter className="h-4 w-4" />
            Limpiar
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-base">
              <thead className="bg-slate-50 text-sm uppercase tracking-wider text-slate-955 dark:bg-white/[0.03] dark:text-white">
                <tr>
                  <th className="px-4 py-3 font-bold">Componente</th>
                  <th className="px-4 py-3 font-bold">Categoria</th>
                  <th className="px-4 py-3 font-bold">Precio</th>
                  <th className="px-4 py-3 font-bold">Stock</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-neutral-900/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Cargando catálogo...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No se encontraron componentes en inventario.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-slate-100 bg-slate-50 p-1 dark:border-neutral-800 dark:bg-neutral-900/50">
                            <img
                              src={(!failedImages[item.id] && item.imageUrl) ? item.imageUrl : '/favicon.jpg'}
                              alt={item.name}
                              className="max-h-full max-w-full object-contain"
                              onError={() => {
                                if (item.imageUrl && item.imageUrl !== '/favicon.jpg') {
                                  setFailedImages((prev) => ({ ...prev, [item.id]: true }));
                                }
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="block font-normal text-base text-slate-900 dark:text-white truncate max-w-[240px]">
                              {item.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-normal text-base text-slate-900 dark:text-white">
                        {item.category}
                      </td>

                      <td className="px-4 py-3 font-normal text-base text-slate-900 dark:text-white">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3 font-normal text-base text-slate-900 dark:text-white">
                        {item.stock} uds
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-base font-normal ${statusTextStyle[item.status]}`}>
                          {statusLabel[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedComponent(item)}
                            className={actionButtonClass}
                            aria-label="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-end dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={actionButtonClass}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                aria-label="Pagina anterior"
              >
                {'<'}
              </button>

              {Array.from({ length: Math.min(totalPages, maxVisitedPage) }).map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                      currentPage === page
                        ? 'bg-teal-500 text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                className={actionButtonClass}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                aria-label="Pagina siguiente"
              >
                {'>'}
              </button>

              <select
                className={`${fieldClass} h-8 text-xs`}
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5 por pagina</option>
                <option value={10}>10 por pagina</option>
                <option value={20}>20 por pagina</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {selectedComponent && (
        <Modal
          open={!!selectedComponent}
          onClose={() => {
            setSelectedComponent(null);
            setIsEditingStock(false);
            setStockError('');
          }}
          title={`Detalles de Componente: ${selectedComponent.name}`}
        >
          <div className="space-y-6 text-slate-900 dark:text-white max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
            <div className="flex flex-col gap-4 sm:flex-row items-center sm:items-start gap-6">
              <div className="h-28 w-28 shrink-0 flex items-center justify-center rounded-xl border border-slate-150 bg-slate-50 p-2 dark:border-neutral-800 dark:bg-neutral-900/60">
                <img
                  src={(!failedImages[selectedComponent.id] && selectedComponent.imageUrl) ? selectedComponent.imageUrl : '/favicon.jpg'}
                  alt={selectedComponent.name}
                  className="max-h-full max-w-full object-contain"
                  onError={() => {
                    if (selectedComponent.imageUrl && selectedComponent.imageUrl !== '/favicon.jpg') {
                      setFailedImages((prev) => ({ ...prev, [selectedComponent.id]: true }));
                    }
                  }}
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white text-base">Categoría</span>
                    <span className="block font-normal text-slate-955 dark:text-white text-base mt-0.5">{selectedComponent.category}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white text-base">Modelo</span>
                    <span className="block font-normal text-slate-955 dark:text-white text-base mt-0.5">{selectedComponent.model || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white text-base">SKU</span>
                    <span className="block font-mono font-normal text-slate-955 dark:text-white text-base mt-0.5">{selectedComponent.sku || 'N/A'}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="block font-semibold text-slate-900 dark:text-white text-base">Stock actual</span>
                    {isEditingStock ? (
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={newStock}
                            onChange={(e) => setNewStock(Math.max(0, parseInt(e.target.value) || 0))}
                            className={`${fieldClass} w-20 h-9 px-2 text-sm`}
                            disabled={isSavingStock}
                          />
                          <button
                            type="button"
                            onClick={handleSaveStock}
                            disabled={isSavingStock}
                            className="h-9 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                          >
                            {isSavingStock ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingStock(false)}
                            disabled={isSavingStock}
                            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-900 text-slate-700 dark:text-neutral-200 font-semibold text-xs transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                        {stockError && (
                          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">{stockError}</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-normal text-slate-955 dark:text-white text-base">{selectedComponent.stock} unidades</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewStock(selectedComponent.stock);
                            setIsEditingStock(true);
                            setStockError('');
                          }}
                          className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline cursor-pointer transition"
                        >
                          (Editar stock)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-150 dark:border-neutral-800" />

            <div>
              <span className="block font-bold uppercase tracking-wider text-slate-955 dark:text-white text-sm">Descripción</span>
              <p className="text-base text-slate-955 dark:text-white leading-relaxed font-normal mt-2">
                {selectedComponent.description || 'Sin descripción'}
              </p>
            </div>

            <div className="border-t border-slate-150 dark:border-neutral-800" />

            <div>
              <span className="block font-bold uppercase tracking-wider text-slate-955 dark:text-white text-sm">Especificaciones Principales</span>
              {selectedComponent.attributes && selectedComponent.attributes.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-3">
                  {selectedComponent.attributes.map((attr, idx) => (
                    <div key={idx}>
                      <span className="block font-semibold text-slate-900 dark:text-white text-base">{attr.name}</span>
                      <span className="block font-normal text-slate-955 dark:text-white text-base mt-0.5">{attr.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base font-normal text-slate-955 dark:text-white mt-2">
                  Sin especificaciones principales registradas.
                </p>
              )}
            </div>

            <div className="border-t border-slate-150 dark:border-neutral-800" />

            <div className="flex items-center justify-between">
              <div>
                <span className="block font-bold uppercase tracking-wider text-slate-955 dark:text-white text-sm">Precio</span>
                <span className="block text-2xl font-semibold text-slate-955 dark:text-white mt-1">{formatCurrency(selectedComponent.price)}</span>
              </div>
              <div className="text-right">
                <span className="block font-bold uppercase tracking-wider text-slate-955 dark:text-white text-sm">Estado</span>
                <span className={`block text-lg font-semibold mt-1 ${statusTextStyle[selectedComponent.status]}`}>
                  {statusLabel[selectedComponent.status]}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setSelectedComponent(null)}
                variant="outlineHoverSolid"
                className="h-11 px-6 font-bold text-sm border border-teal-500 text-teal-600 bg-transparent hover:bg-teal-500 hover:text-white dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-400 dark:hover:text-neutral-950 transition cursor-pointer"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageCard>
  );
};
