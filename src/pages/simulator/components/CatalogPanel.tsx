import React from 'react';
import { Loader2, Info } from 'lucide-react';
import type { CatalogComponent } from '../../../types/catalog';
import type { PCComponent } from '../types';
import { checkProductCompatibility } from '../utils/compatibilityHelpers';

interface CatalogPanelProps {
  activeSlotId: string | null;
  components: PCComponent[];
  modalProducts: CatalogComponent[];
  loadingProducts: boolean;
  catalogSearch: string;
  setCatalogSearch: (search: string) => void;
  onSelectProduct: (product: CatalogComponent) => void;
  onClose: () => void;
  onOpenDetail: (product: CatalogComponent) => void;
}

export const CatalogPanel: React.FC<CatalogPanelProps> = ({
  activeSlotId,
  components,
  modalProducts,
  loadingProducts,
  catalogSearch,
  setCatalogSearch,
  onSelectProduct,
  onClose,
  onOpenDetail,
}) => {
  if (!activeSlotId) return null;

  const activeComponentLabel = components.find((c) => c.id === activeSlotId)?.label || '';
  const filteredProducts = modalProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-neutral-800/60 bg-slate-100/40 dark:bg-neutral-900/60 shrink-0">
        <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-neutral-300 truncate">
          Catálogo: {activeComponentLabel}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] font-bold text-red-500 hover:text-red-600 transition shrink-0 ml-2"
        >
          Volver
        </button>
      </div>

      <div className="px-3 py-2 border-b border-slate-150 dark:border-neutral-850 shrink-0 bg-white dark:bg-neutral-950">
        <input
          type="text"
          placeholder="Buscar por nombre o marca..."
          value={catalogSearch}
          onChange={(e) => setCatalogSearch(e.target.value)}
          className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition shadow-inner"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 pr-1 scrollbar-hide">
        {loadingProducts ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
            <span className="text-[10px] text-slate-450 font-bold animate-pulse">Cargando catálogo...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-[10px] text-slate-400 font-bold">No hay componentes que coincidan.</div>
        ) : (
          filteredProducts.map((prod) => {
            const compatError = checkProductCompatibility(prod, activeSlotId, components);
            const isClickable = !compatError;

            return (
              <div
                key={prod.id}
                onClick={() => isClickable && onSelectProduct(prod)}
                className={`rounded-xl border p-2.5 transition-all flex flex-col gap-1.5 bg-white dark:bg-neutral-950 ${
                  isClickable
                    ? 'border-slate-200 dark:border-neutral-800/60 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-neutral-900 cursor-pointer'
                    : 'border-red-500/10 opacity-70 bg-red-500/[0.01] cursor-not-allowed border-dashed'
                }`}
              >
                <div className="min-w-0">
                  <h4 className="text-[11px] font-medium text-slate-900 dark:text-white line-clamp-2 leading-tight">
                    {prod.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[8px] bg-slate-200 dark:bg-neutral-800 text-slate-650 dark:text-neutral-300 font-extrabold px-1.5 py-0.5 rounded">
                      {prod.brand}
                    </span>
                    {compatError ? (
                      <span className="text-[8px] bg-red-500/10 text-red-650 dark:text-red-400 font-extrabold px-1.5 py-0.5 rounded border border-red-500/20">
                        Incompatible
                      </span>
                    ) : (
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/20">
                        ✓ Compatible
                      </span>
                    )}
                  </div>
                  {compatError && (
                    <p className="text-[9px] text-red-555 dark:text-red-400/90 font-semibold leading-tight mt-1.5 bg-red-500/5 p-1.5 rounded-lg border border-red-500/10">
                      {compatError}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5 border-t border-slate-100 dark:border-neutral-900/60 pt-1 shrink-0">
                  <span className="text-[11px] font-black text-teal-655 dark:text-teal-400">
                    ${prod.price.toLocaleString('en-US')}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetail(prod);
                    }}
                    className="p-1 rounded-md hover:bg-slate-150 dark:hover:bg-neutral-850 text-slate-450 hover:text-teal-500 transition cursor-pointer"
                    title="Ver especificaciones técnicas"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
