import { Eye, PackageSearch, Pencil, Trash2 } from 'lucide-react';
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
  setFormValues: React.Dispatch<React.SetStateAction<CatalogFormValues>>;
  selectedComponent: CatalogComponent | null;
  categorySelectOptions: Array<{ label: string; value: string }>;
  categoryAttributesToFill: BackendAttribute[];
  productAttributesValues: Record<string, string>;
  setProductAttributesValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  resetFilters: () => void;
  closeModal: () => void;
  openEditModal: (c: CatalogComponent) => void;
  openViewModal: (c: CatalogComponent) => void;
  openDeleteModal: (c: CatalogComponent) => void;
  handleCategoryChange: (id: string) => void;
  saveComponent: () => void;
  removeComponent: () => void;
  categoryFilterOptions: Array<{ label: string; value: string }>;
};

const fieldClass =
  'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:border-teal-400 dark:disabled:bg-neutral-900';

const actionButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-teal-500/60 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 dark:hover:text-teal-200';

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
  setFormValues,
  selectedComponent,
  categorySelectOptions,
  categoryAttributesToFill,
  productAttributesValues,
  setProductAttributesValues,
  resetFilters,
  closeModal,
  openEditModal,
  openViewModal,
  openDeleteModal,
  handleCategoryChange,
  saveComponent,
  removeComponent,
  categoryFilterOptions,
}: CatalogTabProps) => {
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
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.03] dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-bold">Producto</th>
                  <th className="px-4 py-3 font-bold">Categoría</th>
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
                          onClick={() => void openEditModal(component)}
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
            <FormSelect
              label="Categoria"
              value={formValues.categoryId}
              onChange={(event) => void handleCategoryChange(event.target.value)}
              options={categorySelectOptions}
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
              disabled={modalMode === 'edit'}
              title={modalMode === 'edit' ? "El stock solo puede ser modificado por el Vendedor desde la pestaña de Inventario." : undefined}
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
            />
            
            {categoryAttributesToFill.length > 0 && (
              <div className="md:col-span-2 border-t border-slate-100 dark:border-neutral-800 pt-4 mt-2">
                <h4 className="text-xs font-bold text-teal-500 dark:text-teal-400 uppercase mb-3">Especificaciones Técnicas</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {categoryAttributesToFill.map(attr => {
                    const val = productAttributesValues[attr.id] ?? '';
                    const onChangeVal = (v: string) => {
                      setProductAttributesValues(curr => ({ ...curr, [attr.id]: v }));
                    };
                    
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
                          onChange={(e) => onChangeVal(e.target.value)}
                          options={options}
                        />
                      );
                    }
                    
                    if (attr.dataType === 'BOOLEAN') {
                      return (
                        <FormSelect
                          key={attr.id}
                          label={`${attr.name}`}
                          value={val}
                          onChange={(e) => onChangeVal(e.target.value)}
                          options={[
                            { label: 'Seleccionar', value: '' },
                            { label: 'Sí', value: 'true' },
                            { label: 'No', value: 'false' },
                          ]}
                        />
                      );
                    }
                    
                    return (
                      <FormInput
                        key={attr.id}
                        label={`${attr.name}${attr.unit ? ` (${attr.unit})` : ''}`}
                        value={val}
                        onChange={(e) => onChangeVal(e.target.value)}
                        placeholder={`Ingresa ${attr.name.toLowerCase()}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
            {selectedComponent.attributes && selectedComponent.attributes.length > 0 && (
              <div className="border-t border-slate-100 dark:border-neutral-800 pt-3">
                <p className="font-semibold mb-1">Especificaciones Técnicas:</p>
                <div className="grid gap-2 grid-cols-2 text-xs bg-slate-50 dark:bg-neutral-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-neutral-800">
                  {selectedComponent.attributes.map((attr, idx) => (
                    <div key={idx} className="flex justify-between border-b border-slate-200/50 dark:border-neutral-800/50 pb-1">
                      <span className="text-slate-500">{attr.name}</span>
                      <span className="font-bold text-slate-800 dark:text-neutral-250">{attr.value} {attr.unit || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
    </>
  );
};
