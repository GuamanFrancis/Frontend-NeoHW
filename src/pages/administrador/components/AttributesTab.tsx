import { Pencil, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { Modal } from '../../../components/ui/Modal';
import type { BackendAttribute, AttributeDataType } from '../../../services/attributesService';

type AttributesTabProps = {
  globalAttributes: BackendAttribute[];
  selectedCategoryIdForAttr: string;
  setSelectedCategoryIdForAttr: (id: string) => void;
  categoryAttrs: BackendAttribute[];
  attrModalMode: 'create' | 'edit' | null;
  setAttrModalMode: (mode: 'create' | 'edit' | null) => void;
  attrForm: {
    name: string;
    slug: string;
    dataType: AttributeDataType;
    unit: string;
    optionsString: string;
  };
  attrModalError: string;
  isSavingAttr: boolean;
  attrToDelete: BackendAttribute | null;
  setAttrToDelete: (attr: BackendAttribute | null) => void;
  attrToDisassociate: BackendAttribute | null;
  setAttrToDisassociate: (attr: BackendAttribute | null) => void;
  categorySelectOptions: Array<{ label: string; value: string }>;
  openEditAttrModal: (attr: BackendAttribute) => void;
  saveAttribute: () => void;
  removeAttribute: (attr: BackendAttribute) => void;
  handleConfirmDeleteAttribute: () => void;
  associateAttr: (id: string) => void;
  disassociateAttr: (attr: BackendAttribute) => void;
  handleConfirmDisassociateAttribute: () => void;
  attrErrors: {
    name?: string;
    unit?: string;
    optionsString?: string;
  };
  updateAttrFormField: (field: 'name' | 'unit' | 'optionsString' | 'dataType', value: any) => void;
};

export const AttributesTab = ({
  globalAttributes,
  selectedCategoryIdForAttr,
  setSelectedCategoryIdForAttr,
  categoryAttrs,
  attrModalMode,
  setAttrModalMode,
  attrForm,
  attrModalError,
  isSavingAttr,
  attrToDelete,
  setAttrToDelete,
  attrToDisassociate,
  setAttrToDisassociate,
  categorySelectOptions,
  openEditAttrModal,
  saveAttribute,
  removeAttribute,
  handleConfirmDeleteAttribute,
  associateAttr,
  disassociateAttr,
  handleConfirmDisassociateAttribute,
  attrErrors,
  updateAttrFormField,
}: AttributesTabProps) => {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-955 dark:text-white">Atributos Globales</h3>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 uppercase text-slate-955 dark:bg-white/[0.02] dark:text-white">
                <tr>
                  <th className="px-3 py-2 font-bold">Atributo</th>
                  <th className="px-3 py-2 font-bold">Slug</th>
                  <th className="px-3 py-2 font-bold">Tipo de Dato</th>
                  <th className="px-3 py-2 font-bold">Unidad</th>
                  <th className="px-3 py-2 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {globalAttributes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-slate-955 dark:text-white">
                      No hay atributos globales registrados.
                    </td>
                  </tr>
                ) : (
                  globalAttributes.map((attr) => (
                    <tr key={attr.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-semibold text-slate-955 dark:text-white">{attr.name}</td>
                      <td className="px-3 py-2 text-slate-955 dark:text-white">{attr.slug}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">
                          {attr.dataType}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-955 dark:text-white">{attr.unit ?? '-'}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditAttrModal(attr)}
                            className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-750 transition hover:border-teal-500/60 hover:bg-teal-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 cursor-pointer group"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4 text-slate-750 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAttribute(attr)}
                            className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-rose-500 transition hover:border-rose-500/50 hover:bg-rose-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-950/20 cursor-pointer group"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-rose-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
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

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">Paso 1: Selecciona una Categoría</h3>
            <FormSelect
              label="Categoría"
              value={selectedCategoryIdForAttr}
              onChange={(e) => setSelectedCategoryIdForAttr(e.target.value)}
              options={categorySelectOptions}
            />
          </div>

          {selectedCategoryIdForAttr && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="mb-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Paso 2: Especificaciones de Categoría</h3>
                  <p className="text-sm text-slate-955 dark:text-white mt-1">Vincula o remueve atributos de esta categoría de hardware.</p>
              </div>

              <div className="border-t border-slate-100 dark:border-neutral-900 pt-3 mb-4">
                <h4 className="text-sm font-bold text-slate-955 dark:text-white uppercase mb-2">Atributos Vinculados</h4>
                <div className="grid gap-2">
                  {categoryAttrs.length === 0 ? (
                    <p className="text-sm text-slate-955 dark:text-white text-center py-2">Ningún atributo vinculado a esta categoría.</p>
                  ) : (
                    categoryAttrs.map(attr => (
                      <div key={attr.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-1.5 dark:border-neutral-800">
                        <span className="text-sm font-bold text-slate-955 dark:text-white">{attr.name} <span className="text-xs text-slate-900 dark:text-neutral-350">({attr.dataType})</span></span>
                        <button
                          type="button"
                          onClick={() => disassociateAttr(attr)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-rose-500 hover:border-rose-500/50 hover:bg-rose-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-950/20 cursor-pointer group"
                          title="Desasociar"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-neutral-900 pt-3">
                <h4 className="text-sm font-bold text-slate-955 dark:text-white uppercase mb-2">Asociar Nuevo Atributo</h4>
                <div className="grid gap-2">
                  {globalAttributes
                    .filter(attr => !categoryAttrs.some(ca => ca.id === attr.id))
                    .map(attr => (
                      <button
                        key={attr.id}
                        type="button"
                        onClick={() => void associateAttr(attr.id)}
                        className="flex items-center justify-between rounded-lg border border-dashed border-slate-350 px-3 py-1.5 text-left text-sm hover:border-teal-500 hover:bg-teal-50/10 dark:border-neutral-700 dark:hover:border-teal-400 transition cursor-pointer"
                      >
                        <span className="font-semibold text-slate-700 dark:text-neutral-300">{attr.name}</span>
                        <Plus className="h-3 w-3 text-slate-400" />
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={attrModalMode !== null}
        title={attrModalMode === 'create' ? 'Nuevo Atributo Técnico' : 'Editar Atributo Técnico'}
        onClose={() => setAttrModalMode(null)}
        className="max-w-3xl p-6 md:p-8"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setAttrModalMode(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="outlineHoverSolid" onClick={() => void saveAttribute()} disabled={isSavingAttr}>
              {isSavingAttr ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <p className="text-sm font-normal text-slate-500 dark:text-neutral-400 mb-4">
          Define las propiedades del atributo técnico global.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="Nombre del atributo"
            value={attrForm.name}
            onChange={(e) => updateAttrFormField('name', e.target.value)}
            placeholder="Socket, Frecuencia, Capacidad"
            error={attrErrors.name}
          />
          <FormSelect
            label="Tipo de Dato"
            value={attrForm.dataType}
            onChange={(e) => updateAttrFormField('dataType', e.target.value)}
            options={[
              { label: 'Texto', value: 'TEXT' },
              { label: 'Número', value: 'NUMBER' },
              { label: 'Booleano (Sí/No)', value: 'BOOLEAN' },
              { label: 'Desplegable (Select)', value: 'SELECT' },
              { label: 'Desplegable Múltiple', value: 'MULTI_SELECT' },
            ]}
          />
          <FormInput
            label="Unidad (opcional)"
            value={attrForm.unit}
            onChange={(e) => updateAttrFormField('unit', e.target.value)}
            placeholder="GB, MHz, W, etc."
            optional
            error={attrErrors.unit}
          />
          {['SELECT', 'MULTI_SELECT'].includes(attrForm.dataType) && (
            <div className="md:col-span-2">
              <FormInput
                label="Opciones (separadas por comas)"
                value={attrForm.optionsString}
                onChange={(e) => updateAttrFormField('optionsString', e.target.value)}
                placeholder="AM4, AM5, LGA1700"
                error={attrErrors.optionsString}
              />
            </div>
          )}
        </div>
        {attrModalError && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {attrModalError}
          </div>
        )}
      </Modal>

      <Modal
        open={!!attrToDelete}
        title="¿Eliminar Atributo Global?"
        onClose={() => setAttrToDelete(null)}
        className="max-w-3xl p-6 md:p-8"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                ¿Estás seguro de que deseas eliminar este atributo global?
              </p>
              <p className="text-sm font-normal text-slate-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                Esta acción no se puede deshacer y desvinculará este atributo de todas las categorías y componentes que lo utilicen. El atributo "{attrToDelete?.name}" se borrará permanentemente.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAttrToDelete(null)}
            >
              Cancelar
            </Button>
            <button
              type="button"
              onClick={() => void handleConfirmDeleteAttribute()}
              className="rounded-lg border border-red-500 text-red-500 bg-transparent hover:bg-red-500 hover:text-white dark:border-red-400 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white px-5 py-2.5 font-bold transition text-base shadow-sm cursor-pointer"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!attrToDisassociate}
        title="¿Desasociar Atributo?"
        onClose={() => setAttrToDisassociate(null)}
        className="max-w-3xl p-6 md:p-8"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                ¿Estás seguro de que deseas desasociar este atributo?
              </p>
              <p className="text-sm font-normal text-slate-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                El atributo "{attrToDisassociate?.name}" dejará de estar disponible para rellenar en los componentes de esta categoría. Los valores existentes en los productos no se verán afectados.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAttrToDisassociate(null)}
            >
              Cancelar
            </Button>
            <button
              type="button"
              onClick={() => void handleConfirmDisassociateAttribute()}
              className="rounded-lg border border-amber-500 text-amber-600 bg-transparent hover:bg-amber-500 hover:text-white dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-400 dark:hover:text-neutral-950 px-5 py-2.5 font-bold transition text-base shadow-sm cursor-pointer"
            >
              Desasociar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
