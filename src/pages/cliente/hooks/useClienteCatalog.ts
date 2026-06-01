import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  LayoutGrid,
  Cpu,
  Layers,
  MemoryStick,
  Tv,
  HardDrive,
  Zap,
  Snowflake,
  Box as BoxIcon,
  type LucideIcon
} from 'lucide-react';
import { getCatalogComponents } from '../../../services/catalogService';
import type { CatalogComponent } from '../../../types/catalog';
import { useCart } from '../../../context/CartContext';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  todos: LayoutGrid,
  procesadores: Cpu,
  'placas-madre': Layers,
  'memorias-ram': MemoryStick,
  'tarjetas-graficas': Tv,
  almacenamiento: HardDrive,
  'fuentes-de-poder': Zap,
  gabinetes: BoxIcon,
};

export const CATEGORIES = [
  { id: 'all', name: 'Todos', slug: 'todos' },
  { id: '1', name: 'Procesadores', slug: 'procesadores' },
  { id: '2', name: 'Placas madre', slug: 'placas-madre' },
  { id: '3', name: 'Memoria RAM', slug: 'memorias-ram' },
  { id: '4', name: 'Tarjetas gráficas', slug: 'tarjetas-graficas' },
  { id: '5', name: 'Almacenamiento', slug: 'almacenamiento' },
  { id: '6', name: 'Fuentes de poder', slug: 'fuentes-de-poder' },
  { id: '8', name: 'Gabinetes', slug: 'gabinetes' },
];

export const ITEMS_PER_PAGE = 8;

export const statusBadges = {
  disponible: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25',
  'stock-bajo': 'bg-amber-500/10 text-amber-500 border border-amber-500/25',
  agotado: 'bg-rose-500/10 text-rose-500 border border-rose-500/25',
};

export const statusLabels = {
  disponible: 'Disponible',
  'stock-bajo': 'Stock bajo',
  agotado: 'Agotado',
};

export const useClienteCatalog = () => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [components, setComponents] = useState<CatalogComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const location = useLocation();
  const initialCategory = location.state?.categorySlug || 'todos';

  const [activeCategoryTab, setActiveCategoryTab] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [selectedPriceRange, setSelectedPriceRange] = useState('Todos');
  const [selectedAvailability, setSelectedAvailability] = useState('Todas');
  const [selectedSort, setSelectedSort] = useState('relevancia');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<CatalogComponent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cartSuccessMessage, setCartSuccessMessage] = useState<string | null>(null);
  const [triggerType, setTriggerType] = useState<'click' | 'hover'>('click');
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setCurrentPage(1);
    });
    return () => cancelAnimationFrame(timer);
  }, [searchText, activeCategoryTab, selectedBrand, selectedPriceRange, selectedAvailability, selectedSort]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleMouseEnterCard = (item: CatalogComponent, event: React.MouseEvent) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    const rect = event.currentTarget.getBoundingClientRect();
    hoverTimerRef.current = setTimeout(() => {
      setTriggerType('hover');
      setAnchorRect(rect);
      setSelectedComponent(item);
      setIsDrawerOpen(true);
    }, 2000);
  };

  const handleMouseLeaveCard = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (isDrawerOpen && triggerType === 'hover') {
      closeTimerRef.current = setTimeout(() => {
        setIsDrawerOpen(false);
        setSelectedComponent(null);
      }, 300);
    }
  };

  const handleMouseEnterPopup = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleMouseLeavePopup = () => {
    if (triggerType === 'hover') {
      closeTimerRef.current = setTimeout(() => {
        setIsDrawerOpen(false);
        setSelectedComponent(null);
      }, 300);
    }
  };

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const response = await getCatalogComponents({ limit: 100 });
        if (response.items) {
          setComponents(response.items);
        }
      } catch (error) {
        console.error('Error al cargar el catálogo:', error);
        setComponents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const brandsList = useMemo(() => {
    const brands = new Set(components.map((c) => c.brand));
    return ['Todas', ...Array.from(brands)];
  }, [components]);

  const suggestions = useMemo(() => {
    if (!searchText.trim()) return [];
    return components
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchText.toLowerCase()) ||
          c.brand.toLowerCase().includes(searchText.toLowerCase())
      )
      .slice(0, 5);
  }, [searchText, components]);

  const filteredComponents = useMemo(() => {
    let result = [...components];
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.brand.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower) ||
          (c.model && c.model.toLowerCase().includes(searchLower)) ||
          c.attributes.some((attr) => attr.value.toLowerCase().includes(searchLower))
      );
    }
    if (activeCategoryTab !== 'todos') {
      result = result.filter((c) => c.categorySlug === activeCategoryTab);
    }
    if (selectedBrand !== 'Todas') {
      result = result.filter((c) => c.brand === selectedBrand);
    }
    if (selectedPriceRange !== 'Todos') {
      switch (selectedPriceRange) {
        case 'under-1000':
          result = result.filter((c) => c.price < 1000);
          break;
        case '1000-3000':
          result = result.filter((c) => c.price >= 1000 && c.price <= 3000);
          break;
        case '3000-5000':
          result = result.filter((c) => c.price > 3000 && c.price <= 5000);
          break;
        case '5000-10000':
          result = result.filter((c) => c.price > 5000 && c.price <= 10000);
          break;
        case 'over-10000':
          result = result.filter((c) => c.price > 10000);
          break;
        default:
          break;
      }
    }
    if (selectedAvailability !== 'Todas') {
      result = result.filter((c) => c.status === selectedAvailability);
    }
    result.sort((a, b) => {
      if (selectedSort === 'precio-menor') return a.price - b.price;
      if (selectedSort === 'precio-mayor') return b.price - a.price;
      if (selectedSort === 'nombre') return a.name.localeCompare(b.name);
      return 0;
    });
    return result;
  }, [
    components,
    searchText,
    activeCategoryTab,
    selectedBrand,
    selectedPriceRange,
    selectedAvailability,
    selectedSort,
  ]);

  const { groupedComponents, totalPages } = useMemo(() => {
    const groups: { category: typeof CATEGORIES[0]; items: CatalogComponent[] }[] = [];
    const categoriesToRender =
      activeCategoryTab === 'todos'
        ? CATEGORIES.filter((c) => c.slug !== 'todos')
        : CATEGORIES.filter((c) => c.slug === activeCategoryTab);

    let maxItemsInAnyCategory = 0;

    categoriesToRender.forEach((category) => {
      const allItemsInCategory = filteredComponents.filter((c) => c.categorySlug === category.slug);
      if (allItemsInCategory.length > 0) {
        maxItemsInAnyCategory = Math.max(maxItemsInAnyCategory, allItemsInCategory.length);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginatedItems = allItemsInCategory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        if (paginatedItems.length > 0) {
          groups.push({ category, items: paginatedItems });
        }
      }
    });

    const calculatedTotalPages = Math.max(1, Math.ceil(maxItemsInAnyCategory / ITEMS_PER_PAGE));
    return { groupedComponents: groups, totalPages: calculatedTotalPages };
  }, [filteredComponents, activeCategoryTab, currentPage]);

  const handleAddToCart = (componente: CatalogComponent) => {
    addToCart(componente);
    navigate('/cliente/carrito');
  };

  const handleOpenDrawer = (componente: CatalogComponent) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setTriggerType('click');
    setAnchorRect(null);
    setSelectedComponent(componente);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedComponent(null);
  };

  const resetFilters = () => {
    setSearchText('');
    setActiveCategoryTab('todos');
    setSelectedBrand('Todas');
    setSelectedPriceRange('Todos');
    setSelectedAvailability('Todas');
  };

  return {
    loading,
    searchText,
    setSearchText,
    activeCategoryTab,
    setActiveCategoryTab,
    selectedBrand,
    setSelectedBrand,
    selectedPriceRange,
    setSelectedPriceRange,
    selectedAvailability,
    setSelectedAvailability,
    selectedSort,
    setSelectedSort,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    showSuggestions,
    setShowSuggestions,
    selectedComponent,
    isDrawerOpen,
    cartSuccessMessage,
    triggerType,
    anchorRect,
    brandsList,
    suggestions,
    filteredComponents,
    groupedComponents,
    totalPages,
    handleMouseEnterCard,
    handleMouseLeaveCard,
    handleMouseEnterPopup,
    handleMouseLeavePopup,
    handleAddToCart,
    handleOpenDrawer,
    handleCloseDrawer,
    resetFilters,
  };
};
