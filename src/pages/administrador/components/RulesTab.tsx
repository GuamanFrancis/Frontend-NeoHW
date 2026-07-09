import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { Modal } from '../../../components/ui/Modal';
import type { CompatibilityRule } from '../../../services/compatibilityService';
import type { BackendAttribute } from '../../../services/attributesService';

type RulesTabProps = {
  compatibilityRulesList: CompatibilityRule[];
  ruleModalMode: 'create' | null;
  setRuleModalMode: (mode: 'create' | null) => void;
  isSavingRule: boolean;
  ruleModalError: string;
  ruleToDelete: CompatibilityRule | null;
  setRuleToDelete: (rule: CompatibilityRule | null) => void;
  ruleForm: {
    name: string;
    description: string;
    sourceAttributeId: string;
    targetAttributeId: string;
    ruleType: 'MUST_MATCH' | 'RANGE_CHECK' | 'POWER_SUFFICIENT' | 'CUSTOM';
    operator: string;
  };
  setRuleForm: React.Dispatch<React.SetStateAction<{
    name: string;
    description: string;
    sourceAttributeId: string;
    targetAttributeId: string;
    ruleType: 'MUST_MATCH' | 'RANGE_CHECK' | 'POWER_SUFFICIENT' | 'CUSTOM';
    operator: string;
  }>>;
  globalAttributes: BackendAttribute[];
  saveCompatibilityRuleAction: () => void;
  deleteCompatibilityRuleAction: (rule: CompatibilityRule) => void;
  handleConfirmDeleteRule: () => void;
};

export const RulesTab = ({
  compatibilityRulesList,
  ruleModalMode,
  setRuleModalMode,
  isSavingRule,
  ruleModalError,
  ruleToDelete,
  setRuleToDelete,
  ruleForm,
  setRuleForm,
  globalAttributes,
  saveCompatibilityRuleAction,
  deleteCompatibilityRuleAction,
  handleConfirmDeleteRule,
}: RulesTabProps) => {
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-955 dark:text-white leading-none">Reglas de Compatibilidad</h3>
          <p className="text-sm text-slate-955 dark:text-white mt-1 font-normal">Gestiona las reglas de hardware que usa el Simulador 3D para evitar ensambles incompatibles.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 mt-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-955 dark:bg-white/[0.03] dark:text-white">
                <tr>
                  <th className="px-4 py-3 font-bold">Regla</th>
                  <th className="px-4 py-3 font-bold">Tipo</th>
                  <th className="px-4 py-3 font-bold">Atributo Origen</th>
                  <th className="px-4 py-3 font-bold">Atributo Destino</th>
                  <th className="px-4 py-3 font-bold">Operador</th>
                  <th className="px-4 py-3 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {compatibilityRulesList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-955 dark:text-white">
                      No hay reglas de compatibilidad registradas en la base de datos.
                    </td>
                  </tr>
                ) : (
                  compatibilityRulesList.map((rule) => (
                    <tr key={rule.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-955 dark:text-white">{rule.name}</p>
                        {rule.description && (
                          <p className="mt-0.5 text-xs text-slate-955 dark:text-white">{rule.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                          {rule.ruleType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-955 dark:text-white">
                        {rule.sourceAttributeName || 'Atributo origen'}
                      </td>
                      <td className="px-4 py-3 text-slate-955 dark:text-white">
                        {rule.targetAttributeName || 'Atributo destino'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-955 dark:text-white">
                        {rule.comparisonOperator || 'Igualdad'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-750 transition hover:border-rose-500/50 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 cursor-pointer group"
                            onClick={() => deleteCompatibilityRuleAction(rule)}
                            aria-label="Desactivar regla"
                          >
                            <Trash2 className="h-4 w-4 text-rose-500 group-hover:text-rose-600 dark:group-hover:text-rose-450 transition-colors" />
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
        open={ruleModalMode === 'create'}
        title="Nueva Regla de Compatibilidad"
        onClose={() => setRuleModalMode(null)}
        className="max-w-3xl p-6 md:p-8"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setRuleModalMode(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="outlineHoverSolid" onClick={() => void saveCompatibilityRuleAction()} disabled={isSavingRule}>
              {isSavingRule ? 'Creando...' : 'Crear Regla'}
            </Button>
          </>
        }
      >
        <p className="text-sm font-normal text-slate-955 dark:text-white mb-4">
          Crea una regla lógica de compatibilidad de hardware para el simulador.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormInput
              label="Nombre de la regla"
              value={ruleForm.name}
              onChange={(e) => setRuleForm(curr => ({ ...curr, name: e.target.value }))}
              placeholder="Ej: Compatibilidad de Socket AM5"
            />
          </div>
          <div className="md:col-span-2">
            <FormInput
              label="Descripción (opcional)"
              value={ruleForm.description}
              onChange={(e) => setRuleForm(curr => ({ ...curr, description: e.target.value }))}
              placeholder="Ej: Asegura que el procesador y la placa madre tengan el mismo tipo de socket."
            />
          </div>
          <FormSelect
            label="Atributo Origen (Ej: Placa Madre Socket)"
            value={ruleForm.sourceAttributeId}
            onChange={(e) => setRuleForm(curr => ({ ...curr, sourceAttributeId: e.target.value }))}
            options={[
              { label: 'Seleccionar atributo', value: '' },
              ...globalAttributes.map(attr => ({ label: attr.name, value: attr.id }))
            ]}
          />
          <FormSelect
            label="Atributo Destino (Ej: CPU Socket)"
            value={ruleForm.targetAttributeId}
            onChange={(e) => setRuleForm(curr => ({ ...curr, targetAttributeId: e.target.value }))}
            options={[
              { label: 'Seleccionar atributo', value: '' },
              ...globalAttributes.map(attr => ({ label: attr.name, value: attr.id }))
            ]}
          />
          <FormSelect
            label="Tipo de Regla"
            value={ruleForm.ruleType}
            onChange={(e) => setRuleForm(curr => ({ ...curr, ruleType: e.target.value as any }))}
            options={[
              { label: 'Coincidir exactamente (MUST_MATCH)', value: 'MUST_MATCH' },
              { label: 'Verificar rango (RANGE_CHECK)', value: 'RANGE_CHECK' },
              { label: 'Energía suficiente (POWER_SUFFICIENT)', value: 'POWER_SUFFICIENT' },
              { label: 'Lógica personalizada (CUSTOM)', value: 'CUSTOM' },
            ]}
          />
          <FormSelect
            label="Operador de comparación"
            value={ruleForm.operator}
            onChange={(e) => setRuleForm(curr => ({ ...curr, operator: e.target.value }))}
            options={[
              { label: 'Igual (=)', value: 'EQUALS' },
              { label: 'Mayor o igual (>=)', value: 'GREATER_THAN_OR_EQUAL' },
              { label: 'Menor o igual (<=)', value: 'LESS_THAN_OR_EQUAL' },
            ]}
          />
        </div>
        {ruleModalError && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
            {ruleModalError}
          </div>
        )}
      </Modal>

      <Modal
        open={!!ruleToDelete}
        title="¿Desactivar Regla de Compatibilidad?"
        onClose={() => setRuleToDelete(null)}
        className="max-w-3xl p-6 md:p-8"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                ¿Estás seguro de que deseas desactivar esta regla?
              </p>
              <p className="text-sm font-normal text-slate-955 dark:text-white mt-1.5 leading-relaxed">
                Esta acción evitará que el Simulador 3D valide esta restricción de hardware en tiempo real. La regla "{ruleToDelete?.name}" se removerá del motor de validaciones.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRuleToDelete(null)}
            >
              Cancelar
            </Button>
            <button
              type="button"
              onClick={() => void handleConfirmDeleteRule()}
              className="rounded-lg border border-red-500 text-red-500 bg-transparent hover:bg-red-500 hover:text-white dark:border-red-400 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white px-5 py-2.5 font-bold transition text-base shadow-sm cursor-pointer"
            >
              Desactivar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
