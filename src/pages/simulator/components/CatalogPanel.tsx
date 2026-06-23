import React from 'react';
import { Loader2, Info, X, Plus } from 'lucide-react';
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
  onOpenDetail: (product: CatalogComponent) => void;
  onRemoveComponent: (slotId: string) => void;
}

export const CatalogPanel: React.FC<CatalogPanelProps> = ({
  activeSlotId,
  components,
  modalProducts,
  loadingProducts,
  catalogSearch,
  setCatalogSearch,
  onSelectProduct,
  onOpenDetail,
  onRemoveComponent,
}) => {
  if (!activeSlotId) return null;

  const filteredProducts = modalProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-3 py-2 border-b border-black dark:border-neutral-800 shrink-0 bg-white dark:bg-black">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={catalogSearch}
          onChange={(e) => setCatalogSearch(e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-955 dark:text-white focus:outline-none focus:border-teal-500 transition shadow-inner"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-0 py-1 divide-y divide-black dark:divide-neutral-800 pr-1 scrollbar-hide">
        {loadingProducts ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
            <span className="text-xs text-slate-955 dark:text-white font-semibold animate-pulse">Cargando catálogo...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-955 dark:text-white font-semibold">No hay componentes que coincidan.</div>
        ) : (
          filteredProducts.map((prod) => {
            const compatError = checkProductCompatibility(prod, activeSlotId, components);
            const isClickable = !compatError;

            const activeComp = components.find((c) => c.id === activeSlotId);
            const isInstalled = activeComp?.dbProduct?.id === prod.id;

            return (
              <div
                key={prod.id}
                className="pt-1.5 pl-1 pb-2.5 pr-1 transition-all hover:bg-slate-50/50 dark:hover:bg-neutral-900/20 cursor-pointer"
              >
                <div onClick={() => onOpenDetail(prod)} className="flex gap-2 items-start">
                  {/* Left Side: Product Image (Larger w-16 h-16) */}
                  <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    <img
                      src={prod.imageUrl || '/favicon.jpg'}
                      alt={prod.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/favicon.jpg';
                      }}
                    />
                  </div>

                  {/* Right Side: Info block aligned vertically with the image */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[64px]">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {prod.name}
                    </h4>

                    <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
                      {/* Price & Compatibility plain text (No borders or backgrounds) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          ${prod.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        {compatError ? (
                          <span className="text-[11px] text-red-505 dark:text-red-400 font-semibold">
                            Incompatible
                          </span>
                        ) : (
                          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                            ✓ Compatible
                          </span>
                        )}
                      </div>

                      {/* Actions aligned on the right */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail(prod);
                          }}
                          className="h-7 w-7 rounded-lg border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-200 transition flex items-center justify-center cursor-pointer"
                          title="Ver especificaciones"
                        >
                          <Info className="h-3.5 w-3.5 text-slate-955 dark:text-white" />
                        </button>

                        {isInstalled ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveComponent(activeSlotId);
                            }}
                            className="h-7 w-7 rounded-lg border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-200 transition flex items-center justify-center cursor-pointer hover:text-red-500 hover:border-red-500"
                            title="Quitar componente"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!isClickable}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isClickable) onSelectProduct(prod);
                            }}
                            className={`h-7 w-7 rounded-lg border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-200 transition flex items-center justify-center ${
                              isClickable ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                            }`}
                            title="Ensamblar componente"
                          >
                            <Plus className="h-3.5 w-3.5 text-slate-955 dark:text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {compatError && (
                  <div className="mt-2 pl-[76px]">
                    <p className="text-[10px] text-red-505 dark:text-red-400 font-semibold leading-tight bg-red-500/5 p-1.5 rounded-lg border border-red-500/10">
                      {compatError}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
