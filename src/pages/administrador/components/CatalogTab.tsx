import { useState } from 'react';
import { Eye, PackageSearch, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { Modal } from '../../../components/ui/Modal';
import type { CatalogComponent, CatalogStockStatus } from '../../../types/catalog';
import {
  statusMeta,
  formatPrice,
  type CatalogFormValues,
  type ModalMode,
} from '../hooks/useAdminCatalog';
import type { BackendAttribute } from '../../../services/attributesService';
import { getProductImageUrl } from '../../../services/api';

const statusTextStyles: Record<CatalogStockStatus, string> = {
  disponible: 'text-emerald-600 dark:text-emerald-400',
  'stock-bajo': 'text-amber-600 dark:text-amber-400',
  agotado: 'text-rose-600 dark:text-rose-400',
};

type CatalogTabProps = {
  search: string;
  setSearch: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (s: string) => void;
  statusFilter: 'todos' | CatalogStockStatus;
  setStatusFilter: (s: 'todos' | CatalogStockStatus) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  currentPage: number;
  setCurrentPage: (n: number | ((prev: number) => number)) => void;
  pageComponents: CatalogComponent[];
  filteredComponents: CatalogComponent[];
  firstResult: number;
  lastResult: number;
  totalPages: number;
  pagesToShow: Array<number | 'ellipsis'>;
  isLoading: boolean;
  isSaving: boolean;
  modalMode: ModalMode;
  modalError: string;
  formValues: CatalogFormValues;
  selectedComponent: CatalogComponent | null;
  categorySelectOptions: Array<{ label: string; value: string }>;
  categoryAttributesToFill: BackendAttribute[];
  productAttributesValues: Record<string, string>;
  resetFilters: () => void;
  closeModal: () => void;
  openEditModal: (c: CatalogComponent) => void;
  openViewModal: (c: CatalogComponent) => void;
  openDeleteModal: (c: CatalogComponent) => void;
  handleCategoryChange: (id: string) => void;
  saveComponent: () => void;
  removeComponent: () => void;
  categoryFilterOptions: Array<{ label: string; value: string }>;
  formErrors: {
    name?: string;
    brand?: string;
    categoryId?: string;
    price?: string;
    stock?: string;
    description?: string;
    imageUrl?: string;
  };
  updateFormField: (field: keyof CatalogFormValues, value: string) => void;
  attributeErrors: Record<string, string>;
  updateAttributeValue: (attributeId: string, value: string) => void;
};

const fieldClass =
  'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:border-teal-400 dark:disabled:bg-neutral-900';

const actionButtonClass =
  'flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-teal-500/60 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 dark:hover:text-teal-200 cursor-pointer';

export const CatalogTab = ({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  pageComponents,
  filteredComponents,
  firstResult,
  lastResult,
  totalPages,
  pagesToShow,
  isLoading,
  isSaving,
  modalMode,
  modalError,
  formValues,
  selectedComponent,
  categorySelectOptions,
  categoryAttributesToFill,
  productAttributesValues,
  resetFilters,
  closeModal,
  openEditModal,
  openViewModal,
  openDeleteModal,
  handleCategoryChange,
  saveComponent,
  removeComponent,
  categoryFilterOptions,
  formErrors,
  updateFormField,
  attributeErrors,
  updateAttributeValue,
}: CatalogTabProps) => {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto]">
          <label className="relative">
            <PackageSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar componente o modelo..."
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
            {categoryFilterOptions.map((option) => (
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
              <thead className="bg-slate-50 text-sm uppercase tracking-wider text-slate-900 dark:bg-white/[0.02] dark:text-white border-b border-slate-200 dark:border-neutral-800">
                <tr>
                  <th className="px-5 py-4 font-bold">Producto</th>
                  <th className="px-5 py-4 font-bold">Categoría</th>
                  <th className="px-5 py-4 font-bold">Precio</th>
                  <th className="px-5 py-4 font-bold">Stock</th>
                  <th className="px-5 py-4 font-bold">Estado</th>
                  <th className="px-5 py-4 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {pageComponents.map((component) => (
                  <tr key={component.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-100 dark:border-neutral-700 dark:bg-neutral-900">
                          <img
                            src={(!failedImages[component.id] && component.imageUrl) ? component.imageUrl : '/favicon.jpg'}
                            alt={component.name}
                            className="h-full w-full object-cover"
                            onError={() => {
                              if (component.imageUrl && component.imageUrl !== '/favicon.jpg') {
                                setFailedImages((prev) => ({ ...prev, [component.id]: true }));
                              }
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-955 dark:text-white">{component.name}</p>
                          <p className="mt-1 text-sm font-normal text-slate-955 dark:text-white leading-relaxed">{component.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-955 dark:text-white">{component.category}</td>
                    <td className="px-5 py-4 font-bold text-sm text-slate-955 dark:text-white">{formatPrice(component.price)}</td>
                    <td className="px-5 py-4 font-normal text-sm text-slate-955 dark:text-white">
                      {component.stock}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-semibold ${statusTextStyles[component.status]}`}>
                        {statusMeta[component.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2.5">
                        <button
                          type="button"
                          className={`${actionButtonClass} group`}
                          onClick={() => void openEditModal(component)}
                          aria-label="Editar componente"
                        >
                          <Pencil className="h-5.5 w-5.5 text-slate-705 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors" />
                        </button>
                        <button
                          type="button"
                          className={`${actionButtonClass} group`}
                          onClick={() => openViewModal(component)}
                          aria-label="Ver componente"
                        >
                          <Eye className="h-5.5 w-5.5 text-slate-705 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors" />
                        </button>
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-rose-500/50 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 cursor-pointer group"
                          onClick={() => openDeleteModal(component)}
                          aria-label="Eliminar componente"
                        >
                          <Trash2 className="h-5.5 w-5.5 text-rose-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-955 dark:text-white">
                      Cargando catalogo...
                    </td>
                  </tr>
                )}

                {!isLoading && pageComponents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-955 dark:text-white">
                      No hay componentes para los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-955 dark:border-neutral-800 dark:text-white md:flex-row md:items-center md:justify-between">
            <div className="hidden" data-results={`${firstResult}-${lastResult}-${filteredComponents.length}`} />


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
                )
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
        onClose={closeModal}
        className="max-w-3xl p-6 md:p-8"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="button" variant="outlineHoverSolid" onClick={() => void saveComponent()} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <style>{`
          .scrollbar-none::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-none {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-none">
          <p className="text-sm font-normal text-slate-955 dark:text-white mb-4">
            Completa la información principal del producto para gestionarlo en el catálogo.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Nombre del producto"
              value={formValues.name}
              onChange={(event) => updateFormField('name', event.target.value)}
              placeholder="AMD Ryzen 7 9700X"
              error={formErrors.name}
            />
            <FormInput
              label="Marca"
              value={formValues.brand}
              onChange={(event) => updateFormField('brand', event.target.value)}
              placeholder="Ej: ID-COOLING, ASUS, Corsair"
              error={formErrors.brand}
            />

            <FormSelect
              label="Categoria"
              value={formValues.categoryId}
              onChange={(event) => void handleCategoryChange(event.target.value)}
              options={categorySelectOptions}
              error={formErrors.categoryId}
            />
            <FormInput
              label="Precio (USD)"
              value={formValues.price}
              onChange={(event) => updateFormField('price', event.target.value)}
              placeholder="425.99"
              inputMode="decimal"
              error={formErrors.price}
            />
            <FormInput
              label="Stock"
              value={formValues.stock}
              onChange={(event) => updateFormField('stock', event.target.value)}
              placeholder="18"
              inputMode="numeric"
              disabled={modalMode === 'edit'}
              title={modalMode === 'edit' ? "El stock solo puede ser modificado por el Vendedor desde la pestaña de Inventario." : undefined}
              error={formErrors.stock}
            />
            <FormInput
              label="Descripcion"
              value={formValues.description}
              onChange={(event) => updateFormField('description', event.target.value)}
              placeholder="12 nucleos / 24 hilos"
              error={formErrors.description}
            />
            <FormInput
              label="URL de imagen"
              value={formValues.imageUrl}
              onChange={(event) => updateFormField('imageUrl', event.target.value)}
              placeholder="https://..."
              error={formErrors.imageUrl}
            />
            {formValues.imageUrl && (
              <div className="md:col-span-2 mt-2 flex flex-col items-center justify-center p-2 border border-slate-200 dark:border-neutral-800 rounded-lg bg-slate-50 dark:bg-neutral-900/60">
                <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 mb-1">Vista previa de imagen:</span>
                <img
                  src={getProductImageUrl(formValues.imageUrl.trim())}
                  alt="Vista previa del componente"
                  className="max-h-24 object-contain rounded-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/favicon.jpg';
                  }}
                />
              </div>
            )}
            
            {categoryAttributesToFill.length > 0 && (
              <div className="md:col-span-2 border-t border-slate-100 dark:border-neutral-800 pt-4 mt-2">
                <h4 className="text-xs font-bold text-teal-500 dark:text-teal-400 uppercase mb-3">Especificaciones Técnicas</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {categoryAttributesToFill.map(attr => {
                    const val = productAttributesValues[attr.id] ?? '';
                    
                    if (attr.dataType === 'SELECT' || attr.dataType === 'MULTI_SELECT') {
                      const options = [
                        { label: `Selecciona ${attr.name}`, value: '' },
                        ...(attr.options || []).map(opt => ({ label: opt, value: opt }))
                      ];
                      return (
                        <FormSelect
                          key={attr.id}
                          label={`${attr.name}${attr.unit ? ` (${attr.unit})` : ''}`}
                          value={val}
                          onChange={(e) => updateAttributeValue(attr.id, e.target.value)}
                          options={options}
                          error={attributeErrors[attr.id]}
                        />
                      );
                    }
                    
                    if (attr.dataType === 'BOOLEAN') {
                      return (
                        <FormSelect
                          key={attr.id}
                          label={`${attr.name}`}
                          value={val}
                          onChange={(e) => updateAttributeValue(attr.id, e.target.value)}
                          options={[
                            { label: 'Seleccionar', value: '' },
                            { label: 'Sí', value: 'true' },
                            { label: 'No', value: 'false' },
                          ]}
                          error={attributeErrors[attr.id]}
                        />
                      );
                    }
                    
                    return (
                      <FormInput
                        key={attr.id}
                        label={`${attr.name}${attr.unit ? ` (${attr.unit})` : ''}`}
                        value={val}
                        onChange={(e) => updateAttributeValue(attr.id, e.target.value)}
                        placeholder={`Ingresa ${attr.name.toLowerCase()}`}
                        error={attributeErrors[attr.id]}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {modalError && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
            {modalError}
          </div>
        )}
      </Modal>

      <Modal
        open={modalMode === 'view' && Boolean(selectedComponent)}
        title="Detalles de Componente"
        onClose={closeModal}
        className="max-w-3xl p-6 md:p-8"
      >
        {selectedComponent && (
          <div className="space-y-6 text-slate-900 dark:text-white max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
            <div className="flex flex-col gap-4 sm:flex-row items-center sm:items-start gap-6">
              <div className="h-28 w-28 shrink-0 flex items-center justify-center rounded-xl border border-slate-150 bg-slate-50 p-2 dark:border-neutral-800 dark:bg-neutral-900/60">
                <img
                  src={(!failedImages[selectedComponent.id] && selectedComponent.imageUrl) ? selectedComponent.imageUrl : '/favicon.jpg'}
                  alt={selectedComponent.name}
                  className="max-h-full max-w-full object-contain animate-fade-in"
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
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white text-base">Stock actual</span>
                    <span className="block font-normal text-slate-955 dark:text-white text-base mt-0.5">{selectedComponent.stock} unidades</span>
                  </div>
                </div>
              </div>
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

            <div>
              <span className="block font-bold uppercase tracking-wider text-slate-955 dark:text-white text-sm">Descripción</span>
              <p className="text-base text-slate-955 dark:text-white leading-relaxed font-normal mt-2">
                {selectedComponent.description || 'Sin descripción'}
              </p>
            </div>

            <div className="border-t border-slate-150 dark:border-neutral-800" />

            <div className="flex items-center justify-between">
              <div>
                <span className="block font-bold uppercase tracking-wider text-slate-955 dark:text-white text-sm">Precio</span>
                <span className="block text-2xl font-semibold text-slate-955 dark:text-white mt-1">{formatPrice(selectedComponent.price)}</span>
              </div>
              <div className="text-right">
                <span className="block font-bold uppercase tracking-wider text-slate-955 dark:text-white text-sm">Estado</span>
                <span className={`block text-lg font-semibold mt-1 ${statusTextStyles[selectedComponent.status]}`}>
                  {statusMeta[selectedComponent.status].label}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" onClick={closeModal} variant="outlineHoverSolid" className="h-11 px-6 font-bold text-sm">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={modalMode === 'delete' && Boolean(selectedComponent)}
        title="¿Eliminar Componente?"
        onClose={closeModal}
        className="max-w-3xl p-6 md:p-8"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                ¿Estás seguro de que deseas eliminar este componente del catálogo?
              </p>
              <p className="text-sm font-normal text-slate-955 dark:text-white mt-1.5 leading-relaxed">
                Esta acción es permanente y retirará el producto "{selectedComponent?.name}" de la tienda y del catálogo general de componentes.
              </p>
            </div>
          </div>
          {modalError && (
            <div className="mt-2 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
              {modalError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <button
              type="button"
              onClick={() => void removeComponent()}
              className="rounded-lg border border-red-500 text-red-500 bg-transparent hover:bg-red-500 hover:text-white dark:border-red-400 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white px-5 py-2.5 font-bold transition text-base shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
