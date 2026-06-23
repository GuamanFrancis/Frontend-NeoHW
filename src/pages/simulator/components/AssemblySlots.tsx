import React from 'react';
import {
  X,
  Monitor,
  Zap,
  Cpu,
  Layers,
  Snowflake,
  Database,
  Gamepad2,
  HardDrive,
  Cable,
  RefreshCw
} from 'lucide-react';
import type { PCComponent, ComponentState } from '../types';
import type { CatalogComponent } from '../../../types/catalog';
import { CatalogPanel } from './CatalogPanel';

interface AssemblySlotsProps {
  visibleComponents: PCComponent[];
  assemblyStates: Record<string, ComponentState>;
  components: PCComponent[];
  onOpenSelectModal: (slotId: string, catSlug: string) => void;
  onRemoveComponent: (id: string) => void;

  activeSlotId: string | null;
  modalProducts: CatalogComponent[];
  loadingProducts: boolean;
  catalogSearch: string;
  setCatalogSearch: (search: string) => void;
  onSelectProduct: (product: CatalogComponent) => void;
  onCloseCatalog: () => void;
  onOpenDetail: (product: CatalogComponent) => void;

  hasSelectedComponents: boolean;
  onReset: () => void;
}

const SLOT_ICONS: Record<string, React.ReactNode> = {
  case: <Monitor className="h-3.5 w-3.5" />,
  psu: <Zap className="h-3.5 w-3.5" />,
  motherboard: <Layers className="h-3.5 w-3.5" />,
  cpu: <Cpu className="h-3.5 w-3.5" />,
  cooler: <Snowflake className="h-3.5 w-3.5" />,
  ram_1: <Database className="h-3.5 w-3.5" />,
  ram_2: <Database className="h-3.5 w-3.5" />,
  ram_3: <Database className="h-3.5 w-3.5" />,
  ram_4: <Database className="h-3.5 w-3.5" />,
  gpu: <Gamepad2 className="h-3.5 w-3.5" />,
  storage: <HardDrive className="h-3.5 w-3.5" />,
  cables: <Cable className="h-3.5 w-3.5" />,
};

export const AssemblySlots: React.FC<AssemblySlotsProps> = ({
  visibleComponents,
  assemblyStates,
  components,
  onOpenSelectModal,
  onRemoveComponent,
  activeSlotId,
  modalProducts,
  loadingProducts,
  catalogSearch,
  setCatalogSearch,
  onSelectProduct,
  onCloseCatalog,
  onOpenDetail,
  hasSelectedComponents,
  onReset,
}) => {
  const displayedComponents = activeSlotId
    ? visibleComponents.filter((comp) => comp.id === activeSlotId)
    : visibleComponents;

  return (
    <div className="w-full lg:sticky lg:top-6 flex flex-col border border-slate-200 dark:border-neutral-800/60 bg-white dark:bg-black rounded-2xl overflow-hidden h-[400px] lg:h-[calc(100vh-120px)] shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-neutral-800/60 bg-slate-50 dark:bg-neutral-900/60 shrink-0">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-955 dark:text-white">
          Categorías
        </h3>
      </div>
      
      <div className={`flex-1 min-h-0 divide-y divide-black dark:divide-neutral-800 px-2 py-1 scrollbar-hide ${activeSlotId ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
        {displayedComponents.map((comp) => {
          const st = assemblyStates[comp.id] || 'locked';
          const activeComp = components.find((c) => c.id === comp.id);
          const productName = activeComp?.selectedName || activeComp?.dbProduct?.name;
          const isActive = activeSlotId === comp.id;
 
          const iconElement = SLOT_ICONS[comp.id] || comp.icon;
          const scaledIcon = React.isValidElement(iconElement)
            ? React.cloneElement(iconElement as React.ReactElement<any>, {
                className: "h-5 w-5"
              })
            : iconElement;
 
          return (
            <div key={comp.id} className={`flex flex-col ${activeSlotId ? 'flex-1 min-h-0' : ''}`}>
              <div
                title={productName ? `${comp.label}: ${productName}` : `${comp.label} (Sin seleccionar)`}
                className={`flex items-center transition rounded-xl gap-3 px-3 py-4 sm:py-5 ${st === 'locked' ? 'opacity-40' : 'hover:bg-slate-100/50 dark:hover:bg-neutral-900/40'}`}
              >
                <span className="text-slate-955 dark:text-white shrink-0 flex justify-center w-8">
                  {scaledIcon}
                </span>
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <p className={`${activeSlotId ? 'text-base sm:text-lg' : 'text-sm'} font-semibold text-slate-955 dark:text-white truncate`}>{comp.label}</p>
                  {st === 'installed' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                  )}
                </div>
 
                <div className="shrink-0 flex items-center gap-1.5">
                  {st === 'installed' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveComponent(comp.id);
                      }}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-800 dark:text-white transition cursor-pointer border-none bg-transparent"
                      title="Quitar componente"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {st === 'available' && !activeComp?.dbProduct && !isActive && (
                    <button
                      type="button"
                      onClick={() => onOpenSelectModal(comp.id, comp.categorySlug)}
                      className={`font-semibold rounded bg-teal-500 hover:bg-teal-400 text-neutral-950 transition cursor-pointer shadow-sm shadow-teal-500/10 border-none ${activeSlotId ? 'text-[10px] px-2.5 py-0.5' : 'text-xs px-3 py-1'}`}
                    >
                      Elegir
                    </button>
                  )}
                  {isActive && (
                    <button
                      type="button"
                      onClick={onCloseCatalog}
                      className="text-xs font-semibold text-slate-600 dark:text-neutral-50 hover:text-slate-900 dark:hover:text-white transition cursor-pointer border-none bg-transparent px-1 py-0.5"
                    >
                      Volver
                    </button>
                  )}
                </div>
              </div>

              {isActive && (
                <div className="pl-0 pr-1 pb-1.5 pt-0 border-t border-black dark:border-neutral-900 bg-slate-50/50 dark:bg-neutral-900/40 rounded-b-xl flex-1 flex flex-col min-h-0 mb-2 overflow-hidden">
                  <CatalogPanel
                    activeSlotId={activeSlotId}
                    components={components}
                    modalProducts={modalProducts}
                    loadingProducts={loadingProducts}
                    catalogSearch={catalogSearch}
                    setCatalogSearch={setCatalogSearch}
                    onSelectProduct={onSelectProduct}
                    onOpenDetail={onOpenDetail}
                    onRemoveComponent={onRemoveComponent}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasSelectedComponents && !activeSlotId && (
        <div className="p-3 border-t border-slate-200 dark:border-neutral-800/60 bg-slate-50 dark:bg-neutral-950/40 shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:bg-slate-50 dark:hover:bg-neutral-800/80 text-slate-700 dark:text-neutral-200 font-semibold py-2 transition text-xs shadow-sm cursor-pointer border-none"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Limpiar Ensamble
          </button>
        </div>
      )}
    </div>
  );
};
