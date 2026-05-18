import { useEffect, useMemo, useState } from 'react';
import { Eye, PackageSearch, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { Modal } from '../../components/ui/Modal';
import { PageCard } from '../../components/ui/PageCard';
import {
  createCatalogComponent,
  deleteCatalogComponent,
  getCatalogComponents,
  updateCatalogComponent,
} from '../../services/catalogService';
import type { CatalogComponent, CatalogSavePayload, CatalogStockStatus } from '../../types/catalog';

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

type CatalogFormValues = {
  name: string;
  description: string;
  category: string;
  brand: string;
  price: string;
  stock: string;
  status: CatalogStockStatus;
  imageUrl: string;
};

const emptyForm: CatalogFormValues = {
  name: '',
  description: '',
  category: '',
  brand: '',
  price: '',
  stock: '',
  status: 'disponible',
  imageUrl: '',
};

const statusMeta: Record<CatalogStockStatus, { label: string; className: string }> = {
  disponible: {
    label: 'Disponible',
    className:
      'border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  'stock-bajo': {
    label: 'Stock bajo',
    className:
      'border-amber-400/40 bg-amber-400/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  },
  agotado: {
    label: 'Agotado',
    className: 'border-red-400/40 bg-red-400/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
  },
};

const fieldClass =
  'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:border-teal-400 dark:disabled:bg-neutral-900';

const actionButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-teal-500/60 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 dark:hover:text-teal-200';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

const getVisiblePages = (totalPages: number, currentPage: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('ellipsis');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push('ellipsis');
  pages.push(totalPages);

  return pages;
};

const mapComponentToForm = (component: CatalogComponent): CatalogFormValues => ({
  name: component.name,
  description: component.description,
  category: component.category,
  brand: component.brand,
  price: component.price.toString(),
  stock: component.stock.toString(),
  status: component.status,
  imageUrl: component.imageUrl ?? '',
});

const catalogFallbackComponents: CatalogComponent[] = [
  {
    id: 'catalog-fallback-1',
    name: 'AMD Ryzen 9 7900X',
    description: '12 nucleos / 24 hilos',
    category: 'Procesadores',
    brand: 'AMD',
    price: 425.99,
    stock: 18,
    status: 'disponible',
    imageUrl: null,
  },
  {
    id: 'catalog-fallback-2',
    name: 'ASUS ROG Strix B650E-F Gaming WiFi',
    description: 'Placa madre AM5',
    category: 'Placas madre',
    brand: 'ASUS',
    price: 299.99,
    stock: 7,
    status: 'stock-bajo',
    imageUrl: null,
  },
  {
    id: 'catalog-fallback-3',
    name: 'Corsair Vengeance RGB 32GB 6000MHz',
    description: 'Memoria DDR5',
    category: 'Memoria RAM',
    brand: 'Corsair',
    price: 129.99,
    stock: 24,
    status: 'disponible',
    imageUrl: null,
  },
  {
    id: 'catalog-fallback-4',
    name: 'Samsung 990 PRO 1TB',
    description: 'SSD NVMe PCIe 4.0',
    category: 'Almacenamiento',
    brand: 'Samsung',
    price: 119.99,
    stock: 0,
    status: 'agotado',
    imageUrl: null,
  },
  {
    id: 'catalog-fallback-5',
    name: 'MSI GeForce RTX 4070 Ti VENTUS 3X',
    description: 'Tarjeta grafica 12GB',
    category: 'Tarjetas graficas',
    brand: 'MSI',
    price: 799.99,
    stock: 5,
    status: 'stock-bajo',
    imageUrl: null,
  },
  {
    id: 'catalog-fallback-6',
    name: 'Corsair RM850e 850W',
    description: 'Fuente de poder 80+ Gold',
    category: 'Fuentes de poder',
    brand: 'Corsair',
    price: 119.99,
    stock: 12,
    status: 'disponible',
    imageUrl: null,
  },
];

export const AdminCatalogoPage = () => {
  const [components, setComponents] = useState<CatalogComponent[]>([]);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | CatalogStockStatus>('todos');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedComponent, setSelectedComponent] = useState<CatalogComponent | null>(null);
  const [formValues, setFormValues] = useState<CatalogFormValues>(emptyForm);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      try {
        const response = await getCatalogComponents({ page: 1, limit: 500 });
        if (!isMounted) return;
        setComponents(response.items);
        setIsUsingFallbackData(false);
      } catch {
        if (!isMounted) return;
        setIsUsingFallbackData(true);
        setComponents(catalogFallbackComponents);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(
        components
          .map((component) => component.category.trim())
          .filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right));

    return [
      { label: 'Todas las categorias', value: 'todos' },
      ...categories.map((category) => ({ label: category, value: category })),
    ];
  }, [components]);

  const filteredComponents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return components.filter((component) => {
      const matchesSearch =
        !normalizedSearch ||
        component.name.toLowerCase().includes(normalizedSearch) ||
        component.description.toLowerCase().includes(normalizedSearch) ||
        component.brand.toLowerCase().includes(normalizedSearch);
      const matchesCategory = categoryFilter === 'todos' || component.category === categoryFilter;
      const matchesStatus = statusFilter === 'todos' || component.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, components, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredComponents.length / pageSize));
  const pageComponents = filteredComponents.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstResult = filteredComponents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResult = Math.min(currentPage * pageSize, filteredComponents.length);
  const pagesToShow = getVisiblePages(totalPages, currentPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('todos');
    setStatusFilter('todos');
    setCurrentPage(1);
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedComponent(null);
    setFormValues(emptyForm);
    setModalError('');
    setIsSaving(false);
  };

  const openCreateModal = () => {
    setModalError('');
    setFormValues(emptyForm);
    setSelectedComponent(null);
    setModalMode('create');
  };

  const openEditModal = (component: CatalogComponent) => {
    setModalError('');
    setSelectedComponent(component);
    setFormValues(mapComponentToForm(component));
    setModalMode('edit');
  };

  const openViewModal = (component: CatalogComponent) => {
    setSelectedComponent(component);
    setModalMode('view');
  };

  const openDeleteModal = (component: CatalogComponent) => {
    setModalError('');
    setSelectedComponent(component);
    setModalMode('delete');
  };

  const saveComponent = async () => {
    const price = Number(formValues.price);
    const stock = Number(formValues.stock);

    if (
      !formValues.name.trim() ||
      !formValues.category.trim() ||
      !formValues.brand.trim() ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      setModalError('Completa los campos requeridos con valores validos para guardar el componente.');
      return;
    }

    const payload: CatalogSavePayload = {
      name: formValues.name,
      description: formValues.description,
      category: formValues.category,
      brand: formValues.brand,
      price,
      stock: Math.trunc(stock),
      status: formValues.status,
      imageUrl: formValues.imageUrl || undefined,
    };

    try {
      setIsSaving(true);
      setModalError('');

      if (isUsingFallbackData) {
        if (modalMode === 'create') {
          const localCreated: CatalogComponent = {
            id: `catalog-local-${Date.now().toString(36)}`,
            name: payload.name.trim(),
            description: payload.description.trim() || 'Sin descripcion',
            category: payload.category.trim(),
            brand: payload.brand.trim(),
            price: payload.price,
            stock: payload.stock,
            status: payload.status ?? 'disponible',
            imageUrl: payload.imageUrl ?? null,
          };
          setComponents((currentComponents) => [localCreated, ...currentComponents]);
        }

        if (modalMode === 'edit' && selectedComponent) {
          setComponents((currentComponents) =>
            currentComponents.map((component) =>
              component.id === selectedComponent.id
                ? {
                    ...component,
                    name: payload.name.trim(),
                    description: payload.description.trim() || 'Sin descripcion',
                    category: payload.category.trim(),
                    brand: payload.brand.trim(),
                    price: payload.price,
                    stock: payload.stock,
                    status: payload.status ?? component.status,
                    imageUrl: payload.imageUrl ?? null,
                  }
                : component,
            ),
          );
        }

        closeModal();
        return;
      }

      if (modalMode === 'create') {
        const created = await createCatalogComponent(payload);
        setComponents((currentComponents) => [created, ...currentComponents]);
      }

      if (modalMode === 'edit' && selectedComponent) {
        const updated = await updateCatalogComponent(selectedComponent.id, payload);
        setComponents((currentComponents) =>
          currentComponents.map((component) => (component.id === selectedComponent.id ? updated : component)),
        );
      }

      closeModal();
    } catch {
      setModalError('No se pudo guardar el componente. Revisa permisos, formato de datos y endpoint del backend.');
      setIsSaving(false);
    }
  };

  const removeComponent = async () => {
    if (!selectedComponent) return;

    try {
      setIsSaving(true);
      setModalError('');

      if (isUsingFallbackData) {
        setComponents((currentComponents) =>
          currentComponents.filter((component) => component.id !== selectedComponent.id),
        );
        closeModal();
        return;
      }

      await deleteCatalogComponent(selectedComponent.id);
      setComponents((currentComponents) =>
        currentComponents.filter((component) => component.id !== selectedComponent.id),
      );
      closeModal();
    } catch {
      setModalError('No se pudo eliminar el componente. Revisa permisos y endpoint del backend.');
      setIsSaving(false);
    }
  };

  return (
    <PageCard
      title="Gestionar catalogo de componentes"
      text="Administra productos, inventario y estado de disponibilidad en una sola vista."
      icon={<PackageSearch className="h-6 w-6" />}
      actions={
        <Button type="button" className="h-10 px-4 text-sm" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Nuevo componente
        </Button>
      }
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar componente, marca o modelo..."
              className={`${fieldClass} w-full pl-10`}
            />
          </label>

          <select
            className={fieldClass}
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className={fieldClass}
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as 'todos' | CatalogStockStatus);
              setCurrentPage(1);
            }}
          >
            <option value="todos">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="stock-bajo">Stock bajo</option>
            <option value="agotado">Agotado</option>
          </select>

          <Button type="button" variant="outline" className="h-10 px-4 text-sm" onClick={resetFilters}>
            Limpiar
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.03] dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-bold">Producto</th>
                  <th className="px-4 py-3 font-bold">Categoria</th>
                  <th className="px-4 py-3 font-bold">Marca</th>
                  <th className="px-4 py-3 font-bold">Precio</th>
                  <th className="px-4 py-3 font-bold">Stock</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {pageComponents.map((component) => (
                  <tr key={component.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-100 dark:border-neutral-700 dark:bg-neutral-900">
                          {component.imageUrl ? (
                            <img src={component.imageUrl} alt={component.name} className="h-full w-full object-cover" />
                          ) : (
                            <PackageSearch className="h-4 w-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-white">{component.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">{component.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">{component.category}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">{component.brand}</td>
                    <td className="px-4 py-3 font-semibold text-teal-700 dark:text-teal-300">{formatPrice(component.price)}</td>
                    <td className={`px-4 py-3 font-semibold ${component.stock === 0 ? 'text-red-600 dark:text-red-300' : 'text-amber-600 dark:text-amber-300'}`}>
                      {component.stock}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta[component.status].className}`}>
                        {statusMeta[component.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={() => openEditModal(component)}
                          aria-label="Editar componente"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={() => openViewModal(component)}
                          aria-label="Ver componente"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 text-red-600 transition hover:border-red-500 hover:bg-red-50 hover:text-red-700 dark:border-red-500/35 dark:text-red-300 dark:hover:border-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                          onClick={() => openDeleteModal(component)}
                          aria-label="Eliminar componente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-neutral-400">
                      Cargando catalogo...
                    </td>
                  </tr>
                )}

                {!isLoading && pageComponents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-neutral-400">
                      No hay componentes para los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-neutral-800 dark:text-neutral-400 md:flex-row md:items-center md:justify-between">
            <p>
              Mostrando {firstResult} a {lastResult} de {filteredComponents.length} componentes
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

              {pagesToShow.map((page, index) =>
                page === 'ellipsis' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-slate-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={
                      page === currentPage
                        ? 'h-8 min-w-8 rounded-lg bg-teal-500 px-2 text-xs font-bold text-white'
                        : actionButtonClass
                    }
                  >
                    {page}
                  </button>
                ),
              )}

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
                className={`${fieldClass} h-8`}
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10 por pagina</option>
                <option value={20}>20 por pagina</option>
                <option value={30}>30 por pagina</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={modalMode === 'create' || modalMode === 'edit'}
        title={modalMode === 'create' ? 'Nuevo componente' : 'Editar componente'}
        text="Completa la informacion principal del producto para gestionarlo en el catalogo."
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveComponent()} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="Nombre del producto"
            value={formValues.name}
            onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
            placeholder="AMD Ryzen 7 9700X"
          />
          <FormInput
            label="Marca"
            value={formValues.brand}
            onChange={(event) => setFormValues((current) => ({ ...current, brand: event.target.value }))}
            placeholder="AMD"
          />
          <FormInput
            label="Categoria"
            value={formValues.category}
            onChange={(event) => setFormValues((current) => ({ ...current, category: event.target.value }))}
            placeholder="Procesadores"
          />
          <FormSelect
            label="Estado"
            value={formValues.status}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, status: event.target.value as CatalogStockStatus }))
            }
            options={[
              { label: 'Disponible', value: 'disponible' },
              { label: 'Stock bajo', value: 'stock-bajo' },
              { label: 'Agotado', value: 'agotado' },
            ]}
          />
          <FormInput
            label="Precio (USD)"
            value={formValues.price}
            onChange={(event) => setFormValues((current) => ({ ...current, price: event.target.value }))}
            placeholder="425.99"
            inputMode="decimal"
          />
          <FormInput
            label="Stock"
            value={formValues.stock}
            onChange={(event) => setFormValues((current) => ({ ...current, stock: event.target.value }))}
            placeholder="18"
            inputMode="numeric"
          />
          <FormInput
            label="Descripcion"
            value={formValues.description}
            onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))}
            placeholder="12 nucleos / 24 hilos"
          />
          <FormInput
            label="URL de imagen"
            value={formValues.imageUrl}
            onChange={(event) => setFormValues((current) => ({ ...current, imageUrl: event.target.value }))}
            placeholder="https://..."
            optional
          />
        </div>

        {modalError && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {modalError}
          </div>
        )}
      </Modal>

      <Modal
        open={modalMode === 'view' && Boolean(selectedComponent)}
        title="Detalle del componente"
        text="Informacion actual del producto en el catalogo."
        onClose={closeModal}
        footer={
          <Button type="button" variant="ghost" onClick={closeModal}>
            Cerrar
          </Button>
        }
      >
        {selectedComponent && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <p><span className="font-semibold">Producto:</span> {selectedComponent.name}</p>
              <p><span className="font-semibold">Marca:</span> {selectedComponent.brand}</p>
              <p><span className="font-semibold">Categoria:</span> {selectedComponent.category}</p>
              <p><span className="font-semibold">Precio:</span> {formatPrice(selectedComponent.price)}</p>
              <p><span className="font-semibold">Stock:</span> {selectedComponent.stock}</p>
              <p><span className="font-semibold">Estado:</span> {statusMeta[selectedComponent.status].label}</p>
            </div>
            <p><span className="font-semibold">Descripcion:</span> {selectedComponent.description}</p>
            {selectedComponent.imageUrl && (
              <img
                src={selectedComponent.imageUrl}
                alt={selectedComponent.name}
                className="h-44 w-full rounded-lg border border-slate-200 object-cover dark:border-neutral-700"
              />
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={modalMode === 'delete' && Boolean(selectedComponent)}
        title="Eliminar componente"
        text="Esta accion eliminara el componente del catalogo."
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void removeComponent()} disabled={isSaving}>
              {isSaving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-neutral-300">
          ¿Seguro que deseas eliminar <span className="font-semibold">{selectedComponent?.name}</span>?
        </p>

        {modalError && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {modalError}
          </div>
        )}
      </Modal>
    </PageCard>
  );
};
