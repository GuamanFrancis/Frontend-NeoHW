import React from 'react';
import {
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import type { PCComponent } from '../types';
import { getFriendlyCompatibilityDetail } from '../utils/compatibilityHelpers';

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
  onSendToCart: () => void;
  compatibilityStatus: {
    checked: boolean;
    results: Array<{
      ruleId: string;
      ruleName: string;
      status: 'PASS' | 'WARN' | 'FAIL' | 'SKIPPED';
      detail: string;
      sourceProduct: { id: string; name: string };
      targetProduct: { id: string; name: string };
    }>;
  };
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  components,
  hardwareStats,
  hasSelectedComponents,
  onSendToCart,
  compatibilityStatus,
}) => {
  const [isCompatibilityOpen, setIsCompatibilityOpen] = React.useState(false);
  const installedProducts = components.filter((c) => c.dbProduct);

  return (
    <div className="border border-slate-200 dark:border-neutral-800/60 bg-white dark:bg-black rounded-2xl p-3 flex flex-col justify-between shadow-sm h-full min-h-[480px]">
      <div className="flex flex-col min-h-0 flex-1">
        {/* Header & Total Price */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-xs font-semibold text-slate-955 dark:text-white uppercase tracking-wider">Resumen de Ensamble y Costo</span>
          <span className="text-base font-semibold text-slate-955 dark:text-white">
            ${hardwareStats.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Installed Components with images */}
        <div className="border-t border-slate-200 dark:border-neutral-800 pt-2 mb-2 flex-1 overflow-y-auto overflow-x-hidden max-h-[260px] lg:max-h-[380px] space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-neutral-800 scrollbar-track-transparent text-xs">
          {installedProducts.length === 0 ? (
            <div className="text-slate-700 dark:text-neutral-300 italic text-[11px] text-center py-4">Ningún componente instalado aún.</div>
          ) : (
            installedProducts.map((c) => (
              <div key={c.id} className="flex items-start gap-2 py-1.5 text-slate-900 dark:text-white border-b border-slate-300 dark:border-neutral-800 last:border-b-0">
                {/* Image container */}
                <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={c.dbProduct?.imageUrl || '/favicon.jpg'}
                    alt={c.selectedName || c.dbProduct?.name}
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/favicon.jpg';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="font-semibold text-xs sm:text-sm text-slate-955 dark:text-white line-clamp-2 leading-snug">
                    {c.selectedName || c.dbProduct?.name}
                  </span>
                  <span className="text-xs font-normal text-slate-955 dark:text-white mt-0.5">
                    ${parseFloat(c.dbProduct?.price as any || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Specs with professional font-weights and black/white colors */}
        <div className="border-t border-slate-200 dark:border-neutral-800 pt-2 mb-2 text-xs grid grid-cols-2 gap-x-4 gap-y-1 shrink-0">
          {[
            { k: 'Consumo', v: `${hardwareStats.estWatts}W` },
            { k: 'Placa Base', v: hardwareStats.formFactor || '-' },
            { k: 'Socket', v: hardwareStats.cpuSocket || hardwareStats.moboSocket || '-' },
            { k: 'Memoria', v: hardwareStats.ramType || '-' },
          ].map((row) => (
            <div key={row.k} className="flex items-center justify-between text-black dark:text-white">
              <span className="font-normal">{row.k}:</span>
              <span className="font-normal truncate max-w-[85px]">{row.v}</span>
            </div>
          ))}
        </div>

        {/* Collapsible Compatibility Accordion at the bottom of the card */}
        <div className="border-t border-slate-200 dark:border-neutral-800 pt-2.5 mb-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsCompatibilityOpen(!isCompatibilityOpen)}
            className="w-full flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-slate-955 dark:text-white cursor-pointer select-none"
          >
            <span className="flex items-center gap-2">
              Chequeo de compatibilidad
              {compatibilityStatus.checked && (
                <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                  compatibilityStatus.results.filter((r) => (r.status as string) !== 'SKIPPED').some((r) => r.status === 'FAIL')
                    ? 'bg-rose-500 animate-pulse'
                    : compatibilityStatus.results.filter((r) => (r.status as string) !== 'SKIPPED').some((r) => r.status === 'WARN')
                    ? 'bg-amber-500'
                    : 'bg-teal-500'
                }`} />
              )}
            </span>
            {isCompatibilityOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-955 dark:text-white shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-955 dark:text-white shrink-0" />
            )}
          </button>
          
          {isCompatibilityOpen && (
            <div className="space-y-2 mt-3 overflow-y-auto max-h-[160px] pr-1 scrollbar-hide border-t border-slate-100 dark:border-neutral-900 pt-2.5">
              {!compatibilityStatus.checked ? (
                <div className="text-center py-4 text-[11px] text-slate-955 dark:text-white font-normal italic leading-relaxed">
                  Selecciona e instala al menos 2 componentes para iniciar el chequeo.
                </div>
              ) : compatibilityStatus.results.filter((r) => (r.status as string) !== 'SKIPPED').length === 0 ? (
                <div className="text-center py-4 text-[11px] text-slate-955 dark:text-white font-normal italic leading-relaxed">
                  Configuración compatible.
                </div>
              ) : (
                compatibilityStatus.results
                  .filter((r) => (r.status as string) !== 'SKIPPED')
                  .map((r) => (
                    <div key={`${r.ruleId}-${r.sourceProduct.id}-${r.targetProduct.id}`} className="rounded-xl bg-slate-50 dark:bg-neutral-900/45 border border-slate-200 dark:border-neutral-800/40 p-2 flex items-start justify-between gap-1.5 shadow-sm text-[11px]">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-955 dark:text-white block truncate">{r.ruleName}</span>
                        <span className={`font-normal leading-snug block mt-0.5 ${r.status === 'PASS' ? 'text-teal-600 dark:text-teal-400' : r.status === 'WARN' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {getFriendlyCompatibilityDetail(r.ruleName, r.detail, r.status)}
                        </span>
                      </div>
                      {r.status === 'PASS' ? (
                        <CheckCircle2 className="h-4 w-4 text-teal-500 dark:text-teal-400 shrink-0 mt-0.5" />
                      ) : r.status === 'WARN' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="shrink-0 mt-2">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onSendToCart}
            disabled={!hasSelectedComponents}
            className="w-full h-11 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-955 font-semibold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-teal-500/10 disabled:opacity-40 disabled:cursor-not-allowed border-none text-xs"
          >
            <ShoppingCart className="h-4 w-4" /> Añadir Carrito
          </button>
        </div>
      </div>
    </div>
  );
};
