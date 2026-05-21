import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router';
import {
  Search,
  Cpu,
  Layers,
  MemoryStick,
  Tv,
  HardDrive,
  Zap,
  Snowflake,
  Box as BoxIcon,
  LayoutGrid,
  List,
  ChevronDown,
  Check,
  AlertCircle,
  ShoppingCart
} from 'lucide-react';
import { getCatalogComponents } from '../../services/catalogService';
import type { CatalogComponent } from '../../types/catalog';
import { ComponenteDetalleDrawer } from './ComponenteDetalleDrawer';
import { useCart } from '../../context/CartContext';
const CATEGORY_ICONS: Record<string, any> = {
  todos: LayoutGrid,
  procesadores: Cpu,
  'placas-madre': Layers,
  'memorias-ram': MemoryStick,
  'tarjetas-graficas': Tv,
  almacenamiento: HardDrive,
  'fuentes-de-poder': Zap,
  refrigeracion: Snowflake,
  gabinetes: BoxIcon,
};
const CATEGORIES = [
  { id: 'all', name: 'Todos', slug: 'todos' },
  { id: '1', name: 'Procesadores', slug: 'procesadores' },
  { id: '2', name: 'Placas madre', slug: 'placas-madre' },
  { id: '3', name: 'Memoria RAM', slug: 'memorias-ram' },
  { id: '4', name: 'Tarjetas gráficas', slug: 'tarjetas-graficas' },
  { id: '5', name: 'Almacenamiento', slug: 'almacenamiento' },
  { id: '6', name: 'Fuentes de poder', slug: 'fuentes-de-poder' },
  { id: '7', name: 'Refrigeración', slug: 'refrigeracion' },
  { id: '8', name: 'Gabinetes', slug: 'gabinetes' },
];
const MOCK_COMPONENTS: CatalogComponent[] = [
  {
    id: 'mock-1',
    name: 'AMD Ryzen 7 7800X3D',
    description: 'Procesador premium ideal para videojuegos con tecnología 3D V-Cache.',
    category: 'Procesadores',
    categorySlug: 'procesadores',
    categoryId: '1',
    brand: 'AMD',
    price: 8499.0,
    stock: 15,
    status: 'disponible',
    imageUrl: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=600&auto=format&fit=crop',
    model: 'Ryzen 7 7800X3D',
    sku: '100-100000910WOF',
    attributes: [
      { name: 'Núcleos / Hilos', value: '8 / 16', unit: '' },
      { name: 'Frecuencia base', value: '4.2', unit: 'GHz' },
      { name: 'Frecuencia turbo', value: '5.0', unit: 'GHz' },
      { name: 'Caché L3', value: '96', unit: 'MB' },
      { name: 'TDP', value: '120', unit: 'W' },
      { name: 'Socket', value: 'AM5', unit: '' },
      { name: 'Arquitectura', value: 'Zen 4', unit: '' },
      { name: 'Tecnología', value: '5', unit: 'nm' },
      { name: 'Gráficos integrados', value: 'No', unit: '' },
      { name: 'Desbloqueado', value: 'Sí', unit: '' },
    ],
  },
  {
    id: 'mock-2',
    name: 'MSI B650 TOMAHAWK WiFi',
    description: 'Placa madre ATX con excelente entrega de energía y soporte DDR5.',
    category: 'Placas madre',
    categorySlug: 'placas-madre',
    categoryId: '2',
    brand: 'MSI',
    price: 4299.0,
    stock: 3,
    status: 'stock-bajo',
    imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?q=80&w=600&auto=format&fit=crop',
    model: 'MAG B650 TOMAHAWK WIFI',
    sku: 'B650-TOMAHAWK',
    attributes: [
      { name: 'Socket', value: 'AM5', unit: '' },
      { name: 'Chipset', value: 'B650', unit: '' },
      { name: 'DDR5 hasta', value: '7200', unit: 'MHz (OC)' },
      { name: 'Factor de forma', value: 'ATX', unit: '' },
      { name: 'Ranuras M.2', value: '3', unit: '' },
      { name: 'WiFi', value: '6E', unit: '' },
    ],
  },
  {
    id: 'mock-3',
    name: 'Corsair Vengeance 32GB DDR5',
    description: 'Memoria RAM de alto rendimiento con optimización para plataformas AMD e Intel.',
    category: 'Memoria RAM',
    categorySlug: 'memorias-ram',
    categoryId: '3',
    brand: 'Corsair',
    price: 2799.0,
    stock: 18,
    status: 'disponible',
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=600&auto=format&fit=crop',
    model: 'CMK32GX5M2B6000C36',
    sku: 'RAM-DDR5-32GB',
    attributes: [
      { name: 'Capacidad', value: '32GB (2x16GB)', unit: '' },
      { name: 'Tipo', value: 'DDR5', unit: '' },
      { name: 'Frecuencia', value: '6000', unit: 'MHz' },
      { name: 'Latencia', value: 'CL36', unit: '' },
      { name: 'Voltaje', value: '1.35', unit: 'V' },
    ],
  },
  {
    id: 'mock-4',
    name: 'ASUS TUF RTX 4070 Ti Gaming',
    description: 'Tarjeta gráfica con arquitectura Ada Lovelace y refrigeración avanzada.',
    category: 'Tarjetas gráficas',
    categorySlug: 'tarjetas-graficas',
    categoryId: '4',
    brand: 'ASUS',
    price: 19999.0,
    stock: 5,
    status: 'disponible',
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=600&auto=format&fit=crop',
    model: 'TUF-RTX4070TI-12G-GAMING',
    sku: 'GPU-4070TI',
    attributes: [
      { name: 'VRAM', value: '12GB GDDR6X', unit: '' },
      { name: 'Núcleos CUDA', value: '7680', unit: '' },
      { name: 'Boost Clock', value: '2.61', unit: 'GHz' },
      { name: 'PCIe', value: '4.0', unit: '' },
      { name: 'Puertos HDMI', value: '2', unit: '' },
      { name: 'Puertos DisplayPort', value: '3', unit: '' },
    ],
  },
  {
    id: 'mock-5',
    name: 'Samsung 980 PRO 1TB',
    description: 'SSD NVMe PCIe Gen4 M.2 de máxima velocidad para cargas ultra rápidas.',
    category: 'Almacenamiento',
    categorySlug: 'almacenamiento',
    categoryId: '5',
    brand: 'Samsung',
    price: 2199.0,
    stock: 10,
    status: 'disponible',
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=600&auto=format&fit=crop',
    model: 'MZ-V8P1T0BW',
    sku: 'SSD-SAMSUNG-980PRO',
    attributes: [
      { name: 'Interfaz', value: 'NVMe PCIe 4.0', unit: '' },
      { name: 'Lectura', value: '7000', unit: 'MB/s' },
      { name: 'Escritura', value: '5000', unit: 'MB/s' },
      { name: 'Factor de forma', value: 'M.2 2280', unit: '' },
      { name: 'MTBF', value: '1.5 Millones de horas', unit: '' },
    ],
  },
  {
    id: 'mock-6',
    name: 'Corsair RM850x 850W 80+',
    description: 'Fuente de poder modular silenciosa con certificación de eficiencia Gold.',
    category: 'Fuentes de poder',
    categorySlug: 'fuentes-de-poder',
    categoryId: '6',
    brand: 'Corsair',
    price: 2599.0,
    stock: 2,
    status: 'stock-bajo',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=600&auto=format&fit=crop',
    model: 'CP-9020201-NA',
    sku: 'PSU-CORSAIR-850',
    attributes: [
      { name: 'Potencia', value: '850', unit: 'W' },
      { name: 'Certificación', value: '80+ Gold', unit: '' },
      { name: 'Modularidad', value: 'Modular', unit: '' },
      { name: 'Compatibilidad', value: 'ATX 3.0 / PCIe 5.0', unit: '' },
      { name: 'Ventilador', value: '135mm FDB', unit: '' },
    ],
  },
  {
    id: 'mock-7',
    name: 'Cooler Master Hyper 212 Halo',
    description: 'Disipador de aire clásico con ventilador ARGB rediseñado.',
    category: 'Refrigeración',
    categorySlug: 'refrigeracion',
    categoryId: '7',
    brand: 'Cooler Master',
    price: 799.0,
    stock: 24,
    status: 'disponible',
    imageUrl: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=600&auto=format&fit=crop',
    model: 'RR-S4KK-20PA-R1',
    sku: 'COOLER-HYPER-212',
    attributes: [
      { name: 'Ventilador', value: '120', unit: 'mm' },
      { name: 'Control', value: 'PWM', unit: '' },
      { name: 'TDP Máximo', value: '150', unit: 'W' },
      { name: 'Compatibilidad', value: 'Intel LGA 1700 / AMD AM5', unit: '' },
      { name: 'Iluminación', value: 'Addressable Gen 2 RGB', unit: '' },
    ],
  },
  {
    id: 'mock-8',
    name: 'NZXT H5 Flow Black',
    description: 'Gabinete Mid-Tower con panel frontal perforado para un flujo de aire óptimo.',
    category: 'Gabinetes',
    categorySlug: 'gabinetes',
    categoryId: '8',
    brand: 'NZXT',
    price: 1699.0,
    stock: 0,
    status: 'agotado',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop',
    model: 'CC-H51FB-01',
    sku: 'CASE-NZXT-H5FLOW',
    attributes: [
      { name: 'Tamaño', value: 'Mid Tower', unit: '' },
      { name: 'Diseño', value: 'Flujo de aire optimizado', unit: '' },
      { name: 'Panel lateral', value: 'Vidrio templado', unit: '' },
      { name: 'Compatibilidad placa', value: 'ATX / mATX / Mini-ITX', unit: '' },
      { name: 'Ventiladores incluidos', value: '2 x 120mm', unit: '' },
    ],
  },
];
export const ClienteCatalogoPage = () => {
  const { addToCart } = useCart();
  const [components, setComponents] = useState<CatalogComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [searchText, setSearchText] = useState('');
  const location = useLocation();
  const initialCategory = location.state?.categorySlug || 'todos';
  const [activeCategoryTab, setActiveCategoryTab] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [selectedPriceRange, setSelectedPriceRange] = useState('Todos');
  const [selectedAvailability, setSelectedAvailability] = useState('Todas');
  const [selectedSort, setSelectedSort] = useState('relevancia');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<CatalogComponent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cartSuccessMessage, setCartSuccessMessage] = useState<string | null>(null);
  const [triggerType, setTriggerType] = useState<'click' | 'hover'>('click');
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  
  const hoverTimerRef = useRef<any>(null);
  const closeTimerRef = useRef<any>(null);

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
        if (response.items && response.items.length > 0) {
          setComponents(response.items);
          setIsUsingMockData(false);
        } else {
          setComponents(MOCK_COMPONENTS);
          setIsUsingMockData(true);
        }
      } catch (error) {
        console.warn('API de catálogo no disponible. Cargando mockup local offline...');
        setComponents(MOCK_COMPONENTS);
        setIsUsingMockData(true);
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
      result = result.filter(
        (c) => c.categorySlug === activeCategoryTab
      );
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
      if (selectedSort === 'precio-menor') {
        return a.price - b.price;
      }
      if (selectedSort === 'precio-mayor') {
        return b.price - a.price;
      }
      if (selectedSort === 'nombre') {
        return a.name.localeCompare(b.name);
      }
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
  const handleAddToCart = (componente: CatalogComponent) => {
    addToCart(componente);
    setCartSuccessMessage(`¡${componente.name} añadido al carrito!`);
    setTimeout(() => {
      setCartSuccessMessage(null);
    }, 3000);
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
  const statusBadges = {
    disponible: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25',
    'stock-bajo': 'bg-amber-500/10 text-amber-500 border border-amber-500/25',
    agotado: 'bg-rose-500/10 text-rose-500 border border-rose-500/25',
  };
  const statusLabels = {
    disponible: 'Disponible',
    'stock-bajo': 'Stock bajo',
    agotado: 'Agotado',
  };
  return (
    <div className="mx-auto max-w-7xl pb-16 text-slate-900 dark:text-neutral-100">
      {cartSuccessMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-3 text-white shadow-lg animate-bounce">
          <Check className="h-5 w-5" />
          <span className="text-sm font-bold">{cartSuccessMessage}</span>
        </div>
      )}
      {isUsingMockData && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-700 dark:text-yellow-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <span className="font-bold">Modo Demostración:</span> El backend no está conectado actualmente. Se está visualizando catálogo de componentes interactivo con mockup.
          </div>
        </div>
      )}
      <div className="relative mb-8 flex flex-col items-center justify-between gap-4 md:flex-row border-b border-slate-100 dark:border-neutral-900 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white leading-none">
            Explorar catálogo de componentes de hardware
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
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Buscar componente, marca o especificación..."
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 dark:placeholder:text-neutral-500"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Sugerencias rápidas
              </div>
              <div className="divide-y divide-slate-100 dark:divide-neutral-900 mt-1">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSearchText(item.name);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center justify-between px-2 py-2 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.03] rounded-md transition"
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] font-bold text-teal-500 dark:text-teal-400 uppercase">
                      {item.brand}
                    </span>
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
              Marca
            </span>
            <div className="relative">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-xs font-bold shadow-sm outline-none cursor-pointer appearance-none dark:border-neutral-800 dark:bg-neutral-900"
              >
                {brandsList.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-400 dark:text-neutral-500" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1 px-1">
              Rango de precio
            </span>
            <div className="relative">
              <select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-xs font-bold shadow-sm outline-none cursor-pointer appearance-none dark:border-neutral-800 dark:bg-neutral-900"
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
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
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
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
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
                onClick={() => setViewMode('grid')}
                className={`flex h-full w-10 items-center justify-center transition ${
                  viewMode === 'grid'
                    ? 'bg-slate-100 text-teal-500 dark:bg-neutral-800'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label="Vista cuadrícula"
              >
                <LayoutGrid className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex h-full w-10 items-center justify-center transition ${
                  viewMode === 'list'
                    ? 'bg-slate-100 text-teal-500 dark:bg-neutral-800'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label="Vista lista"
              >
                <List className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.slug] || LayoutGrid;
          const isActive = activeCategoryTab === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryTab(cat.slug)}
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
      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        </div>
      ) : filteredComponents.length === 0 ? (
        <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-white/50 p-6 text-center dark:bg-neutral-900/10">
          <AlertCircle className="h-12 w-12 text-slate-400 dark:text-neutral-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No se encontraron componentes</h3>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-2 max-w-md">
            Prueba a buscar con otra especificación o limpia los filtros activos.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchText('');
              setActiveCategoryTab('todos');
              setSelectedBrand('Todas');
              setSelectedPriceRange('Todos');
              setSelectedAvailability('Todas');
            }}
            className="mt-4 text-xs font-bold text-teal-500 dark:text-teal-400 hover:underline"
          >
            Restaurar todos los filtros
          </button>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredComponents.map((item) => (
              <div
                key={item.id}
                onMouseEnter={(e) => handleMouseEnterCard(item, e)}
                onMouseLeave={handleMouseLeaveCard}
                className="group relative flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:border-teal-500/50 hover:shadow-lg dark:border-neutral-850 dark:bg-neutral-950/30 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
                    {item.brand}
                  </span>
                  <div className="text-xs text-slate-300 dark:text-neutral-700 hover:text-rose-500 transition cursor-pointer">
                    ♥
                  </div>
                </div>
                <div
                  className="mb-4 flex h-36 items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-neutral-900/50 p-2 cursor-pointer"
                  onClick={() => handleOpenDrawer(item)}
                >
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=600&auto=format&fit=crop'}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3
                  className="mb-1 text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-teal-500 dark:group-hover:text-teal-400 transition cursor-pointer line-clamp-1"
                  onClick={() => handleOpenDrawer(item)}
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
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadges[item.status]}`}>
                    {statusLabels[item.status]}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDrawer(item)}
                    className="flex-1 rounded-lg border border-slate-200 dark:border-neutral-850 px-2 py-2 text-center text-xs font-bold hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-900 transition dark:text-neutral-200"
                  >
                    Ver detalles
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
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
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComponents.map((item) => (
              <div
                key={item.id}
                onMouseEnter={(e) => handleMouseEnterCard(item, e)}
                onMouseLeave={handleMouseLeaveCard}
                className="group relative flex flex-col md:flex-row items-center gap-6 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:border-teal-500/50 hover:shadow-lg dark:border-neutral-850 dark:bg-neutral-950/30"
              >
                <div
                  className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-neutral-900/50 p-2 cursor-pointer"
                  onClick={() => handleOpenDrawer(item)}
                >
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=600&auto=format&fit=crop'}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h3
                      className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-teal-500 dark:group-hover:text-teal-400 transition cursor-pointer truncate"
                      onClick={() => handleOpenDrawer(item)}
                    >
                      {item.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadges[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-slate-400 dark:text-neutral-500 font-bold gap-3 mb-3">
                    <span className="uppercase tracking-widest">{item.brand}</span>
                    <span>•</span>
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
                      onClick={() => handleOpenDrawer(item)}
                      className="flex-1 rounded-lg border border-slate-200 dark:border-neutral-850 px-3 py-2 text-center text-xs font-bold hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-900 transition dark:text-neutral-200 whitespace-nowrap"
                    >
                      Ver detalles
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
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
            ))}
          </div>
        )
      )}
      {!loading && filteredComponents.length > 0 && (
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-100 dark:border-neutral-900 pt-6 sm:flex-row text-xs text-slate-500 dark:text-neutral-400 font-semibold">
          <div>
            Mostrando 1 a {filteredComponents.length} de {filteredComponents.length} componentes
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-850 opacity-40 cursor-not-allowed"
            >
              «
            </button>
            <button
              type="button"
              disabled
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-850 opacity-40 cursor-not-allowed"
            >
              ‹
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white font-bold"
            >
              1
            </button>
            <button
              type="button"
              disabled
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-850 opacity-40 cursor-not-allowed"
            >
              ›
            </button>
            <button
              type="button"
              disabled
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-850 opacity-40 cursor-not-allowed"
            >
              »
            </button>
          </div>
        </div>
      )}
      <ComponenteDetalleDrawer
        componente={selectedComponent}
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedComponent(null);
        }}
        onAddToCart={handleAddToCart}
        triggerType={triggerType}
        anchorRect={anchorRect}
        onMouseEnter={handleMouseEnterPopup}
        onMouseLeave={handleMouseLeavePopup}
      />
    </div>
  );
};
