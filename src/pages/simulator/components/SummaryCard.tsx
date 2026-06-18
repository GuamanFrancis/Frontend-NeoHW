import React from 'react';
import { ShoppingCart } from 'lucide-react';
import type { PCComponent } from '../types';

interface SummaryCardProps {
  components: PCComponent[];
  hardwareStats: {
    totalPrice: number;
    estWatts: number;
    formFactor: string;
    cpuSocket: string;
    moboSocket: string;
    ramType: string;
    moboRam: string;
  };
  hasSelectedComponents: boolean;
  onOpenSaveModal: () => void;
  onSendToCart: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  components,
  hardwareStats,
  hasSelectedComponents,
  onOpenSaveModal,
  onSendToCart,
}) => {
  const installedProducts = components.filter((c) => c.dbProduct);

  return (
    <div className="border border-slate-200 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/10 rounded-2xl p-4 flex flex-col justify-between shadow-sm min-h-[220px]">
      <div className="flex flex-col min-h-0 flex-1">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 dark:text-neutral-450 uppercase tracking-wider">Resumen de Ensamble y Costo</span>
          <span className="text-base font-black text-teal-600 dark:text-teal-400">${hardwareStats.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="border-t border-slate-200 dark:border-neutral-800/65 pt-2 mb-2 flex-1 overflow-y-auto max-h-[90px] space-y-1.5 pr-1 scrollbar-hide text-[10px]">
          {installedProducts.length === 0 ? (
            <div className="text-slate-400 italic text-[9px] text-center py-4">Ningún componente instalado aún.</div>
          ) : (
            installedProducts.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 text-slate-700 dark:text-neutral-300">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0">{c.icon}</span>
                  <span className="truncate font-medium">{c.selectedName || c.dbProduct?.name}</span>
                </div>
                <span className="shrink-0 font-bold text-slate-900 dark:text-white">
                  ${parseFloat(c.dbProduct?.price as any || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-200 dark:border-neutral-800/60 pt-2 mb-3 text-[9px] grid grid-cols-2 gap-x-4 gap-y-1 shrink-0">
          {[
            { k: 'Consumo', v: `${hardwareStats.estWatts}W` },
            { k: 'Placa Base', v: hardwareStats.formFactor },
            { k: 'Socket', v: hardwareStats.cpuSocket || hardwareStats.moboSocket || '-' },
            { k: 'Memoria', v: hardwareStats.ramType || '-' },
          ].map((row) => (
            <div key={row.k} className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-neutral-400 font-medium">{row.k}:</span>
              <span className="font-bold text-slate-800 dark:text-white truncate max-w-[85px]">{row.v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenSaveModal}
            disabled={!hasSelectedComponents}
            className="h-10 rounded-lg border border-slate-350 dark:border-neutral-800 bg-white dark:bg-neutral-900/65 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/70 disabled:opacity-40 disabled:cursor-not-allowed transition text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-sm"
          >
            Guardar Proyecto
          </button>
          <button
            type="button"
            onClick={onSendToCart}
            disabled={!hasSelectedComponents}
            className="h-10 rounded-lg border border-slate-350 dark:border-neutral-800 bg-white dark:bg-neutral-900/65 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/70 disabled:opacity-40 disabled:cursor-not-allowed transition text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Añadir Carrito
          </button>
        </div>
      </div>
    </div>
  );
};
