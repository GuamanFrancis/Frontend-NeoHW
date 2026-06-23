import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CatalogComponent } from '../../types/catalog';
import { getCatalogComponentById, getCatalogComponents } from '../../services/catalogService';
type ComponenteDetalleDrawerProps = {
  componente: CatalogComponent | null;
  open: boolean;
  onClose: () => void;
  onAddToCart?: (componente: CatalogComponent) => void;
  triggerType?: 'click' | 'hover';
  anchorRect?: DOMRect | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  showAddToCart?: boolean;
};
export const ComponenteDetalleDrawer = ({
  componente,
  open,
  onClose,
  triggerType = 'click',
  anchorRect = null,
  onMouseEnter,
  onMouseLeave,
}: ComponenteDetalleDrawerProps) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [detailedComponent, setDetailedComponent] = useState<CatalogComponent | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setDetailedComponent(null);

    if (!componente || !open) return;

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        let details: CatalogComponent | null = null;
        if (componente.id) {
          try {
            details = await getCatalogComponentById(componente.id);
          } catch (err) {
            console.error('Error fetching by ID, trying search by name:', err);
          }
        }
        if (!details && componente.name) {
          const searchRes = await getCatalogComponents({ search: componente.name });
          const exactMatch = searchRes.items.find(
            (item) => item.name.toLowerCase() === componente.name.toLowerCase()
          );
          if (exactMatch) {
            details = exactMatch;
          }
        }
        if (details) {
          setDetailedComponent(details);
        }
      } catch (err) {
        console.error('Error fetching component details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };

    void fetchDetails();
  }, [componente, open]);

  if (!componente) return null;

  const displayComponent = detailedComponent || componente;
  const images = [displayComponent.imageUrl || ''].filter(Boolean);
  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  const statusColors = {
    disponible: 'text-emerald-500 font-semibold',
    'stock-bajo': 'text-amber-500 font-semibold',
    agotado: 'text-rose-500 font-semibold',
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
    ? 'fixed z-50 border border-slate-200 bg-[#EBFFDC] p-5 shadow-[0_0_40px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out text-slate-900 overflow-y-auto rounded-2xl ring-1 ring-teal-500/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-[0_0_40px_rgba(0,0,0,0.8)] dark:text-neutral-100 dark:ring-teal-500/10'
    : 'fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 border border-slate-200 bg-[#EBFFDC] p-6 shadow-[0_0_50px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out text-slate-900 overflow-y-auto rounded-2xl ring-1 ring-teal-500/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-[0_0_50px_rgba(0,0,0,0.7)] dark:text-neutral-100 dark:ring-teal-500/10';

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
        <div className="flex items-start justify-between mb-4 gap-4">
          <h2 className="text-2xl font-semibold text-slate-955 dark:text-white leading-tight tracking-tight">
            {displayComponent.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-955 dark:text-white bg-slate-50 dark:bg-neutral-900/40 transition hover:opacity-85 hover:border-slate-300 dark:hover:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-900 shrink-0"
            aria-label="Cerrar detalles"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Imagen del Componente */}
        <div className="relative mb-6 rounded-xl border border-slate-205 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/40 w-full h-64 overflow-hidden group">
          <img
            src={images[activeImageIndex] || '/favicon.jpg'}
            alt={displayComponent.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/favicon.jpg';
            }}
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 text-slate-955 dark:text-white shadow hover:bg-slate-50 dark:hover:bg-neutral-850 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 text-slate-955 dark:text-white shadow hover:bg-slate-50 dark:hover:bg-neutral-850 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="flex justify-center gap-2 mt-4 px-4 pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-11 w-11 rounded-lg border overflow-hidden bg-white dark:bg-neutral-950 p-1 transition ${
                      activeImageIndex === idx
                        ? 'border-teal-500 ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-neutral-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Vista" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Especificaciones principales */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-slate-955 dark:text-white uppercase tracking-wider mb-4">
            Especificaciones principales
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {loadingDetails ? (
              <>
                <div className="animate-pulse">
                  <div className="h-5 w-24 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                  <div className="h-4 w-32 bg-slate-200 dark:bg-neutral-800 rounded mt-2"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-5 w-20 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                  <div className="h-4 w-24 bg-slate-200 dark:bg-neutral-800 rounded mt-2"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-5 w-28 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                  <div className="h-4 w-36 bg-slate-200 dark:bg-neutral-800 rounded mt-2"></div>
                </div>
              </>
            ) : displayComponent.attributes && displayComponent.attributes.length > 0 ? (
              displayComponent.attributes.map((attr, idx) => (
                <div
                  key={idx}
                  className="flex flex-col"
                >
                  <span className="text-xl font-semibold text-slate-955 dark:text-white">
                    {attr.name}
                  </span>
                  <span className="text-lg font-normal text-slate-955 dark:text-white mt-1">
                    {attr.value} {attr.unit || ''}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-4 text-slate-955 dark:text-white text-lg font-medium italic">
                No hay especificaciones técnicas detalladas para este componente.
              </div>
            )}
          </div>
        </div>

        {/* Descripción */}
        {displayComponent.description && (
          <div className="mb-6 border-t border-slate-200/40 dark:border-neutral-900/40 pt-4">
            <h3 className="text-xl font-semibold text-slate-955 dark:text-white uppercase tracking-wider mb-2">
              Descripción
            </h3>
            <p className="text-xl text-slate-955 dark:text-white leading-relaxed font-normal">
              {displayComponent.description}
            </p>
          </div>
        )}

        {/* Precio y Disponibilidad al Final */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-200/40 dark:border-neutral-900/40 mt-6">
          <div>
            <span className="text-sm font-medium text-slate-955 dark:text-white uppercase tracking-wider block">
              Precio
            </span>
            <div className="text-3xl font-semibold text-slate-955 dark:text-white mt-1">
              ${displayComponent.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-slate-955 dark:text-white uppercase tracking-wider block">
              Estado
            </span>
            <span className={`text-xl ${statusColors[displayComponent.status as keyof typeof statusColors]} mt-1 block`}>
              {statusLabels[displayComponent.status as keyof typeof statusLabels]}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
