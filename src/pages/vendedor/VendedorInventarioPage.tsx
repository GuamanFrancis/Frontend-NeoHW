import { useEffect, useState, useMemo } from 'react';
import { Boxes, Search, Filter, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageCard } from '../../components/ui/PageCard';
import { Modal } from '../../components/ui/Modal';
import { getCatalogComponents } from '../../services/catalogService';
import { getCategories } from '../../services/categoryService';
import type { CatalogComponent, CatalogStockStatus, BackendCategory } from '../../types/catalog';

const statusLabel: Record<CatalogStockStatus, string> = {
  disponible: 'Disponible',
  'stock-bajo': 'Stock bajo',
  agotado: 'Agotado',
};

const statusStyle: Record<CatalogStockStatus, string> = {
  disponible: 'bg-emerald-400/10 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-200',
  'stock-bajo': 'bg-amber-400/10 text-amber-700 ring-amber-500/20 dark:bg-amber-500/15 dark:text-amber-200',
  agotado: 'bg-rose-400/10 text-rose-700 ring-rose-500/20 dark:bg-rose-500/15 dark:text-rose-200',
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

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | CatalogStockStatus>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedComponent, setSelectedComponent] = useState<CatalogComponent | null>(null);

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
  const firstResult = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResult = Math.min(currentPage * pageSize, totalItems);

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
    <PageCard
      title="Inventario de componentes"
      text="Consulta stock disponible y especificaciones técnicas de los componentes del hardware."
      icon={<Boxes className="h-6 w-6" />}
    >
      {pageError && (
        <div className="mb-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
          {pageError}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-550 dark:text-neutral-400">
          Mostrando {firstResult}-{lastResult} de {totalItems} componentes
        </span>
      </div>

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
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.03] dark:text-neutral-400">
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
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <Boxes className="h-5 w-5 text-slate-350 dark:text-neutral-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-bold text-slate-900 dark:text-white truncate max-w-[240px]">
                              {item.name}
                            </span>
                            <span className="block text-[10px] text-slate-400 dark:text-neutral-500">
                              ID: {item.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600 dark:text-neutral-300">
                        {item.category}
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-neutral-100">
                        {item.stock} uds
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${statusStyle[item.status]}`}>
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

          <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
            <span className="text-xs text-slate-500 dark:text-neutral-400">
              Página {currentPage} de {totalPages}
            </span>
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

              {Array.from({ length: totalPages }).map((_, index) => {
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
          onClose={() => setSelectedComponent(null)}
          title={`Detalles de Componente: ${selectedComponent.name}`}
        >
          <div className="space-y-6 text-slate-800 dark:text-neutral-200">
            <div className="flex flex-col gap-4 sm:flex-row items-center sm:items-start gap-6">
              <div className="h-28 w-28 shrink-0 flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-2 dark:border-neutral-800 dark:bg-neutral-900/60">
                {selectedComponent.imageUrl ? (
                  <img
                    src={selectedComponent.imageUrl}
                    alt={selectedComponent.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Boxes className="h-12 w-12 text-slate-300 dark:text-neutral-600" />
                )}
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Categoría</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedComponent.category}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Modelo</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedComponent.model || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">SKU</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedComponent.sku || 'N/A'}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-neutral-900 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Precio</span>
                    <span className="text-lg font-black text-slate-950 dark:text-white">{formatCurrency(selectedComponent.price)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Stock actual</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedComponent.stock} unidades</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Descripción</span>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed font-medium">
                {selectedComponent.description}
              </p>
            </div>

            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Especificaciones Técnicas</span>
              {selectedComponent.attributes && selectedComponent.attributes.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedComponent.attributes.map((attr, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-neutral-800 dark:bg-neutral-900/40">
                      <span className="block text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500">{attr.name}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">{attr.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500">
                  Sin especificaciones técnicas dinámicas registradas.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" onClick={() => setSelectedComponent(null)} className="h-10 px-6 font-bold text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 border-0 shadow-none">
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageCard>
  );
};
