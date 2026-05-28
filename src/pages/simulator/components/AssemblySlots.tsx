import React from 'react';
import { Wrench, Trash2 } from 'lucide-react';
import type { PCComponent, ComponentState } from '../types';

interface AssemblySlotsProps {
  visibleComponents: PCComponent[];
  assemblyStates: Record<string, ComponentState>;
  components: PCComponent[];
  onOpenSelectModal: (slotId: string, catSlug: string) => void;
  onStartInstall: (id: string) => void;
  onRemoveComponent: (id: string) => void;
}

const STATE_CONFIG: Record<ComponentState, { label: string; short: string; cls: string; dot: string }> = {
  installed: {
    label: 'Instalado',
    short: 'Inst',
    cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    dot: 'bg-emerald-500',
  },
  available: {
    label: 'Lista para instalar',
    short: 'Elegir',
    cls: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25',
    dot: 'bg-teal-500',
  },
  installing: {
    label: 'Instalando...',
    short: 'Instal...',
    cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 animate-pulse',
    dot: 'bg-amber-500',
  },
  locked: {
    label: 'Pendiente',
    short: 'Bloq',
    cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
    dot: 'bg-slate-500',
  },
  incompatible: {
    label: 'Incompatible',
    short: 'Incomp',
    cls: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',
    dot: 'bg-red-500',
  },
};

export const AssemblySlots: React.FC<AssemblySlotsProps> = ({
  visibleComponents,
  assemblyStates,
  components,
  onOpenSelectModal,
  onStartInstall,
  onRemoveComponent,
}) => {
  return (
    <div className="w-full lg:w-[20%] lg:sticky lg:top-6 flex flex-col border border-slate-200 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/10 rounded-2xl overflow-hidden h-[400px] lg:h-[calc(100vh-120px)] shadow-sm">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-neutral-800/60 bg-slate-100/40 dark:bg-neutral-900/60 shrink-0">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-teal-500" /> Ranuras de Ensamble
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100 dark:divide-neutral-900/40 px-2 py-1 scrollbar-hide">
        {visibleComponents.map((comp) => {
          const st = assemblyStates[comp.id] || 'locked';
          const activeComp = components.find((c) => c.id === comp.id);
          const config = STATE_CONFIG[st]; 

          return (
            <div key={comp.id} className={`flex items-center gap-2.5 px-3 py-3 transition rounded-xl ${st === 'locked' ? 'opacity-50' : 'hover:bg-slate-100/50 dark:hover:bg-neutral-900/40'}`}>
              <span className="text-base shrink-0 w-6 text-center">{comp.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{comp.label}</p>
                <p className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">{activeComp?.dbProduct ? activeComp.dbProduct.name : activeComp?.selectedName}</p>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                {st !== 'available' && (
                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border ${config.cls}`}>
                    {config.short}
                  </span>
                )}
                {st === 'installed' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveComponent(comp.id);
                    }}
                    className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-650 dark:text-red-400 border border-red-500/25 transition cursor-pointer"
                    title="Quitar componente"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {st === 'available' && !activeComp?.dbProduct && (
                  <button type="button" onClick={() => onOpenSelectModal(comp.id, comp.categorySlug)} className="text-[8px] font-black px-2 py-1 rounded bg-teal-500 hover:bg-teal-400 text-neutral-950 transition cursor-pointer shadow-sm shadow-teal-500/10 border-none">
                    Elegir
                  </button>
                )}
                {st === 'available' && activeComp?.dbProduct && (
                  <button type="button" onClick={() => onStartInstall(comp.id)} className="text-[8px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition cursor-pointer">
                    Instalar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
