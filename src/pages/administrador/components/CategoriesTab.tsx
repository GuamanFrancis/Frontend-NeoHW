import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { Modal } from '../../../components/ui/Modal';
import type { BackendCategory } from '../../../types/catalog';

type CategoriesTabProps = {
  categories: BackendCategory[];
  catModalMode: 'create' | null;
  setCatModalMode: (mode: 'create' | null) => void;
  isSavingCat: boolean;
  catModalError: string;
  catToDelete: BackendCategory | null;
  setCatToDelete: (cat: BackendCategory | null) => void;
  catForm: {
    name: string;
    description: string;
    parentId: string;
  };
  setCatForm: React.Dispatch<React.SetStateAction<{
    name: string;
    description: string;
    parentId: string;
  }>>;
  saveCategoryAction: () => void;
  deleteCategoryAction: (cat: BackendCategory) => void;
  handleConfirmDeleteCategory: () => void;
};

export const CategoriesTab = ({
  categories,
  catModalMode,
  setCatModalMode,
  isSavingCat,
  catModalError,
  catToDelete,
  setCatToDelete,
  catForm,
  setCatForm,
  saveCategoryAction,
  deleteCategoryAction,
  handleConfirmDeleteCategory,
}: CategoriesTabProps) => {
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-950 dark:text-white leading-none">Categorías de Hardware</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 font-medium">Gestiona la clasificación del hardware en la tienda (Procesadores, Memorias RAM, etc.).</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 mt-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.03] dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-bold">Categoría</th>
                  <th className="px-4 py-3 font-bold">Slug</th>
                  <th className="px-4 py-3 font-bold">Descripción</th>
                  <th className="px-4 py-3 font-bold">Categoría Padre</th>
                  <th className="px-4 py-3 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-neutral-400">
                      No hay categorías registradas en la base de datos.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-semibold text-slate-950 dark:text-white">
                        {cat.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                        {cat.slug}
                      </td>
                      <td className="px-4 py-3 text-slate-650 dark:text-neutral-350">
                        {cat.description || 'Sin descripción'}
                      </td>
                      <td className="px-4 py-3 text-slate-655 dark:text-neutral-450 font-medium">
                        {cat.parentId ? categories.find(c => c.id === cat.parentId)?.name || 'Categoría superior' : 'Ninguna'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 text-red-600 transition hover:border-red-500 hover:bg-red-50 hover:text-red-700 dark:border-red-500/35 dark:text-red-300 dark:hover:border-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                            onClick={() => deleteCategoryAction(cat)}
                            aria-label="Desactivar categoría"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={catModalMode === 'create'}
        title="Nueva Categoría de Hardware"
        text="Define las propiedades de la nueva categoría para clasificar el hardware de la tienda."
        onClose={() => setCatModalMode(null)}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setCatModalMode(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveCategoryAction()} disabled={isSavingCat}>
              {isSavingCat ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormInput
              label="Nombre de la categoría"
              value={catForm.name}
              onChange={(e) => setCatForm(curr => ({ ...curr, name: e.target.value }))}
              placeholder="Ej: Tarjetas de Video, Procesadores"
            />
          </div>
          <div className="md:col-span-2">
            <FormInput
              label="Descripción (opcional)"
              value={catForm.description}
              onChange={(e) => setCatForm(curr => ({ ...curr, description: e.target.value }))}
              placeholder="Ej: Unidades de procesamiento gráfico de alto rendimiento."
            />
          </div>
          <div className="md:col-span-2">
            <FormSelect
              label="Categoría Padre (opcional para subcategorías)"
              value={catForm.parentId}
              onChange={(e) => setCatForm(curr => ({ ...curr, parentId: e.target.value }))}
              options={[
                { label: 'Ninguna (Categoría principal)', value: '' },
                ...categories.map(cat => ({ label: cat.name, value: cat.id }))
              ]}
            />
          </div>
        </div>
        {catModalError && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {catModalError}
          </div>
        )}
      </Modal>

      <Modal
        open={!!catToDelete}
        title="¿Desactivar Categoría?"
        onClose={() => setCatToDelete(null)}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                ¿Estás seguro de que deseas desactivar esta categoría?
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Esta acción ocultará la categoría del catálogo. Los productos asociados seguirán existiendo pero no se listarán bajo esta categoría. La categoría "{catToDelete?.name}" se desactivará temporalmente.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCatToDelete(null)}
            >
              Cancelar
            </Button>
            <button
              type="button"
              onClick={() => void handleConfirmDeleteCategory()}
              className="rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 transition text-xs shadow-sm"
            >
              Sí, desactivar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
