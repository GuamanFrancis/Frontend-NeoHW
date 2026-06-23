import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router';
import videoWebm from '../../assets/video/video public.webm';
import procesadorImg from '../../assets/images/procesador.webp';
import tarjetaGraficaImg from '../../assets/images/tarjeta grafica.webp';
import placaMadreImg from '../../assets/images/placa madre.webp';
import ramImg from '../../assets/images/ram.webp';
import almacenamientoImg from '../../assets/images/ssd.webp';
import fuentesDePoderImg from '../../assets/images/fuente de poder.webp';
import gabinetesImg from '../../assets/images/case.webp';
import refrigeracionImg from '../../assets/images/refrigeracion.webp';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { useHome } from './hooks/useHome';

const CATEGORY_IMAGES: Record<string, string> = {
  'procesadores': procesadorImg,
  'tarjetas-graficas': tarjetaGraficaImg,
  'placas-madre': placaMadreImg,
  'memorias-ram': ramImg,
  'almacenamiento': almacenamientoImg,
  'fuentes-de-poder': fuentesDePoderImg,
  'gabinetes': gabinetesImg,
  'refrigeracion': refrigeracionImg
};

const CATEGORY_DETAILS: Record<string, { tag: string; title: string }> = {
  'procesadores': {
    tag: 'PROCESADOR',
    title: 'El cerebro y la potencia máxima de tu PC'
  },
  'tarjetas-graficas': {
    tag: 'TARJETA GRÁFICA',
    title: 'Gráficos de alta fidelidad y rendimiento gaming'
  },
  'placas-madre': {
    tag: 'PLACA MADRE',
    title: 'La base para conectar todos tus componentes'
  },
  'memorias-ram': {
    tag: 'MEMORIA RAM',
    title: 'Velocidad y fluidez en tu multitarea diaria'
  },
  'almacenamiento': {
    tag: 'ALMACENAMIENTO',
    title: 'Guarda recuerdos o programas'
  },
  'fuentes-de-poder': {
    tag: 'FUENTE DE PODER',
    title: 'Energía limpia y estable para tu hardware'
  },
  'gabinetes': {
    tag: 'GABINETE',
    title: 'El diseño y flujo de aire perfecto para tu setup'
  },
  'refrigeracion': {
    tag: 'REFRIGERACIÓN',
    title: 'Refrigeración óptima para bajas temperaturas'
  }
};



export const HomePage = () => {
  const {
    categories,
    dashboardPath,
    session,
  } = useHome();

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.play().catch(() => {});

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoEl.play().catch(() => {});
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(videoEl);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#eef4fa] text-slate-900 dark:bg-neutral-950 dark:text-neutral-50 overflow-x-hidden">


      <PublicHeader />

      <section
        id="inicio"
        className="relative min-h-[calc(100vh-64px)] flex items-center"
        style={{ clipPath: 'inset(0)' }}
      >
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
          }}
          className="pointer-events-none select-none"
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={videoWebm} type="video/webm" />
          </video>
          <div className="absolute inset-0 bg-black/60 z-10" />
        </div>

        <div className="relative z-10 mx-auto max-w-[95rem] px-5 py-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl font-extrabold leading-tight sm:text-6xl text-white tracking-tight">
              Construye tu PC ideal con total confianza
            </h1>
            <p className="mt-6 text-lg leading-8 text-white font-normal">
              Encuentra componentes para PC y verifica su compatibilidad antes de comprar con una experiencia pensada para usuarios nuevos y avanzados.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/catalogo"
                className="inline-flex h-14 items-center justify-center rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-7 text-base font-medium text-white transition hover:bg-white/20"
              >
                Explorar catálogo
              </Link>
              <Link
                to="/simulador"
                className="inline-flex h-14 items-center justify-center rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-7 text-base font-medium text-white transition hover:bg-white/20"
              >
                Probar simulador IA
              </Link>
            </div>
            <div className="mt-8 grid gap-4 text-lg font-normal text-white sm:grid-cols-3">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-teal-400" />
                Productos originales
              </span>
              <span className="flex items-center gap-2">
                <PackageCheck className="h-6 w-6 text-teal-400" />
                Garantía disponible
              </span>
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-teal-400" />
                Compra guiada
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="simulador" className="relative z-10 mx-auto max-w-[95rem] px-5 pt-16 pb-8">
        <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 p-8 md:p-12 shadow-xl backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-normal text-slate-955 dark:text-white tracking-tight leading-none">
                Simulador de compatibilidad IA
              </h2>
              <p className="mt-4 text-xl font-normal text-slate-955 dark:text-white leading-relaxed">
                Analiza combinaciones de hardware para mostrar si las piezas funcionan juntas.
              </p>
            </div>
            <Link
              to="/simulador"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-950 bg-slate-950 px-8 text-sm font-medium uppercase tracking-wider text-white hover:bg-transparent hover:text-slate-950 transition duration-300 dark:border-white dark:bg-white dark:text-neutral-950 dark:hover:bg-transparent dark:hover:text-white shrink-0 cursor-pointer"
            >
              Simular
            </Link>
          </div>
        </div>
      </section>
      <section className="relative z-10 w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-full border-t border-b border-slate-100 dark:border-neutral-900 bg-transparent dark:bg-neutral-950 py-20 overflow-hidden"
        >
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
          <div className="mx-auto max-w-[95rem] px-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-start gap-6">
              <div className="text-7xl font-light text-emerald-500/30 dark:text-emerald-500/20 select-none tracking-tight">01</div>
              <div>
                <span className="text-xs font-semibold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">Estado</span>
                <h3 className="text-3xl font-bold text-slate-955 dark:text-white mt-1">Compatible</h3>
              </div>
            </div>
            <p className="max-w-xl text-lg font-normal leading-relaxed text-slate-955 dark:text-white md:border-l border-slate-200 dark:border-neutral-800 md:pl-8">
              Los componentes funcionan correctamente sin incompatibilidades. Puedes armar tu ensamble con absoluta seguridad y la tranquilidad de que cada pieza es óptima para las demás.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-full border-b border-slate-100 dark:border-neutral-900 bg-transparent dark:bg-slate-955 py-20 overflow-hidden"
        >
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-rose-500/10 blur-[100px] pointer-events-none" />
          <div className="mx-auto max-w-[95rem] px-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-start gap-6">
              <div className="text-7xl font-light text-rose-500/30 dark:text-rose-500/20 select-none tracking-tight">02</div>
              <div>
                <span className="text-xs font-semibold tracking-widest text-rose-600 dark:text-rose-400 uppercase">Estado</span>
                <h3 className="text-3xl font-bold text-slate-955 dark:text-white mt-1">Incompatible</h3>
              </div>
            </div>
            <p className="max-w-xl text-lg font-normal leading-relaxed text-slate-955 dark:text-white md:border-l border-slate-200 dark:border-neutral-800 md:pl-8">
              Las piezas seleccionadas no son recomendables ni funcionarán juntas debido a limitaciones físicas o electrónicas (como sockets diferentes o fuentes insuficientes). No realices la compra sin corregirlas.
            </p>
          </div>
        </motion.div>
      </section>

      <section id="catalogo" className="relative z-10 mx-auto max-w-[95rem] px-5 py-14">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-slate-955 dark:text-white uppercase tracking-wider">Categorías</p>
          </div>
          <Link to="/catalogo#productos-catalogo" className="text-lg font-normal text-slate-955 dark:text-white hover:opacity-80 transition underline">
            Ver catálogo completo
          </Link>
        </div>
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
          {categories.map((category) => {
            const details = CATEGORY_DETAILS[category.slug] || {
              tag: category.name.toUpperCase(),
              title: `Explora componentes de ${category.name.toLowerCase()}`
            };
            return (
              <div
                key={category.slug}
                className="flex bg-white dark:bg-neutral-900/30 border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:border-slate-400 dark:hover:border-neutral-600 transition-all duration-300 min-h-[280px]"
              >
                <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center items-start space-y-5">
                  <div>
                    <span className="text-sm font-semibold uppercase tracking-[0.15em] text-teal-600 dark:text-teal-400 block mb-1">
                      {details.tag}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-955 dark:text-white leading-tight tracking-tight">
                      {details.title}
                    </h3>
                  </div>
                  <Link
                    to="/catalogo#productos-catalogo"
                    state={{ categorySlug: category.slug }}
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-955 font-medium px-6 text-sm transition uppercase tracking-wider"
                  >
                    Ver más
                  </Link>
                </div>
                <div className="w-2/5 bg-slate-100 dark:bg-neutral-950 flex items-center justify-center overflow-hidden border-l border-slate-200 dark:border-neutral-800">
                  <img
                    src={CATEGORY_IMAGES[category.slug] || '/favicon.jpg'}
                    alt={category.name}
                    className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="beneficios" className="border-t border-b border-slate-200 dark:border-neutral-800 bg-transparent dark:bg-neutral-950 py-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[95rem] h-full pointer-events-none opacity-40">
          <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl" />
        </div>
        <div className="mx-auto max-w-[95rem] px-5 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="relative group overflow-hidden rounded-2xl border border-slate-200/60 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 p-8 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:border-slate-350 dark:hover:border-neutral-700 transition-all duration-300 flex flex-col items-center text-center">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-teal-500/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-500 mb-6 relative transition-transform duration-300 group-hover:scale-110">
                <Cpu className="h-8 w-8" strokeWidth={1.8} />
              </div>
              <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-3">
                Compatibilidad inteligente
              </h3>
              <p className="text-base text-slate-955 dark:text-white leading-relaxed font-normal">
                Verifica miles de combinaciones en tiempo real.
              </p>
            </div>

            <div className="relative group overflow-hidden rounded-2xl border border-slate-200/60 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 p-8 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:border-slate-350 dark:hover:border-neutral-700 transition-all duration-300 flex flex-col items-center text-center">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-teal-500/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-500 mb-6 relative transition-transform duration-300 group-hover:scale-110">
                <ShieldCheck className="h-8 w-8" strokeWidth={1.8} />
              </div>
              <h3 className="text-xl font-bold text-slate-955 dark:text-white mb-3">
                Selección segura
              </h3>
              <p className="text-base text-slate-955 dark:text-white leading-relaxed font-normal">
                Evita errores y elige solo componentes compatibles.
              </p>
            </div>

            <div className="relative group overflow-hidden rounded-2xl border border-slate-200/60 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 p-8 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:border-slate-350 dark:hover:border-neutral-700 transition-all duration-300 flex flex-col items-center text-center">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-teal-500/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-500 mb-6 relative transition-transform duration-300 group-hover:scale-110">
                <Sparkles className="h-8 w-8" strokeWidth={1.8} />
              </div>
              <h3 className="text-xl font-bold text-slate-955 dark:text-white mb-3">
                Sugerencias con IA
              </h3>
              <p className="text-base text-slate-955 dark:text-white leading-relaxed font-normal">
                Recibe recomendaciones inteligentes para tu PC.
              </p>
            </div>

            <div className="relative group overflow-hidden rounded-2xl border border-slate-200/60 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 p-8 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:border-slate-350 dark:hover:border-neutral-700 transition-all duration-300 flex flex-col items-center text-center">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-teal-500/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-500 mb-6 relative transition-transform duration-300 group-hover:scale-110">
                <ShoppingCart className="h-8 w-8" strokeWidth={1.8} />
              </div>
              <h3 className="text-xl font-bold text-slate-955 dark:text-white mb-3">
                Compra confiable
              </h3>
              <p className="text-base text-slate-955 dark:text-white leading-relaxed font-normal">
                Adquiere componentes con total confianza.
              </p>
            </div>

          </div>
        </div>
      </section>

      <footer className="bg-white dark:bg-neutral-950 px-5 py-16 border-t border-slate-200 dark:border-neutral-900">
        <div className="mx-auto grid max-w-[95rem] gap-8 text-base text-slate-955 dark:text-white md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <img src="/favicon.jpg" alt="Logo NeoHW" className="h-8 w-8 object-cover rounded-lg" />
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Neo<span className="text-teal-500">HW</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm leading-6">
              Tienda de hardware para PC con enfoque en compatibilidad, compra guiada y tecnología para decisiones inteligentes.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-950 dark:text-white">Enlaces</h3>
            <div className="mt-3 space-y-2.5">
              <Link to="/catalogo" className="block hover:text-teal-400 transition">Catálogo</Link>
              <Link to="/simulador" className="block hover:text-teal-400 transition">Simulador IA</Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-955 dark:text-white">Cuenta</h3>
            <div className="mt-3 space-y-2.5">
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
            <h3 className="font-semibold text-slate-955 dark:text-white">Contacto</h3>
            <div className="mt-3 space-y-2.5">
              <p>soporte@neohw.com</p>
              <p>Quito, Ecuador</p>
            </div>
          </div>
        </div>
      </footer>


    </main>
  );
};