import { useState, useEffect, useRef, useCallback } from 'react';
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
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  XCircle,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { Link } from 'react-router';
import heroBackgroundImage from '../../assets/images/imagen estatica login.jpg';
import { getCatalogComponents } from '../../services/catalogService';
import type { CatalogComponent } from '../../types/catalog';
import { useCart } from '../../context/CartContext';
import { ComponenteDetalleDrawer } from '../cliente/ComponenteDetalleDrawer';
import { getStoredSession } from '../../services/session';
import { roleHomeRoutes } from '../../services/authService';
import { PublicHeader } from '../../components/layout/PublicHeader';

const categories = [
  { name: 'Procesadores', icon: Cpu, slug: 'procesadores' },
  { name: 'Tarjetas gráficas', icon: Monitor, slug: 'tarjetas-graficas' },
  { name: 'Placas base', icon: Box, slug: 'placas-madre' },
  { name: 'Memorias RAM', icon: MemoryStick, slug: 'memorias-ram' },
  { name: 'Almacenamiento', icon: HardDrive, slug: 'almacenamiento' },
  { name: 'Fuentes de poder', icon: PackageCheck, slug: 'fuentes-de-poder' },
];

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

export const HomePage = () => {
  const { addToCart } = useCart();
  const session = getStoredSession();

  const [categoryProducts, setCategoryProducts] = useState<Record<string, CatalogComponent[]>>({});
  const [loading, setLoading] = useState(true);
  const [cartSuccessMessage, setCartSuccessMessage] = useState<string | null>(null);

  const [selectedComponent, setSelectedComponent] = useState<CatalogComponent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [triggerType, setTriggerType] = useState<'click' | 'hover'>('click');
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleMouseEnterCard = useCallback((item: CatalogComponent, event: React.MouseEvent) => {
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
  }, []);

  const handleMouseLeaveCard = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setTriggerType((prevTrigger) => {
      setIsDrawerOpen((prevIsOpen) => {
        if (prevIsOpen && prevTrigger === 'hover') {
          closeTimerRef.current = setTimeout(() => {
            setIsDrawerOpen(false);
            setSelectedComponent(null);
          }, 300);
        }
        return prevIsOpen;
      });
      return prevTrigger;
    });
  }, []);

  const handleMouseEnterPopup = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handleMouseLeavePopup = useCallback(() => {
    if (triggerType === 'hover') {
      closeTimerRef.current = setTimeout(() => {
        setIsDrawerOpen(false);
        setSelectedComponent(null);
      }, 300);
    }
  }, [triggerType]);

  useEffect(() => {
    const fetchAllCategoriesProducts = async () => {
      setLoading(true);
      const tempProducts: Record<string, CatalogComponent[]> = {};
      
      for (const cat of categories) {
        try {
          const response = await getCatalogComponents({ category: cat.slug, limit: 4 });
          if (response.items && response.items.length > 0) {
            tempProducts[cat.slug] = response.items;
          } 
        } catch (error) {
          console.error(error);
        }
      }
      setCategoryProducts(tempProducts);
      setLoading(false);
    };
    fetchAllCategoriesProducts();
  }, []);

  useEffect(() => {
    const scrollToSection = sessionStorage.getItem('scroll-to-section');
    if (scrollToSection) {
      sessionStorage.removeItem('scroll-to-section');
      setTimeout(() => {
        const el = document.getElementById(scrollToSection);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  }, []);

  const handleAddToCart = useCallback((product: CatalogComponent) => {
    addToCart(product);
    setCartSuccessMessage(`¡${product.name} añadido al carrito!`);
    setTimeout(() => {
      setCartSuccessMessage(null);
    }, 3000);
  }, [addToCart]);

  const handleOpenDrawer = useCallback((product: CatalogComponent) => {
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
  }, []);

  const dashboardPath = session ? roleHomeRoutes[session.user.role] : '/login';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-neutral-950 dark:text-neutral-50 selection:bg-teal-500/30 selection:text-teal-200">
      {cartSuccessMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-3 text-white shadow-lg animate-bounce">
          <Check className="h-5 w-5" />
          <span className="text-sm font-bold">{cartSuccessMessage}</span>
        </div>
      )}

      <PublicHeader />

      <section
        id="inicio"
        className="relative min-h-[calc(100vh-64px)] flex items-center"
        style={{ clipPath: 'inset(0)' }}
      >
        <img
          src={heroBackgroundImage}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none object-cover"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-teal-400">
              <Cpu className="h-4 w-4" />
              Hardware de alto rendimiento. Decisiones inteligentes.
            </div>
            <h1 className="text-5xl font-extrabold leading-tight sm:text-6xl text-white">
              Construye tu PC ideal con total confianza
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral-300 font-medium">
              Encuentra componentes para PC y verifica su compatibilidad antes de comprar con una experiencia pensada para usuarios nuevos y avanzados.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/cliente/catalogo"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-teal-500 px-7 text-base font-bold text-neutral-950 transition hover:bg-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.35)]"
              >
                Explorar catálogo
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/simulador"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-7 text-base font-bold text-white transition hover:bg-white/20"
              >
                Probar simulador IA
                <Sparkles className="h-5 w-5" />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 text-sm font-medium text-neutral-400 sm:grid-cols-3">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-400" />
                Productos originales
              </span>
              <span className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-teal-400" />
                Garantía disponible
              </span>
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-teal-400" />
                Compra guiada
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="simulador" className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white/40 dark:bg-neutral-900/40 p-6 shadow-xl shadow-black/20 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/5">
              <BrainCircuit className="h-10 w-10 text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Simulador de compatibilidad IA</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-neutral-450">
                Analiza combinaciones de hardware para mostrar si las piezas funcionan juntas.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-center">
            <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-400" />
            <h3 className="font-bold text-emerald-400">Compatible</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Los componentes funcionan correctamente.</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col justify-center">
            <AlertTriangle className="mb-3 h-8 w-8 text-amber-400" />
            <h3 className="font-bold text-amber-400">Advertencia</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Puede existir alguna limitación técnica.</p>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex flex-col justify-center">
            <XCircle className="mb-3 h-8 w-8 text-rose-400" />
            <h3 className="font-bold text-rose-400">Incompatible</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Las piezas no son recomendables juntas.</p>
          </div>
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-teal-400">Categorías</p>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Explorar por categoría</h2>
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
                className="group rounded-xl border border-slate-200 dark:border-neutral-900 bg-white dark:bg-neutral-900/30 p-5 transition hover:-translate-y-1 hover:border-teal-500/40 hover:bg-slate-50 dark:hover:bg-neutral-900/60 shadow-sm dark:shadow-none"
              >
                <Icon className="h-9 w-9 text-teal-400" />
                <h3 className="mt-4 min-h-10 font-bold text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition">{category.name}</h3>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-teal-400">
                  Explorar
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="ofertas" className="mx-auto max-w-7xl px-5 py-14 border-t border-slate-200 dark:border-neutral-900">
        {categories.map((category) => {
          const categoryProductsList = categoryProducts[category.slug] || [];
          return (
            <div key={category.slug} className="mb-16 last:mb-0">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flame className="h-7 w-7 text-teal-400" />
                  <div>
                    <p className="text-sm font-bold text-teal-400">Categoría</p>
                    <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white">{category.name}</h2>
                  </div>
                </div>
                <Link
                  to="/login"
                  className="text-sm font-bold text-teal-400 hover:text-teal-300 transition"
                >
                  Ver más
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
                  {categoryProductsList.map((item) => (
                    <div
                      key={item.id}
                      onMouseEnter={(e) => handleMouseEnterCard(item, e)}
                      onMouseLeave={handleMouseLeaveCard}
                      className="group relative flex flex-col rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 p-4 transition-all duration-300 hover:border-teal-500/50 hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] overflow-hidden shadow-sm dark:shadow-none"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
                          {item.brand}
                        </span>
                        <div className="text-xs text-neutral-600 hover:text-rose-500 transition cursor-pointer">
                          ♥
                        </div>
                      </div>
                      <div
                        className="mb-4 flex h-36 items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-neutral-900/50 p-2 cursor-pointer"
                        onClick={() => handleOpenDrawer(item)}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex items-center justify-center text-slate-350 dark:text-neutral-600">
                            <Box className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                      <h3
                        className="mb-1 text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-teal-650 dark:group-hover:text-teal-400 transition cursor-pointer line-clamp-1"
                        onClick={() => handleOpenDrawer(item)}
                      >
                        {item.name}
                      </h3>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 mb-3 block">
                        {item.category}
                      </span>
                      <div className="mb-4 space-y-1.5 border-t border-slate-100 dark:border-neutral-800/50 pt-3 text-[11px] font-semibold text-slate-550 dark:text-neutral-400 flex-1">
                        {item.attributes && item.attributes.length > 0 ? (
                          item.attributes.slice(0, 3).map((attr, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-slate-400 dark:text-neutral-500">{attr.name}</span>
                              <span className="text-slate-800 dark:text-neutral-200 font-bold">
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
                      <div className="mb-4 flex items-center justify-between border-t border-slate-100 dark:border-neutral-800/50 pt-3">
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
                          onClick={() => handleOpenDrawer(item)}
                          className="flex-1 rounded-lg border border-slate-200 dark:border-neutral-800 px-2 py-2 text-center text-xs font-bold hover:bg-slate-50 dark:hover:bg-neutral-900 transition text-slate-700 dark:text-neutral-200"
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
            </div>
          );
        })}
      </section>

      <section id="beneficios" className="border-t border-b border-slate-200 dark:border-neutral-850 bg-white dark:bg-neutral-950 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-y-12 lg:gap-y-0">
            <div className="flex flex-col items-center text-center px-4 lg:border-r lg:border-slate-200 dark:lg:border-neutral-850">
              <Cpu className="h-10 w-10 text-teal-400 mb-4" strokeWidth={1.8} />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 leading-snug">
                Compatibilidad<br />inteligente
              </h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-[220px]">
                Verifica miles de combinaciones en tiempo real.
              </p>
            </div>

            <div className="flex flex-col items-center text-center px-4 lg:border-r lg:border-slate-200 dark:lg:border-neutral-850">
              <ShieldCheck className="h-10 w-10 text-teal-400 mb-4" strokeWidth={1.8} />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 leading-snug">
                Selección<br />segura
              </h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-[220px]">
                Evita errores y elige solo componentes compatibles.
              </p>
            </div>

            <div className="flex flex-col items-center text-center px-4 lg:border-r lg:border-slate-200 dark:lg:border-neutral-850">
              <Sparkles className="h-10 w-10 text-teal-400 mb-4" strokeWidth={1.8} />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 leading-snug">
                Sugerencias<br />con IA
              </h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-[220px]">
                Recibe recomendaciones inteligentes para tu PC.
              </p>
            </div>

            <div className="flex flex-col items-center text-center px-4">
              <ShoppingCart className="h-10 w-10 text-teal-400 mb-4" strokeWidth={1.8} />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 leading-snug">
                Compra<br />confiable
              </h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-[220px]">
                Adquiere componentes con total confianza.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white dark:bg-neutral-950 px-5 py-12 border-t border-slate-200 dark:border-neutral-900">
        <div className="mx-auto grid max-w-7xl gap-8 text-sm text-slate-500 dark:text-neutral-400 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Box className="h-8 w-8 text-teal-500" strokeWidth={2.6} />
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Neo<span className="text-teal-500">HW</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm leading-6">
              Tienda de hardware para PC con enfoque en compatibilidad, compra guiada y tecnología para decisiones inteligentes.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Enlaces</h3>
            <div className="mt-3 space-y-2">
              <Link to="/cliente/catalogo" className="block hover:text-teal-400 transition">Catálogo</Link>
              <Link to="/simulador" className="block hover:text-teal-400 transition">Simulador IA</Link>
              <a href="#ofertas" className="block hover:text-teal-400 transition">Ofertas</a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Cuenta</h3>
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
            <h3 className="font-bold text-slate-800 dark:text-white">Contacto</h3>
            <div className="mt-3 space-y-2">
              <p>soporte@neohw.com</p>
              <p>Guayaquil, Ecuador</p>
            </div>
          </div>
        </div>
      </footer>

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