import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import {
  Search,
  LayoutGrid,
  List,
  Check,
  ChevronDown,
  ShoppingCart,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { CatalogComponent } from '../../types/catalog';
import { ComponenteDetalleDrawer } from './ComponenteDetalleDrawer';
import heroBackgroundImage from '../../assets/images/imagen estatica login.jpg';
import {
  useClienteCatalog,
  statusBadges,
  statusLabels
} from './hooks/useClienteCatalog';

const bannerImages = [
  heroBackgroundImage,
  '/favicon.jpg',
  heroBackgroundImage,
  '/favicon.jpg',
  heroBackgroundImage,
];

interface ProductCardProps {
  item: CatalogComponent;
  onOpenDrawer: (item: CatalogComponent) => void;
  onAddToCart: (item: CatalogComponent) => void;
}

const CATEGORY_BRANDS: Record<string, string[]> = {
  procesadores: ['Intel', 'AMD', 'Apple', 'Qualcomm', 'Intel Core'],
  'placas-madre': ['ASUS', 'MSI', 'Gigabyte', 'ASRock', 'EVGA'],
  'memorias-ram': ['Corsair', 'Kingston', 'G.Skill', 'ADATA', 'Crucial'],
  'tarjetas-graficas': ['NVIDIA', 'AMD', 'ASUS', 'MSI', 'Gigabyte'],
  almacenamiento: ['Samsung', 'Kingston', 'Western Digital', 'Crucial', 'SanDisk'],
  'fuentes-de-poder': ['EVGA', 'Corsair', 'Seasonic', 'Thermaltake', 'Cooler Master'],
  gabinetes: ['Corsair', 'NZXT', 'Cooler Master', 'Lian Li', 'Phanteks'],
  chasis: ['Corsair', 'NZXT', 'Cooler Master', 'Lian Li', 'Phanteks'],
  refrigeracion: ['Cooler Master', 'Corsair', 'NZXT', 'Noctua', 'Be Quiet!']
};

const ProductGridCard = ({
  item,
  onOpenDrawer,
  onAddToCart
}: ProductCardProps) => {
  return (
    <div
      className="group relative flex flex-col rounded-xl border border-slate-200/80 bg-white p-0 pb-5 shadow-sm transition-all duration-300 hover:border-teal-500/50 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900/30 overflow-hidden"
    >
      <div
        className="flex h-44 items-center justify-center overflow-hidden rounded-t-xl bg-slate-50 dark:bg-neutral-900/50 cursor-pointer"
        onClick={() => onOpenDrawer(item)}
      >
        <img
          src={item.imageUrl || '/favicon.jpg'}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/favicon.jpg';
          }}
        />
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            className="mb-1 text-base font-semibold text-slate-955 dark:text-white group-hover:text-teal-500 dark:group-hover:text-teal-400 transition cursor-pointer line-clamp-1"
            onClick={() => onOpenDrawer(item)}
          >
            {item.name}
          </h3>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-955 dark:text-white mb-3 block">
            {item.category}
          </span>
          <div className="mb-4 space-y-1.5 border-t border-slate-100 dark:border-neutral-900/50 pt-3 text-xs font-normal text-slate-955 dark:text-white">
            {item.attributes && item.attributes.length > 0 ? (
              item.attributes.slice(0, 4).map((attr, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-slate-955 dark:text-white font-normal">{attr.name}</span>
                  <span className="text-slate-955 dark:text-white font-semibold">
                    {attr.value} {attr.unit || ''}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-955 dark:text-white font-normal italic">
                Ver detalles para especificaciones
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between border-t border-slate-100 dark:border-neutral-900/50 pt-3">
            <span className="text-xl font-semibold text-slate-955 dark:text-white">
              ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-[11px] ${statusBadges[item.status as keyof typeof statusBadges]}`}>
              {statusLabels[item.status as keyof typeof statusLabels]}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenDrawer(item)}
              className="flex-1 rounded-lg border border-slate-955 dark:border-neutral-700 px-2 py-2 text-center text-xs font-medium hover:bg-slate-50 dark:hover:bg-neutral-900 transition text-slate-955 dark:text-white"
            >
              Ver detalles
            </button>
            <button
              type="button"
              onClick={() => onAddToCart(item)}
              disabled={item.status === 'agotado'}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                item.status === 'agotado'
                  ? 'border border-slate-200 dark:border-neutral-805 text-slate-955/40 dark:text-white/30 cursor-not-allowed bg-transparent'
                  : 'border border-slate-955 dark:border-neutral-700 text-slate-955 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 bg-transparent cursor-pointer'
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Añadir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const ProductListCard = ({
  item,
  onOpenDrawer,
  onAddToCart
}: ProductCardProps) => {
  return (
    <div
      className="group relative flex flex-col md:flex-row items-center gap-6 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-teal-500/50 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900/30"
    >
      <div
        className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-neutral-900/50 cursor-pointer"
        onClick={() => onOpenDrawer(item)}
      >
        <img
          src={item.imageUrl || '/favicon.jpg'}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/favicon.jpg';
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h3
            className="text-lg font-semibold text-slate-955 dark:text-white group-hover:text-teal-500 dark:group-hover:text-teal-400 transition cursor-pointer truncate"
            onClick={() => onOpenDrawer(item)}
          >
            {item.name}
          </h3>
          <span className={`text-[11px] ${statusBadges[item.status as keyof typeof statusBadges]}`}>
            {statusLabels[item.status as keyof typeof statusLabels]}
          </span>
        </div>
        <div className="flex items-center text-xs text-slate-955 dark:text-white font-semibold uppercase tracking-wider gap-3 mb-3">
          <span>{item.category}</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-slate-955 dark:text-white font-normal border-t border-slate-100 dark:border-neutral-900/50 pt-2.5">
          {item.attributes && item.attributes.length > 0 ? (
            item.attributes.slice(0, 5).map((attr, idx) => (
              <div key={idx} className="flex gap-1">
                <span className="text-slate-955 dark:text-white font-normal">{attr.name}:</span>
                <span className="text-slate-955 dark:text-white font-semibold">
                  {attr.value} {attr.unit || ''}
                </span>
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-955 dark:text-white font-normal italic">
              Ver detalles para especificaciones
            </span>
          )}
        </div>
      </div>
      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 w-full md:w-auto shrink-0 md:border-l border-slate-100 dark:border-neutral-900/80 md:pl-6 min-w-[150px]">
        <span className="text-2xl font-semibold text-slate-955 dark:text-white">
          ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onOpenDrawer(item)}
            className="flex-1 rounded-lg border border-slate-955 dark:border-neutral-700 px-3 py-2 text-center text-xs font-medium hover:bg-slate-50 dark:hover:bg-neutral-900 transition text-slate-955 dark:text-white whitespace-nowrap"
          >
            Ver detalles
          </button>
          <button
            type="button"
            onClick={() => onAddToCart(item)}
            disabled={item.status === 'agotado'}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition whitespace-nowrap ${
              item.status === 'agotado'
                ? 'border border-slate-200 dark:border-neutral-805 text-slate-955/40 dark:text-white/30 cursor-not-allowed bg-transparent'
                : 'border border-slate-955 dark:border-neutral-700 text-slate-955 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 bg-transparent cursor-pointer'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Añadir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ClienteCatalogoPage = () => {
  const catalog = useClienteCatalog();
  const location = useLocation();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % bannerImages.length);
  };

  useEffect(() => {
    if (location.hash === '#productos-catalogo') {
      const el = document.getElementById('productos-catalogo');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }, [location.hash, location.state]);

  return (
    <div className="mx-auto max-w-[95rem] pb-16 text-slate-900 dark:text-neutral-100">
      {catalog.cartSuccessMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-3 text-white shadow-lg animate-bounce">
          <Check className="h-5 w-5" />
          <span className="text-sm font-medium">{catalog.cartSuccessMessage}</span>
        </div>
      )}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-neutral-950 h-40 sm:h-56 md:h-68 lg:h-80 xl:h-96 overflow-hidden -mt-5 sm:-mt-6 mb-8 group/banner">
        {bannerImages.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              idx === currentImgIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={img}
              alt={`Banner ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {/* Dark overlay to make contrast nice and clean */}
        <div className="absolute inset-0 bg-black/20 z-10" />

        {/* Navigation Arrows: Styled as white circular buttons on the edges like the reference */}
        <button
          type="button"
          onClick={handlePrevSlide}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-800 text-teal-600 dark:text-teal-400 shadow-md border border-slate-100 dark:border-neutral-700 transition hover:bg-slate-50 dark:hover:bg-neutral-750 active:scale-95 cursor-pointer opacity-90 hover:opacity-100"
          aria-label="Imagen anterior"
        >
          <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
        </button>
        <button
          type="button"
          onClick={handleNextSlide}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-800 text-teal-600 dark:text-teal-400 shadow-md border border-slate-100 dark:border-neutral-700 transition hover:bg-slate-50 dark:hover:bg-neutral-750 active:scale-95 cursor-pointer opacity-90 hover:opacity-100"
          aria-label="Siguiente imagen"
        >
          <ChevronRight className="h-6 w-6 md:h-7 md:w-7" />
        </button>

        {/* Slide indicators at the bottom */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {bannerImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImgIndex(idx);
              }}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                idx === currentImgIndex ? 'bg-white scale-125 shadow-sm' : 'bg-white/40'
              }`}
              aria-label={`Ir a imagen ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <div
        id="productos-catalogo"
        className="sticky top-0 z-20 bg-white dark:bg-black pb-3 pt-3 border-b border-slate-200/60 dark:border-neutral-900 mb-8 flex gap-2 overflow-x-auto scrollbar-none"
        onMouseEnter={catalog.handleCloseDrawer}
      >
        {catalog.categories.map((cat) => {
          const isActive = catalog.activeCategoryTab === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => catalog.setActiveCategoryTab(cat.slug)}
              className={`flex h-10 items-center px-4 py-2 uppercase tracking-wider transition whitespace-nowrap shrink-0 border-b-2 ${
                isActive
                  ? 'border-teal-500 text-teal-500 font-bold text-base'
                  : 'border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white font-medium text-sm'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start mt-6" onMouseEnter={catalog.handleCloseDrawer}>
        <aside className="w-full lg:w-64 shrink-0 space-y-6 bg-white dark:bg-black border border-slate-200/60 dark:border-neutral-800 p-5 rounded-2xl shadow-sm">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-955 dark:text-white uppercase tracking-wider mb-3 px-1">
              Disponibilidad
            </span>
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 text-base text-slate-955 dark:text-white cursor-pointer hover:text-teal-500 transition font-normal">
                <input
                  type="checkbox"
                  checked={catalog.selectedAvailability === 'disponible'}
                  onChange={() => catalog.setSelectedAvailability(catalog.selectedAvailability === 'disponible' ? 'Todas' : 'disponible')}
                  className="h-4 w-4 rounded border-slate-350 text-teal-650 focus:ring-teal-500/20 dark:border-neutral-800 dark:bg-neutral-900 accent-teal-500"
                />
                <span>En stock / Disponible</span>
              </label>
              <label className="flex items-center gap-2.5 text-base text-slate-955 dark:text-white cursor-pointer hover:text-teal-500 transition font-normal">
                <input
                  type="checkbox"
                  checked={catalog.selectedAvailability === 'stock-bajo'}
                  onChange={() => catalog.setSelectedAvailability(catalog.selectedAvailability === 'stock-bajo' ? 'Todas' : 'stock-bajo')}
                  className="h-4 w-4 rounded border-slate-350 text-teal-650 focus:ring-teal-500/20 dark:border-neutral-800 dark:bg-neutral-900 accent-teal-500"
                />
                <span>Stock bajo</span>
              </label>
              <label className="flex items-center gap-2.5 text-base text-slate-955 dark:text-white cursor-pointer hover:text-teal-500 transition font-normal">
                <input
                  type="checkbox"
                  checked={catalog.selectedAvailability === 'agotado'}
                  onChange={() => catalog.setSelectedAvailability(catalog.selectedAvailability === 'agotado' ? 'Todas' : 'agotado')}
                  className="h-4 w-4 rounded border-slate-350 text-teal-650 focus:ring-teal-500/20 dark:border-neutral-800 dark:bg-neutral-900 accent-teal-500"
                />
                <span>Agotado</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col border-t border-slate-100 dark:border-neutral-800 pt-4">
            <span className="text-xs font-bold text-slate-955 dark:text-white uppercase tracking-wider mb-3 px-1">
              Rango de precio
            </span>
            <div className="space-y-2.5">
              {[
                { label: 'Todos los precios', value: 'Todos' },
                { label: 'Menos de $1,000', value: 'under-1000' },
                { label: '$1,000 - $3,000', value: '1000-3000' },
                { label: '$3,000 - $5,000', value: '3000-5000' },
                { label: '$5,000 - $10,000', value: '5000-10000' },
                { label: 'Más de $10,000', value: 'over-10000' }
              ].map((range) => (
                <label
                  key={range.value}
                  className="flex items-center gap-2.5 text-base text-slate-955 dark:text-white cursor-pointer hover:text-teal-500 transition font-normal"
                >
                  <input
                    type="radio"
                    name="priceRange"
                    checked={catalog.selectedPriceRange === range.value}
                    onChange={() => catalog.setSelectedPriceRange(range.value)}
                    className="h-4 w-4 rounded-full border-slate-350 text-teal-650 focus:ring-teal-500/20 dark:border-neutral-800 dark:bg-neutral-900 accent-teal-500"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 w-full space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-neutral-900 pb-5">
            <div className="relative w-full md:max-w-md">
              <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-white px-3 shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 dark:border-neutral-800 dark:bg-neutral-900/50">
                <Search className="h-5 w-5 text-slate-955 dark:text-white mr-2 shrink-0" />
                <input
                  type="text"
                  value={catalog.searchText}
                  onChange={(e) => {
                    catalog.setSearchText(e.target.value);
                    catalog.setShowSuggestions(true);
                  }}
                  onFocus={() => catalog.setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => catalog.setShowSuggestions(false), 200)}
                  placeholder="Buscar componente o especificación..."
                  className="w-full bg-transparent text-base font-normal outline-none text-slate-955 dark:text-white placeholder:text-slate-955/60 dark:placeholder:text-white/60"
                />
              </div>
              {catalog.showSuggestions && catalog.suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="text-xs font-semibold text-slate-955 dark:text-white uppercase tracking-wider px-2 py-1">
                    Sugerencias rápidas
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-neutral-900 mt-1">
                    {catalog.suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          catalog.setSearchText(item.name);
                          catalog.setShowSuggestions(false);
                        }}
                        className="flex w-full items-center justify-between px-2 py-2 text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/[0.03] rounded-md transition"
                      >
                        <span className="text-slate-955 dark:text-white font-medium">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-955 dark:text-white uppercase tracking-wider whitespace-nowrap">
                  Ordenar:
                </span>
                <div className="relative">
                  <select
                    value={catalog.selectedSort}
                    onChange={(e) => catalog.setSelectedSort(e.target.value)}
                    className="h-10 rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-sm font-normal text-slate-955 dark:text-white shadow-sm outline-none cursor-pointer appearance-none dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <option value="relevancia">Relevancia</option>
                    <option value="precio-menor">Precio: menor a mayor</option>
                    <option value="precio-mayor">Precio: mayor a menor</option>
                    <option value="nombre">Nombre</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-955 dark:text-white" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-955 dark:text-white uppercase tracking-wider">
                  Vista:
                </span>
                <div className="flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                  <button
                    type="button"
                    onClick={() => catalog.setViewMode('grid')}
                    className={`flex h-full w-10 items-center justify-center transition ${
                      catalog.viewMode === 'grid'
                        ? 'bg-slate-100 text-teal-500 dark:bg-neutral-800'
                        : 'text-slate-955 dark:text-white hover:opacity-80'
                    }`}
                    aria-label="Vista cuadricula"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => catalog.setViewMode('list')}
                    className={`flex h-full w-10 items-center justify-center transition ${
                      catalog.viewMode === 'list'
                        ? 'bg-slate-100 text-teal-500 dark:bg-neutral-800'
                        : 'text-slate-955 dark:text-white hover:opacity-80'
                    }`}
                    aria-label="Vista lista"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {catalog.loading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
            </div>
          ) : catalog.groupedComponents.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-white/50 p-6 text-center dark:bg-neutral-900/10">
              <AlertCircle className="h-12 w-12 text-slate-955 dark:text-white mb-4" />
              <h3 className="text-xl font-semibold text-slate-955 dark:text-white">No se encontraron componentes</h3>
              <p className="text-sm text-slate-955 dark:text-white mt-2 max-w-md font-normal">
                Prueba a buscar con otra especificación o limpia los filtros activos.
              </p>
              <button
                type="button"
                onClick={catalog.resetFilters}
                className="mt-4 text-sm font-semibold text-teal-500 dark:text-teal-400 hover:underline"
              >
                Restaurar todos los filtros
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {catalog.groupedComponents.map((group) => {
                return (
                  <div key={group.category.id}>
                    <div className="mb-8 flex flex-col items-center text-center">
                      <h2 className="text-3xl font-semibold text-slate-955 dark:text-white tracking-tight">
                        {group.category.name}
                      </h2>
                      {CATEGORY_BRANDS[group.category.slug as keyof typeof CATEGORY_BRANDS] && (
                        <div className="text-sm font-semibold text-slate-955 dark:text-white mt-2 tracking-wide uppercase">
                          {CATEGORY_BRANDS[group.category.slug as keyof typeof CATEGORY_BRANDS].join('  •  ')}
                        </div>
                      )}
                    </div>

                    {catalog.viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {group.items.map((item) => (
                          <ProductGridCard
                            key={item.id}
                            item={item}
                            onOpenDrawer={catalog.handleOpenDrawer}
                            onAddToCart={catalog.handleAddToCart}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {group.items.map((item) => (
                          <ProductListCard
                            key={item.id}
                            item={item}
                            onOpenDrawer={catalog.handleOpenDrawer}
                            onAddToCart={catalog.handleAddToCart}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!catalog.loading && catalog.filteredComponents.length > 0 && (
            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 dark:border-neutral-900 pt-6 sm:flex-row text-sm text-slate-955 dark:text-white font-normal">
              <div>
                Página {catalog.currentPage} de {catalog.totalPages}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => catalog.setCurrentPage(1)}
                  disabled={catalog.currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-neutral-900 text-slate-955 dark:text-white font-medium"
                >
                  «
                </button>
                <button
                  type="button"
                  onClick={() => catalog.setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={catalog.currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-neutral-900 text-slate-955 dark:text-white font-medium"
                >
                  ‹
                </button>
                <span className="px-3 text-sm font-semibold text-slate-955 dark:text-white">
                  {catalog.currentPage} / {catalog.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => catalog.setCurrentPage(p => Math.min(catalog.totalPages, p + 1))}
                  disabled={catalog.currentPage === catalog.totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-neutral-900 text-slate-955 dark:text-white font-medium"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => catalog.setCurrentPage(catalog.totalPages)}
                  disabled={catalog.currentPage === catalog.totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-neutral-900 text-slate-955 dark:text-white font-medium"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ComponenteDetalleDrawer
        componente={catalog.selectedComponent}
        open={catalog.isDrawerOpen}
        onClose={catalog.handleCloseDrawer}
        onAddToCart={catalog.handleAddToCart}
        triggerType={catalog.triggerType}
        anchorRect={catalog.anchorRect}
        onMouseEnter={catalog.handleMouseEnterPopup}
        onMouseLeave={catalog.handleMouseLeavePopup}
      />
    </div>
  );
};