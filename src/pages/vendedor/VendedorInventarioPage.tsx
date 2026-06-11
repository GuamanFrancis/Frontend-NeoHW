import { useEffect, useState, useMemo } from 'react';
import { Boxes, Search, Filter, Lock, Eye, Edit2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageCard } from '../../components/ui/PageCard';
import { Modal } from '../../components/ui/Modal';
import { getCatalogComponents, updateCatalogComponent } from '../../services/catalogService';
import type { CatalogComponent, CatalogStockStatus } from '../../types/catalog';
import { getStoredSession } from '../../services/session';

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
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | CatalogStockStatus>('todos');
  const [ownerFilter, setOwnerFilter] = useState<'todos' | 'propios' | 'externos'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedComponent, setSelectedComponent] = useState<CatalogComponent | null>(null);
  const [componentToEditStock, setComponentToEditStock] = useState<CatalogComponent | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const session = getStoredSession();
  const currentUserId = session?.user.id;

  const loadInventory = async () => {
    try {
      const response = await getCatalogComponents({ page: 1, limit: 100 });
      setItems(response.items);
      setPageError('');
    } catch (err) {
      setPageError('No fue posible sincronizar inventario con backend. Verifica la conexion e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      const matchesCategory = categoryFilter === 'todos' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;

      let matchesOwner = true;
      if (ownerFilter === 'propios') {
        matchesOwner = item.sellerId === currentUserId;
      } else if (ownerFilter === 'externos') {
        matchesOwner = item.sellerId !== currentUserId;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesOwner;
    });
  }, [items, search, categoryFilter, statusFilter, ownerFilter, currentUserId]);

  const categoryOptions = useMemo(() => {
    const names = Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort();
    return [
      { label: 'Categorías: Todas', value: 'todos' },
      ...names.map((name) => ({ label: name, value: name })),
    ];
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pageItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstResult = filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResult = Math.min(currentPage * pageSize, filteredItems.length);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('todos');
    setStatusFilter('todos');
    setOwnerFilter('todos');
    setCurrentPage(1);
  };

  const handleUpdateStock = async () => {
    if (!componentToEditStock) return;
    try {
      setIsUpdatingStock(true);
      setActionError(null);
      setActionSuccess(null);
      await updateCatalogComponent(componentToEditStock.id, { stock: newStockValue });
      setActionSuccess('Stock actualizado exitosamente.');
      await loadInventory();
      setTimeout(() => {
        setComponentToEditStock(null);
        setActionSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      const backendMsg = err.response?.data?.message || err.message || '';
      const isForbidden = err.response?.status === 403 || backendMsg.includes('permission') || backendMsg.includes('INSUFFICIENT');
      if (isForbidden) {
        setActionError('Error de autorización: Tu rol de Vendedor no tiene permisos en el backend para modificar el catálogo.');
      } else {
        setActionError(`Error al actualizar el stock: ${Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg}`);
      }
    } finally {
      setIsUpdatingStock(false);
    }
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
          Mostrando {firstResult}-{lastResult} de {filteredItems.length} componentes
        </span>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_180px_180px_180px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar componente, marca o descripción..."
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

          <select
            className={fieldClass}
            value={ownerFilter}
            onChange={(e) => {
              setOwnerFilter(e.target.value as 'todos' | 'propios' | 'externos');
              setCurrentPage(1);
            }}
          >
            <option value="todos">Propiedad: Todos</option>
            <option value="propios">Mis Productos</option>
            <option value="externos">Productos de Terceros</option>
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
                  <th className="px-4 py-3 font-bold">Marca</th>
                  <th className="px-4 py-3 font-bold">Precio</th>
                  <th className="px-4 py-3 font-bold">Stock</th>
                  <th className="px-4 py-3 font-bold">Propiedad</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-neutral-900/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Cargando catálogo...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
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
                      <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">
                        {item.brand}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-neutral-100">
                        {item.stock} uds
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.sellerId === currentUserId ? (
                          <span className="inline-flex items-center rounded-full bg-teal-400/10 px-2 py-1 text-[10px] font-bold text-teal-600 dark:bg-teal-400/10 dark:text-teal-400 border border-teal-500/20">
                            Propio
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-neutral-500">
                            <Lock className="h-3 w-3" />
                            Externo
                          </span>
                        )}
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
                          <button
                            type="button"
                            onClick={() => {
                              setComponentToEditStock(item);
                              setNewStockValue(item.stock);
                              setActionError(null);
                              setActionSuccess(null);
                            }}
                            className={actionButtonClass}
                            aria-label="Editar stock"
                          >
                            <Edit2 className="h-4 w-4" />
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
          <div className="space-y-6 text-slate-800 dark:text-neutral-250">
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
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Marca</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedComponent.brand}</span>
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

      {componentToEditStock && (
        <Modal
          open={!!componentToEditStock}
          onClose={() => {
            if (!isUpdatingStock) {
              setComponentToEditStock(null);
              setActionError(null);
              setActionSuccess(null);
            }
          }}
          title={`Actualizar Stock: ${componentToEditStock.name}`}
        >
          <div className="space-y-5 text-slate-800 dark:text-neutral-250">
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
              Modifica la cantidad disponible en el inventario para este componente de hardware.
            </p>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-neutral-900/50 border border-slate-100 dark:border-neutral-800">
              <span className="text-xs font-bold text-slate-600 dark:text-neutral-300">Cantidad actual:</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{componentToEditStock.stock} unidades</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-neutral-300">Nuevo stock en unidades:</label>
              <input
                type="number"
                min="0"
                value={newStockValue}
                onChange={(e) => setNewStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                className={`${fieldClass} w-full`}
                disabled={isUpdatingStock}
                placeholder="Ej. 15"
              />
            </div>

            {actionError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-400 leading-normal">
                {actionError}
              </div>
            )}

            {actionSuccess && (
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 leading-normal">
                {actionSuccess}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setComponentToEditStock(null);
                  setActionError(null);
                  setActionSuccess(null);
                }}
                disabled={isUpdatingStock}
                className="rounded-lg px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-900 disabled:opacity-50"
              >
                Cancelar
              </button>
              <Button
                type="button"
                onClick={() => void handleUpdateStock()}
                disabled={isUpdatingStock}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold border-0 h-10 px-6 shadow-lg shadow-teal-500/15"
              >
                {isUpdatingStock ? 'Actualizando...' : 'Guardar stock'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageCard>
  );
};
