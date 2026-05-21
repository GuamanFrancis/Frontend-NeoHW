import { useEffect, useState } from 'react';
import { ShoppingCart, X, Star, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { CatalogComponent } from '../../types/catalog';
type ComponenteDetalleDrawerProps = {
  componente: CatalogComponent | null;
  open: boolean;
  onClose: () => void;
  onAddToCart?: (componente: CatalogComponent) => void;
  triggerType?: 'click' | 'hover';
  anchorRect?: DOMRect | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};
export const ComponenteDetalleDrawer = ({
  componente,
  open,
  onClose,
  onAddToCart,
  triggerType = 'click',
  anchorRect = null,
  onMouseEnter,
  onMouseLeave,
}: ComponenteDetalleDrawerProps) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  useEffect(() => {
    setActiveImageIndex(0);
  }, [componente]);
  if (!componente) return null;
  const images = [
    componente.imageUrl || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop',
  ];
  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  const statusColors = {
    disponible: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25',
    'stock-bajo': 'bg-amber-500/10 text-amber-500 border border-amber-500/25',
    agotado: 'bg-rose-500/10 text-rose-500 border border-rose-500/25',
  };
  const statusLabels = {
    disponible: 'Disponible',
    'stock-bajo': 'Stock bajo',
    agotado: 'Agotado',
  };

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const useFloating = triggerType === 'hover' && anchorRect && !isMobile;

  let floatingStyle: React.CSSProperties = {};
  if (useFloating && anchorRect) {
    const margin = 12;
    const popupWidth = 410;
    
    
    let left = anchorRect.right + margin;
    
    
    if (left + popupWidth > window.innerWidth) {
      left = anchorRect.left - popupWidth - margin;
    }
    
    
    if (left < 12) left = 12;
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 12;
    }

    
    const cardCenterY = anchorRect.top + anchorRect.height / 2;
    let top = cardCenterY - 260; 
    
    
    if (top < 12) top = 12;
    if (top + 540 > window.innerHeight) {
      top = window.innerHeight - 540 - 12;
    }
    if (window.innerHeight < 580) {
      top = 12;
    }

    floatingStyle = {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${popupWidth}px`,
      maxHeight: 'calc(100vh - 24px)',
      transform: 'none',
      margin: 0,
    };
  }

  const containerClassName = useFloating
    ? 'fixed z-50 border border-neutral-850 bg-neutral-950 p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] transition-all duration-200 ease-out text-neutral-100 overflow-y-auto rounded-2xl ring-1 ring-teal-500/10'
    : 'fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 border border-neutral-850 bg-neutral-950 p-6 shadow-[0_0_50px_rgba(0,0,0,0.7)] transition-all duration-300 ease-out text-neutral-100 overflow-y-auto rounded-2xl ring-1 ring-teal-500/10';

  return (
    <>
      {open && triggerType === 'click' && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
          onClick={onClose}
        />
      )}
      <div
        className={`${containerClassName} ${
          open ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible pointer-events-none'
        }`}
        style={useFloating ? floatingStyle : undefined}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold text-neutral-450 uppercase tracking-wider">
              {componente.category}
            </span>
            <span className="mx-2 text-neutral-800">•</span>
            <span className="text-xs font-bold text-neutral-450 uppercase tracking-wider">
              {componente.brand}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-850 text-neutral-400 bg-neutral-900/40 transition hover:text-white hover:border-neutral-700 hover:bg-neutral-900"
            aria-label="Cerrar detalles"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-5">
          <h2 className="text-xl font-black text-white leading-tight">
            {componente.name}
          </h2>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <span className="text-[11px] text-neutral-400 font-medium">
              (128 reseñas)
            </span>
          </div>
        </div>
        <div className="relative mb-5 rounded-xl border border-neutral-900 bg-neutral-900/40 p-4 group">
          <div className="flex h-48 items-center justify-center overflow-hidden rounded-lg">
            <img
              src={images[activeImageIndex]}
              alt={componente.name}
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <button
            type="button"
            onClick={handlePrevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white shadow hover:bg-neutral-850 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white shadow hover:bg-neutral-850 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex justify-center gap-2 mt-4">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`h-11 w-11 rounded-lg border overflow-hidden bg-neutral-950 p-1 transition ${
                  activeImageIndex === idx
                    ? 'border-teal-500 ring-2 ring-teal-500/20'
                    : 'border-neutral-850 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="Vista" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-2xl font-black text-teal-400">
              ${componente.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 font-medium">
              Envío estimado: 24 - 48 horas
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColors[componente.status]}`}>
            {statusLabels[componente.status]}
          </span>
        </div>
        <div className="mb-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">
            Especificaciones principales
          </h3>
          <div className="rounded-lg border border-neutral-900/80 overflow-hidden text-xs bg-neutral-950">
            <div className="divide-y divide-neutral-900">
              {componente.attributes && componente.attributes.length > 0 ? (
                componente.attributes.map((attr, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between py-2 px-3 transition hover:bg-white/[0.01]"
                  >
                    <span className="font-semibold text-neutral-400">
                      {attr.name}
                    </span>
                    <span className="font-bold text-neutral-250 text-right">
                      {attr.value} {attr.unit || ''}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-neutral-500 italic">
                  No hay especificaciones técnicas detalladas para este componente.
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-neutral-900/80">
          <Button
            type="button"
            fullWidth
            onClick={() => onAddToCart?.(componente)}
            disabled={componente.status === 'agotado'}
            className="flex-1 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold h-10 transition duration-200"
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" strokeWidth={2.5} />
            Añadir al carrito
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-10 h-10 p-0 border-neutral-850 hover:bg-neutral-900 text-neutral-400 hover:text-white flex items-center justify-center rounded-lg"
            aria-label="Comparar"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};
