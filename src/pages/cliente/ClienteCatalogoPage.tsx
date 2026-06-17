import {
  Search,
  LayoutGrid,
  List,
  Check,
  ChevronDown,
  ShoppingCart,
  AlertCircle,
  Box as BoxIcon
} from 'lucide-react';
import type { CatalogComponent } from '../../types/catalog';
import { ComponenteDetalleDrawer } from './ComponenteDetalleDrawer';
import {
  useClienteCatalog,
  CATEGORY_ICONS,
  statusBadges,
  statusLabels
} from './hooks/useClienteCatalog';

interface ProductCardProps {
  item: CatalogComponent;
  onMouseEnter: (item: CatalogComponent, event: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onOpenDrawer: (item: CatalogComponent) => void;
  onAddToCart: (item: CatalogComponent) => void;
}

const ProductGridCard = ({
  item,
  onMouseEnter,
  onMouseLeave,
  onOpenDrawer,
  onAddToCart
}: ProductCardProps) => {
  return (
    <div
      onMouseEnter={(e) => onMouseEnter(item, e)}
      onMouseLeave={onMouseLeave}
      className="group relative flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:border-teal-500/50 hover:shadow-lg dark:border-neutral-850 dark:bg-neutral-950/30 overflow-hidden"
    >

      <div
        className="mb-4 flex h-36 items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-neutral-900/50 p-2 cursor-pointer"
        onClick={() => onOpenDrawer(item)}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center text-slate-350 dark:text-neutral-600">
            <BoxIcon className="h-12 w-12" />
          </div>
        )}
      </div>
      <h3
        className="mb-1 text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-teal-500 dark:group-hover:text-teal-400 transition cursor-pointer line-clamp-1"
        onClick={() => onOpenDrawer(item)}
      >
        {item.name}
      </h3>
      <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 mb-3 block">
        {item.category}
      </span>
      <div className="mb-4 space-y-1.5 border-t border-slate-50 dark:border-neutral-900/50 pt-3 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 flex-1">
        {item.attributes && item.attributes.length > 0 ? (
          item.attributes.slice(0, 4).map((attr, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="text-slate-400 dark:text-neutral-500">{attr.name}</span>
              <span className="text-slate-900 dark:text-neutral-200 font-bold">
                {attr.value} {attr.unit || ''}
              </span>
            </div>
          ))
        ) : (
          <div className="text-[10px] text-slate-400 dark:text-neutral-600 italic">
            Ver detalles para especificaciones
          </div>
        )}
      </div>
      <div className="mb-4 flex items-center justify-between border-t border-slate-50 dark:border-neutral-900/50 pt-3">
        <span className="text-lg font-black text-slate-900 dark:text-white">
          ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadges[item.status as keyof typeof statusBadges]}`}>
          {statusLabels[item.status as keyof typeof statusLabels]}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onOpenDrawer(item)}
          className="flex-1 rounded-lg border border-slate-200 dark:border-neutral-850 px-2 py-2 text-center text-xs font-bold hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-900 transition dark:text-neutral-200"
        >
          Ver detalles
        </button>
        <button
          type="button"
          onClick={() => onAddToCart(item)}
          disabled={item.status === 'agotado'}
          className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-white transition ${
            item.status === 'agotado'
              ? 'bg-slate-200 dark:bg-neutral-800 text-slate-400 dark:text-neutral-600 cursor-not-allowed'
              : 'bg-teal-500 hover:bg-teal-600 dark:bg-teal-500 dark:hover:bg-teal-600'
          }`}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Añadir</span>
        </button>
      </div>
    </div>
  );
};

const ProductListCard = ({
  item,
  onMouseEnter,
  onMouseLeave,
  onOpenDrawer,
  onAddToCart
}: ProductCardProps) => {
  return (
    <div
      onMouseEnter={(e) => onMouseEnter(item, e)}
      onMouseLeave={onMouseLeave}
      className="group relative flex flex-col md:flex-row items-center gap-6 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:border-teal-500/50 hover:shadow-lg dark:border-neutral-850 dark:bg-neutral-950/30"
    >
      <div
        className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-neutral-900/50 p-2 cursor-pointer"
        onClick={() => onOpenDrawer(item)}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center text-slate-350 dark:text-neutral-600">
            <BoxIcon className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h3
            className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-teal-500 dark:group-hover:text-teal-400 transition cursor-pointer truncate"
            onClick={() => onOpenDrawer(item)}
          >
            {item.name}
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadges[item.status as keyof typeof statusBadges]}`}>
            {statusLabels[item.status as keyof typeof statusLabels]}
          </span>
        </div>
        <div className="flex items-center text-xs text-slate-400 dark:text-neutral-500 font-bold gap-3 mb-3">
          <span>{item.category}</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-500 dark:text-neutral-400 font-semibold border-t border-slate-50 dark:border-neutral-900/50 pt-2.5">
          {item.attributes && item.attributes.length > 0 ? (
            item.attributes.slice(0, 5).map((attr, idx) => (
              <div key={idx} className="flex gap-1">
                <span className="text-slate-400 dark:text-neutral-500">{attr.name}:</span>
                <span className="text-slate-900 dark:text-neutral-200 font-bold">
                  {attr.value} {attr.unit || ''}
                </span>
              </div>
            ))
          ) : (
            <span className="text-[10px] text-slate-400 dark:text-neutral-600 italic">
              Ver detalles para especificaciones
            </span>
          )}
        </div>
      </div>
      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 w-full md:w-auto shrink-0 md:border-l border-slate-100 dark:border-neutral-900/80 md:pl-6 min-w-[150px]">
        <span className="text-xl font-black text-slate-900 dark:text-white">
          ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onOpenDrawer(item)}
            className="flex-1 rounded-lg border border-slate-200 dark:border-neutral-850 px-3 py-2 text-center text-xs font-bold hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-900 transition dark:text-neutral-200 whitespace-nowrap"
          >
            Ver detalles
          </button>
          <button
            type="button"
            onClick={() => onAddToCart(item)}
            disabled={item.status === 'agotado'}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white transition whitespace-nowrap ${
              item.status === 'agotado'
                ? 'bg-slate-200 dark:bg-neutral-800 text-slate-400 dark:text-neutral-600 cursor-not-allowed'
                : 'bg-teal-500 hover:bg-teal-600 dark:bg-teal-500 dark:hover:bg-teal-600'
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

  return (
    <div className="mx-auto max-w-7xl pb-16 text-slate-900 dark:text-neutral-100">
      {catalog.cartSuccessMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-3 text-white shadow-lg animate-bounce">
          <Check className="h-5 w-5" />
          <span className="text-sm font-bold">{catalog.cartSuccessMessage}</span>
        </div>
      )}
      <div className="relative mb-8 flex flex-col items-center justify-between gap-4 md:flex-row border-b border-slate-100 dark:border-neutral-900 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white leading-none">
            Catálogo de componentes
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2 font-medium">
            Explora, compara y elige los mejores componentes para tu próximo ensamble.
          </p>
        </div>
        <div className="relative w-full max-w-md">
          <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-white px-3 shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 dark:border-neutral-800 dark:bg-neutral-900/50">
            <Search className="h-5 w-5 text-slate-400 dark:text-neutral-500 mr-2 shrink-0" />
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
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 dark:placeholder:text-neutral-500"
            />
          </div>
          {catalog.showSuggestions && catalog.suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
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
                    className="flex w-full items-center justify-between px-2 py-2 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.03] rounded-md transition"
                  >
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-neutral-900 dark:bg-neutral-950/20">
        <div className="flex flex-wrap items-center gap-3">

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1 px-1">
              Rango de precio
            </span>
            <div className="relative">
              <select
                value={catalog.selectedPriceRange}
                onChange={(e) => catalog.setSelectedPriceRange(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-xs font-bold shadow-sm outline-none cursor-pointer appearance-none dark:border-neutral-850 dark:bg-neutral-900"
              >
                <option value="Todos">Todos los precios</option>
                <option value="under-1000">Menos de $1,000</option>
                <option value="1000-3000">$1,000 - $3,000</option>
                <option value="3000-5000">$3,000 - $5,000</option>
                <option value="5000-10000">$5,000 - $10,000</option>
                <option value="over-10000">Más de $10,000</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-400 dark:text-neutral-500" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1 px-1">
              Disponibilidad
            </span>
            <div className="relative">
              <select
                value={catalog.selectedAvailability}
                onChange={(e) => catalog.setSelectedAvailability(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-xs font-bold shadow-sm outline-none cursor-pointer appearance-none dark:border-neutral-800 dark:bg-neutral-900"
              >
                <option value="Todas">Todas</option>
                <option value="disponible">Disponibles</option>
                <option value="stock-bajo">Stock bajo</option>
                <option value="agotado">Agotados</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-400 dark:text-neutral-500" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1 px-1 text-right">
              Ordenar por
            </span>
            <div className="relative">
              <select
                value={catalog.selectedSort}
                onChange={(e) => catalog.setSelectedSort(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-xs font-bold shadow-sm outline-none cursor-pointer appearance-none dark:border-neutral-800 dark:bg-neutral-900"
              >
                <option value="relevancia">Relevancia</option>
                <option value="precio-menor">Precio: menor a mayor</option>
                <option value="precio-mayor">Precio: mayor a menor</option>
                <option value="nombre">Nombre</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-400 dark:text-neutral-500" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1 px-1">
              Vista
            </span>
            <div className="flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <button
                type="button"
                onClick={() => catalog.setViewMode('grid')}
                className={`flex h-full w-10 items-center justify-center transition ${
                  catalog.viewMode === 'grid'
                    ? 'bg-slate-100 text-teal-500 dark:bg-neutral-800'
                    : 'text-slate-400 hover:text-slate-600'
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
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label="Vista lista"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {catalog.categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.slug] || LayoutGrid;
          const isActive = catalog.activeCategoryTab === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => catalog.setActiveCategoryTab(cat.slug)}
              className={`flex h-11 items-center gap-2 rounded-lg border px-5 py-2.5 text-xs font-bold uppercase transition whitespace-nowrap shrink-0 ${
                isActive
                  ? 'border-teal-500/20 bg-teal-500/10 text-teal-500 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-400'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300 dark:hover:bg-neutral-900'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {catalog.loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        </div>
      ) : catalog.groupedComponents.length === 0 ? (
        <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-white/50 p-6 text-center dark:bg-neutral-900/10">
          <AlertCircle className="h-12 w-12 text-slate-400 dark:text-neutral-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No se encontraron componentes</h3>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-2 max-w-md">
            Prueba a buscar con otra especificación o limpia los filtros activos.
          </p>
          <button
            type="button"
            onClick={catalog.resetFilters}
            className="mt-4 text-xs font-bold text-teal-500 dark:text-teal-400 hover:underline"
          >
            Restaurar todos los filtros
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {catalog.groupedComponents.map((group) => {
            const CategoryIcon = CATEGORY_ICONS[group.category.slug] || LayoutGrid;
            return (
              <div key={group.category.id}>
                <div className="mb-6 flex items-center gap-3">
                  <CategoryIcon className="h-6 w-6 text-teal-500" />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{group.category.name}</h2>
                </div>

                {catalog.viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.items.map((item) => (
                      <ProductGridCard
                        key={item.id}
                        item={item}
                        onMouseEnter={catalog.handleMouseEnterCard}
                        onMouseLeave={catalog.handleMouseLeaveCard}
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
                        onMouseEnter={catalog.handleMouseEnterCard}
                        onMouseLeave={catalog.handleMouseLeaveCard}
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
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 dark:border-neutral-900 pt-6 sm:flex-row text-xs text-slate-500 dark:text-neutral-400 font-semibold">
          <div>
            Página {catalog.currentPage} de {catalog.totalPages} <span className="hidden sm:inline">(Total: {catalog.filteredComponents.length} componentes que coinciden con los filtros)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => catalog.setCurrentPage(1)}
              disabled={catalog.currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-850 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-neutral-900"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => catalog.setCurrentPage(p => Math.max(1, p - 1))}
              disabled={catalog.currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-850 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-neutral-900"
            >
              ‹
            </button>
            <span className="px-3 text-sm font-bold text-slate-700 dark:text-neutral-300">
              {catalog.currentPage} / {catalog.totalPages}
            </span>
            <button
              type="button"
              onClick={() => catalog.setCurrentPage(p => Math.min(catalog.totalPages, p + 1))}
              disabled={catalog.currentPage === catalog.totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-850 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-neutral-900"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => catalog.setCurrentPage(catalog.totalPages)}
              disabled={catalog.currentPage === catalog.totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-850 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-neutral-900"
            >
              »
            </button>
          </div>
        </div>
      )}

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