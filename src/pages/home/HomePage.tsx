import { motion } from 'framer-motion';
import {
  ArrowRight,
  Box,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Flame,
  HardDrive,
  Headphones,
  MemoryStick,
  Monitor,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  UserPlus,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router';
import dashboardLoginImage from '../../assets/images/dashboardloginandpage.png';

const categories = [
  { name: 'Procesadores', icon: Cpu },
  { name: 'Tarjetas graficas', icon: Monitor },
  { name: 'Placas base', icon: Box },
  { name: 'Memorias RAM', icon: MemoryStick },
  { name: 'Almacenamiento', icon: HardDrive },
  { name: 'Fuentes de poder', icon: PackageCheck },
];

const products = [
  { name: 'AMD Ryzen 9', category: 'Procesador', price: '$449.990' },
  { name: 'RTX Gaming OC', category: 'Tarjeta grafica', price: '$849.990' },
  { name: 'B650 Tomahawk', category: 'Placa base', price: '$229.990' },
  { name: 'Vengeance RGB', category: 'Memoria RAM', price: '$149.990' },
];

const services = [
  {
    icon: Truck,
    title: 'Envios seguros',
    text: 'Recibe tus componentes con seguimiento y cuidado.',
  },
  {
    icon: BrainCircuit,
    title: 'Compatibilidad asistida',
    text: 'Evita errores antes de comprar las piezas de tu PC.',
  },
  {
    icon: ShieldCheck,
    title: 'Compra confiable',
    text: 'Componentes revisados para armar con tranquilidad.',
  },
  {
    icon: Headphones,
    title: 'Soporte cercano',
    text: 'Ayuda pensada para usuarios con o sin experiencia.',
  },
];

export const HomePage = () => {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-3">
            <Box className="h-9 w-9 text-teal-500" strokeWidth={2.6} />
            <span className="text-3xl font-extrabold">
              Neo<span className="text-teal-500">HW</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-bold text-slate-700 dark:text-neutral-300 lg:flex">
            <a href="#inicio" className="text-teal-600">Inicio</a>
            <a href="#catalogo" className="transition hover:text-teal-600 dark:hover:text-teal-300">Catalogo</a>
            <a href="#simulador" className="transition hover:text-teal-600 dark:hover:text-teal-300">Simulador IA</a>
            <a href="#ofertas" className="transition hover:text-teal-600 dark:hover:text-teal-300">Ofertas</a>
            <a href="#nosotros" className="transition hover:text-teal-600 dark:hover:text-teal-300">Nosotros</a>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-900 md:flex" aria-label="Buscar">
              <Search className="h-5 w-5" />
            </button>
            <button type="button" className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-900 md:flex" aria-label="Carrito">
              <ShoppingCart className="h-5 w-5" />
            </button>
            <Link
              to="/login"
              className="hidden h-10 items-center justify-center rounded-lg border border-teal-500/40 px-4 text-sm font-bold text-teal-700 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-neutral-900 sm:flex"
            >
              Iniciar sesion
            </Link>
            <Link
              to="/registro"
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 text-sm font-bold text-white transition hover:bg-teal-400"
            >
              <UserPlus className="h-4 w-4" />
              Crear cuenta
            </Link>
          </div>
        </nav>
      </header>

      <section id="inicio" className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-[1fr_1.05fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-500/25 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 dark:bg-neutral-900 dark:text-teal-300">
            <Cpu className="h-4 w-4" />
            Hardware de alto rendimiento. Decisiones inteligentes.
          </div>

          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight sm:text-6xl">
            Construye tu PC ideal con total confianza
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-neutral-300">
            Encuentra componentes para PC y verifica su compatibilidad antes de comprar con una experiencia pensada para usuarios nuevos y avanzados.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href="#catalogo"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-teal-500 px-7 text-base font-bold text-white transition hover:bg-teal-400"
            >
              Explorar catalogo
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href="#simulador"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-lg border border-teal-500/40 px-7 text-base font-bold text-teal-700 transition hover:bg-teal-50 dark:text-teal-200 dark:hover:bg-neutral-900"
            >
              Probar simulador IA
              <Sparkles className="h-5 w-5" />
            </a>
          </div>

          <div className="mt-8 grid gap-4 text-sm font-medium text-slate-600 dark:text-neutral-300 sm:grid-cols-3">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-500" />
              Productos originales
            </span>
            <span className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-teal-500" />
              Garantia disponible
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
          <div className="absolute inset-10 rounded-full bg-teal-200/40 blur-3xl dark:bg-neutral-800/70" />
          <img
            src={dashboardLoginImage}
            alt="Componentes de computador NeoHW"
            className="relative w-full rounded-3xl border border-slate-200 bg-white object-cover shadow-2xl shadow-slate-200/70 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/40"
          />
        </motion.div>
      </section>

      <section id="simulador" className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/30 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-50 dark:bg-neutral-950">
              <BrainCircuit className="h-10 w-10 text-teal-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Simulador de compatibilidad IA</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-neutral-300">
                Analiza combinaciones de hardware para mostrar si las piezas funcionan juntas.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-400/35 bg-emerald-50 p-4 dark:bg-neutral-950">
            <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-600" />
            <h3 className="font-bold text-emerald-700">Compatible</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">Los componentes funcionan correctamente.</p>
          </div>

          <div className="rounded-xl border border-amber-400/35 bg-amber-50 p-4 dark:bg-neutral-950">
            <AlertTriangle className="mb-3 h-8 w-8 text-amber-600" />
            <h3 className="font-bold text-amber-700">Advertencia</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">Puede existir alguna limitacion tecnica.</p>
          </div>

          <div className="rounded-xl border border-red-400/35 bg-red-50 p-4 dark:bg-neutral-950">
            <XCircle className="mb-3 h-8 w-8 text-red-600" />
            <h3 className="font-bold text-red-700">Incompatible</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">Las piezas no son recomendables juntas.</p>
          </div>
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-teal-600">Catalogo</p>
            <h2 className="text-3xl font-extrabold">Categorias destacadas</h2>
          </div>
          <a href="#ofertas" className="hidden text-sm font-bold text-teal-600 hover:text-teal-500 sm:block">
            Ver productos destacados
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <article key={category.name} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-400 dark:border-neutral-800 dark:bg-neutral-900">
                <Icon className="h-9 w-9 text-teal-500" />
                <h3 className="mt-4 min-h-10 font-bold">{category.name}</h3>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-teal-600">
                  Explorar
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </article>
            );
          })}
        </div>
      </section>

      <section id="ofertas" className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-5 flex items-center gap-3">
          <Flame className="h-7 w-7 text-teal-500" />
          <div>
            <p className="text-sm font-bold text-teal-600">Ofertas</p>
            <h2 className="text-3xl font-extrabold">Productos destacados</h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <article key={product.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-4 flex h-28 items-center justify-center rounded-lg bg-slate-100 dark:bg-neutral-950">
                <Cpu className="h-12 w-12 text-teal-500" />
              </div>
              <p className="text-xs font-bold text-teal-600">{product.category}</p>
              <h3 className="mt-1 text-lg font-bold">{product.name}</h3>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-extrabold">{product.price}</p>
                  <p className="text-sm text-emerald-600">En stock</p>
                </div>
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/40 text-teal-600 transition hover:bg-teal-50" aria-label="Agregar al carrito">
                  <ShoppingCart className="h-5 w-5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="nosotros" className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div key={service.title} className="flex gap-4">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-teal-50 dark:bg-neutral-950">
                  <Icon className="h-7 w-7 text-teal-500" />
                </div>
                <div>
                  <h3 className="font-bold">{service.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-neutral-300">{service.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-8 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto grid max-w-7xl gap-8 text-sm text-slate-600 dark:text-neutral-300 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Box className="h-8 w-8 text-teal-500" strokeWidth={2.6} />
              <span className="text-2xl font-extrabold text-slate-950 dark:text-white">
                Neo<span className="text-teal-500">HW</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm leading-6">
              Tienda de hardware para PC con enfoque en compatibilidad, compra guiada y tecnologia para decisiones inteligentes.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-950 dark:text-white">Enlaces</h3>
            <div className="mt-3 space-y-2">
              <a href="#catalogo" className="block hover:text-teal-600">Catalogo</a>
              <a href="#simulador" className="block hover:text-teal-600">Simulador IA</a>
              <a href="#ofertas" className="block hover:text-teal-600">Ofertas</a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-950 dark:text-white">Cuenta</h3>
            <div className="mt-3 space-y-2">
              <Link to="/login" className="block hover:text-teal-600">Iniciar sesion</Link>
              <Link to="/registro" className="block hover:text-teal-600">Crear cuenta</Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-950 dark:text-white">Contacto</h3>
            <div className="mt-3 space-y-2">
              <p>soporte@neohw.com</p>
              <p>Guayaquil, Ecuador</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};
