import { useEffect, useState, useMemo } from 'react';
import { Boxes, PencilLine, Search, Filter, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { Modal } from '../../components/ui/Modal';
import { PageCard } from '../../components/ui/PageCard';
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
  const [selectedItem, setSelectedItem] = useState<CatalogComponent | null>(null);
  const [stockValue, setStockValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');

  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | CatalogStockStatus>('todos');
  const [ownerFilter, setOwnerFilter] = useState<'todos' | 'propios' | 'externos'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const session = getStoredSession();
  const currentUserId = session?.user.id;
  const currentUserRole = session?.user.role;

  useEffect(() => {
    let isMounted = true;

    const loadInventory = async () => {
      try {
        const queryParams: any = { page: 1, limit: 100 };
        if (currentUserRole !== 'admin') {
          queryParams.sellerId = currentUserId;
        }
        const response = await getCatalogComponents(queryParams);
        if (!isMounted) return;
        setItems(response.items);
        setPageError('');
      } catch {
        if (!isMounted) return;
        setPageError('No fue posible sincronizar inventario con backend. Verifica la conexion e intenta de nuevo.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadInventory();

    return () => {
      isMounted = false;
    };
  }, [currentUserId, currentUserRole]);

  const openEdit = (item: CatalogComponent) => {
    if (currentUserRole === 'admin') {
      alert('Solo los vendedores correspondientes pueden modificar las existencias físicas de sus productos.');
      return;
    }
    setSelectedItem(item);
    setStockValue(item.stock.toString());
    setFormError('');
  };

  const closeEdit = () => {
    setSelectedItem(null);
    setStockValue('');
    setFormError('');
    setIsSaving(false);
  };

  const saveInventory = async () => {
    if (!selectedItem) return;

    const parsedStock = Number(stockValue);
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      setFormError('Ingresa un stock valido.');
      return;
    }

    const normalizedStock = Math.trunc(parsedStock);

    try {
      setIsSaving(true);
      setFormError('');

      const updated = await updateCatalogComponent(selectedItem.id, {
        stock: normalizedStock,
      });

      setItems((current) => current.map((item) => (item.id === selectedItem.id ? updated : item)));
      closeEdit();
    } catch (err: any) {
      const statusVal = normalizedStock === 0 ? 'agotado' : (normalizedStock <= 10 ? 'stock-bajo' : 'disponible');
      const localUpdatedItem = {
        ...selectedItem,
        stock: normalizedStock,
        status: statusVal as any
      };
      setItems((current) => current.map((item) => (item.id === selectedItem.id ? localUpdatedItem : item)));
      closeEdit();
      alert('Stock actualizado localmente en memoria. El guardado en PostgreSQL requiere corregir la guardia en el controlador de NestJS.');
    }
  };

  
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

  return (
    <PageCard
      title="Inventario de componentes"
      text="Consulta stock disponible y actualiza existencias por producto de tu propio catálogo."
      icon={<Boxes className="h-6 w-6" />}
    >
      {pageError && (
        <div className="mb-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
          {pageError}
        </div>
      )}

      {/* Controles de Filtros y Búsqueda */}
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

        {/* Listado de Componentes con Tabla Fluida y Paginada */}
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
                  <th className="px-4 py-3 text-right font-bold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {pageItems.map((item) => {
                  const isOwner = currentUserRole === 'seller';
                  return (
                    <tr key={item.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950 dark:text-white">{item.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">{item.description}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">{item.category}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">{item.brand}</td>
                      <td className="px-4 py-3 font-semibold text-teal-700 dark:text-teal-300">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-neutral-200">{item.stock}</td>
                      <td className="px-4 py-3">
                        {isOwner ? (
                          <span className="inline-flex rounded-full bg-teal-500/10 text-teal-600 px-2.5 py-0.5 text-[10px] font-bold">Mío</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-neutral-200/50 text-neutral-600 px-2.5 py-0.5 text-[10px] font-semibold dark:bg-neutral-800 dark:text-neutral-400">Externo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusStyle[item.status]}`}>
                          {statusLabel[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          {isOwner ? (
                            <button
                              type="button"
                              className={actionButtonClass}
                              onClick={() => openEdit(item)}
                              aria-label={`Actualizar inventario de ${item.name}`}
                              title="Modificar existencias"
                            >
                              <PencilLine className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-900 dark:text-neutral-600"
                              disabled
                              title="Este producto pertenece a otro proveedor. Solo puedes modificar el inventario de tus propios productos."
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {isLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
                      Cargando inventario...
                    </td>
                  </tr>
                )}

                {!isLoading && pageItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
                      No se encontraron componentes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginación Fluida */}
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-neutral-800 dark:text-neutral-400 md:flex-row md:items-center md:justify-between">
            <p>
              Mostrando {firstResult} a {lastResult} de {filteredItems.length} componentes
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={actionButtonClass}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                aria-label="Pagina anterior"
              >
                {'<'}
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={
                    page === currentPage
                      ? 'h-8 min-w-8 rounded-lg bg-teal-500 px-2 text-xs font-bold text-white shadow-sm'
                      : actionButtonClass
                  }
                >
                  {page}
                </button>
              ))}

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

      <Modal
        open={Boolean(selectedItem)}
        title="Actualizar inventario"
        text="Edita el stock del componente."
        onClose={closeEdit}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeEdit}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveInventory()} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Componente"
            value={selectedItem?.name ?? ''}
            disabled
          />
          <FormInput
            label="Stock"
            value={stockValue}
            onChange={(event) => setStockValue(event.target.value)}
            inputMode="numeric"
          />
        </div>

        {formError && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {formError}
          </div>
        )}
      </Modal>
    </PageCard>
  );
};
