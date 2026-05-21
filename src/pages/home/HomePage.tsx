import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Box,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Flame,
  HardDrive,
  MemoryStick,
  Monitor,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  UserPlus,
  XCircle,
  AlertTriangle,
  Check,
  LogOut,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import dashboardLoginImage from '../../assets/images/dashboardloginandpage.png';
import { getCatalogComponents } from '../../services/catalogService';
import type { CatalogComponent } from '../../types/catalog';
import { useCart } from '../../context/CartContext';
import { ComponenteDetalleDrawer } from '../cliente/ComponenteDetalleDrawer';
import { getStoredSession } from '../../services/session';
import { roleHomeRoutes, logoutUser } from '../../services/authService';

const categories = [
  { name: 'Procesadores', icon: Cpu, slug: 'procesadores' },
  { name: 'Tarjetas gráficas', icon: Monitor, slug: 'tarjetas-graficas' },
  { name: 'Placas base', icon: Box, slug: 'placas-madre' },
  { name: 'Memorias RAM', icon: MemoryStick, slug: 'memorias-ram' },
  { name: 'Almacenamiento', icon: HardDrive, slug: 'almacenamiento' },
  { name: 'Fuentes de poder', icon: PackageCheck, slug: 'fuentes-de-poder' },
];

const FALLBACK_PRODUCTS: CatalogComponent[] = [
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
      { name: 'Socket', value: 'AM5', unit: '' },
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
      { name: 'Factor de forma', value: 'ATX', unit: '' },
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
    ],
  },
];

export const HomePage = () => {
  const { addToCart, itemCount } = useCart();
  const navigate = useNavigate();
  const session = getStoredSession();

  const [productsList, setProductsList] = useState<CatalogComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartSuccessMessage, setCartSuccessMessage] = useState<string | null>(null);

  const [selectedComponent, setSelectedComponent] = useState<CatalogComponent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
    const fetchFeatured = async () => {
      setLoading(true);
      try {
        const response = await getCatalogComponents({ limit: 4 });
        if (response.items && response.items.length > 0) {
          setProductsList(response.items);
        } else {
          setProductsList(FALLBACK_PRODUCTS);
        }
      } catch (error) {
        console.warn('API de catálogo no disponible. Usando fallback offline...', error);
        setProductsList(FALLBACK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleAddToCart = (product: CatalogComponent) => {
    addToCart(product);
    setCartSuccessMessage(`¡${product.name} añadido al carrito!`);
    setTimeout(() => {
      setCartSuccessMessage(null);
    }, 3000);
  };

  const handleOpenDrawer = (product: CatalogComponent) => {
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
    setSelectedComponent(product);
    setIsDrawerOpen(true);
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
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

  const dashboardPath = session ? roleHomeRoutes[session.user.role] : '/login';

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-teal-500/30 selection:text-teal-200">
      {cartSuccessMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-3 text-white shadow-lg animate-bounce">
          <Check className="h-5 w-5" />
          <span className="text-sm font-bold">{cartSuccessMessage}</span>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-3">
            <Box className="h-9 w-9 text-teal-500" strokeWidth={2.6} />
            <span className="text-3xl font-extrabold">
              Neo<span className="text-teal-500">HW</span>
            </span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-bold text-neutral-300 lg:flex">
            <a href="#inicio" className="text-teal-400 hover:text-teal-300 transition">Inicio</a>
            <Link to="/cliente/catalogo" className="transition hover:text-teal-400">Catálogo</Link>
            <Link to="/cliente/simulador" className="transition hover:text-teal-400">Simulador IA</Link>
            <a href="#ofertas" className="transition hover:text-teal-400">Ofertas</a>
            <a href="#beneficios" className="transition hover:text-teal-400">Beneficios</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/cliente/catalogo"
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-neutral-300 transition hover:bg-neutral-900 md:flex"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link
              to="/cliente/carrito"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-neutral-300 transition hover:bg-neutral-900"
              aria-label="Carrito"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white shadow-lg">
                  {itemCount}
                </span>
              )}
            </Link>
            {session ? (
              <div className="flex items-center gap-2">
                <Link
                  to={dashboardPath}
                  className="h-10 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 px-4 text-sm font-bold text-teal-400 transition hover:bg-teal-500/20 flex"
                >
                  Panel de {session.user.role === 'admin' ? 'Admin' : session.user.role === 'vendedor' ? 'Vendedor' : 'Cliente'}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden h-10 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/5 px-4 text-sm font-bold text-teal-400 transition hover:bg-teal-500/10 sm:flex"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 text-sm font-bold text-white transition hover:bg-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                >
                  <UserPlus className="h-4 w-4" />
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <section id="inicio" className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-[1fr_1.05fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-400">
            <Cpu className="h-4 w-4" />
            Hardware de alto rendimiento. Decisiones inteligentes.
          </div>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight sm:text-6xl text-white">
            Construye tu PC ideal con total confianza
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-400">
            Encuentra componentes para PC y verifica su compatibilidad antes de comprar con una experiencia pensada para usuarios nuevos y avanzados.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/cliente/catalogo"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-teal-500 px-7 text-base font-bold text-neutral-950 transition hover:bg-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.25)]"
            >
              Explorar catálogo
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/cliente/simulador"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-lg border border-teal-500/20 bg-teal-500/5 px-7 text-base font-bold text-teal-400 transition hover:bg-teal-500/10"
            >
              Probar simulador IA
              <Sparkles className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 text-sm font-medium text-neutral-400 sm:grid-cols-3">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-500" />
              Productos originales
            </span>
            <span className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-teal-500" />
              Garantía disponible
            </span>
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-teal-500" />
              Compra guiada
            </span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="relative"
        >
          <div className="absolute inset-10 rounded-full bg-teal-500/5 blur-[120px]" />
          <img
            src={dashboardLoginImage}
            alt="Componentes de computador NeoHW"
            className="relative w-full rounded-3xl border border-neutral-800 bg-neutral-900 object-cover shadow-2xl shadow-black/60"
          />
        </motion.div>
      </section>

      <section id="simulador" className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 shadow-xl shadow-black/20 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/5">
              <BrainCircuit className="h-10 w-10 text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Simulador de compatibilidad IA</h2>
              <p className="mt-1 text-sm leading-6 text-neutral-450">
                Analiza combinaciones de hardware para mostrar si las piezas funcionan juntas.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-center">
            <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-400" />
            <h3 className="font-bold text-emerald-400">Compatible</h3>
            <p className="mt-1 text-xs text-neutral-400">Los componentes funcionan correctamente.</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col justify-center">
            <AlertTriangle className="mb-3 h-8 w-8 text-amber-400" />
            <h3 className="font-bold text-amber-400">Advertencia</h3>
            <p className="mt-1 text-xs text-neutral-400">Puede existir alguna limitación técnica.</p>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex flex-col justify-center">
            <XCircle className="mb-3 h-8 w-8 text-rose-400" />
            <h3 className="font-bold text-rose-400">Incompatible</h3>
            <p className="mt-1 text-xs text-neutral-400">Las piezas no son recomendables juntas.</p>
          </div>
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-teal-400">Categorías</p>
            <h2 className="text-3xl font-extrabold text-white">Explorar por categoría</h2>
          </div>
          <Link to="/cliente/catalogo" className="text-sm font-bold text-teal-400 hover:text-teal-300 transition">
            Ver catálogo completo
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.slug}
                to="/cliente/catalogo"
                state={{ categorySlug: category.slug }}
                className="group rounded-xl border border-neutral-900 bg-neutral-900/30 p-5 transition hover:-translate-y-1 hover:border-teal-500/40 hover:bg-neutral-900/60"
              >
                <Icon className="h-9 w-9 text-teal-400" />
                <h3 className="mt-4 min-h-10 font-bold text-white group-hover:text-teal-300 transition">{category.name}</h3>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-teal-400">
                  Explorar
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="ofertas" className="mx-auto max-w-7xl px-5 py-14 border-t border-neutral-900">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="h-7 w-7 text-teal-400" />
            <div>
              <p className="text-sm font-bold text-teal-400">Recomendaciones</p>
              <h2 className="text-3xl font-extrabold text-white">Productos destacados</h2>
            </div>
          </div>
          <Link
            to="/cliente/catalogo"
            className="text-sm font-bold text-teal-400 hover:text-teal-300 transition"
          >
            Ver más componentes
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-80 w-full animate-pulse rounded-xl bg-neutral-900 border border-neutral-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productsList.map((item) => (
              <div
                key={item.id}
                onMouseEnter={(e) => handleMouseEnterCard(item, e)}
                onMouseLeave={handleMouseLeaveCard}
                className="group relative flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/30 p-4 transition-all duration-300 hover:border-teal-500/50 hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    {item.brand}
                  </span>
                  <div className="text-xs text-neutral-600 hover:text-rose-500 transition cursor-pointer">
                    ♥
                  </div>
                </div>
                <div
                  className="mb-4 flex h-36 items-center justify-center overflow-hidden rounded-lg bg-neutral-900/50 p-2 cursor-pointer"
                  onClick={() => handleOpenDrawer(item)}
                >
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=600&auto=format&fit=crop'}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3
                  className="mb-1 text-sm font-extrabold text-white group-hover:text-teal-400 transition cursor-pointer line-clamp-1"
                  onClick={() => handleOpenDrawer(item)}
                >
                  {item.name}
                </h3>
                <span className="text-[11px] font-bold text-neutral-500 mb-3 block">
                  {item.category}
                </span>
                <div className="mb-4 space-y-1.5 border-t border-neutral-800/50 pt-3 text-[11px] font-semibold text-neutral-400 flex-1">
                  {item.attributes && item.attributes.length > 0 ? (
                    item.attributes.slice(0, 3).map((attr, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-neutral-500">{attr.name}</span>
                        <span className="text-neutral-200 font-bold">
                          {attr.value} {attr.unit || ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-neutral-600 italic">
                      Ver detalles para especificaciones
                    </div>
                  )}
                </div>
                <div className="mb-4 flex items-center justify-between border-t border-neutral-800/50 pt-3">
                  <span className="text-lg font-black text-white">
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
                    className="flex-1 rounded-lg border border-neutral-800 px-2 py-2 text-center text-xs font-bold hover:border-neutral-700 hover:bg-neutral-900 transition text-neutral-200"
                  >
                    Ver detalles
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    disabled={item.status === 'agotado'}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-white transition ${
                      item.status === 'agotado'
                        ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed border border-neutral-700'
                        : 'bg-teal-500 hover:bg-teal-650'
                    }`}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Añadir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {}
      <section id="beneficios" className="border-t border-b border-neutral-850 bg-neutral-950 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-y-12 lg:gap-y-0">
            {}
            <div className="flex flex-col items-center text-center px-4 lg:border-r lg:border-neutral-850">
              <Cpu className="h-10 w-10 text-teal-400 mb-4" strokeWidth={1.8} />
              <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                Compatibilidad<br />inteligente
              </h3>
              <p className="text-sm text-neutral-400 max-w-[220px]">
                Verifica miles de combinaciones en tiempo real.
              </p>
            </div>

            {}
            <div className="flex flex-col items-center text-center px-4 lg:border-r lg:border-neutral-850">
              <ShieldCheck className="h-10 w-10 text-teal-400 mb-4" strokeWidth={1.8} />
              <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                Selección<br />segura
              </h3>
              <p className="text-sm text-neutral-400 max-w-[220px]">
                Evita errores y elige solo componentes compatibles.
              </p>
            </div>

            {}
            <div className="flex flex-col items-center text-center px-4 lg:border-r lg:border-neutral-850">
              <Sparkles className="h-10 w-10 text-teal-400 mb-4" strokeWidth={1.8} />
              <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                Sugerencias<br />con IA
              </h3>
              <p className="text-sm text-neutral-400 max-w-[220px]">
                Recibe recomendaciones inteligentes para tu PC.
              </p>
            </div>

            {}
            <div className="flex flex-col items-center text-center px-4">
              <ShoppingCart className="h-10 w-10 text-teal-400 mb-4" strokeWidth={1.8} />
              <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                Compra<br />confiable
              </h3>
              <p className="text-sm text-neutral-400 max-w-[220px]">
                Adquiere componentes con total confianza.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-neutral-950 px-5 py-12 border-t border-neutral-900">
        <div className="mx-auto grid max-w-7xl gap-8 text-sm text-neutral-400 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Box className="h-8 w-8 text-teal-500" strokeWidth={2.6} />
              <span className="text-2xl font-extrabold text-white">
                Neo<span className="text-teal-500">HW</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm leading-6">
              Tienda de hardware para PC con enfoque en compatibilidad, compra guiada y tecnología para decisiones inteligentes.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-white">Enlaces</h3>
            <div className="mt-3 space-y-2">
              <Link to="/cliente/catalogo" className="block hover:text-teal-400 transition">Catálogo</Link>
              <Link to="/cliente/simulador" className="block hover:text-teal-400 transition">Simulador IA</Link>
              <a href="#ofertas" className="block hover:text-teal-400 transition">Ofertas</a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white">Cuenta</h3>
            <div className="mt-3 space-y-2">
              {session ? (
                <Link to={dashboardPath} className="block hover:text-teal-400 transition">Mi Panel</Link>
              ) : (
                <>
                  <Link to="/login" className="block hover:text-teal-400 transition">Iniciar sesión</Link>
                  <Link to="/registro" className="block hover:text-teal-400 transition">Crear cuenta</Link>
                </>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white">Contacto</h3>
            <div className="mt-3 space-y-2">
              <p>soporte@neohw.com</p>
              <p>Guayaquil, Ecuador</p>
            </div>
          </div>
        </div>
      </footer>

      {}
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
    </main>
  );
};
