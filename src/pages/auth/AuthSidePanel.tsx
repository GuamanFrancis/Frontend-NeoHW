import { Box, Cpu, ShieldCheck, ShoppingCart, Sparkles } from 'lucide-react';
import dashboardLoginImage from '../../assets/images/dashboardloginandpage.png';

const benefits = [
  {
    icon: Cpu,
    title: 'Compatibilidad inteligente',
    text: 'Verifica miles de combinaciones en tiempo real.',
  },
  {
    icon: ShieldCheck,
    title: 'Seleccion segura',
    text: 'Evita errores y elige solo componentes compatibles.',
  },
  {
    icon: Sparkles,
    title: 'Sugerencias con IA',
    text: 'Recibe recomendaciones inteligentes para tu PC.',
  },
  {
    icon: ShoppingCart,
    title: 'Compra confiable',
    text: 'Adquiere componentes con total confianza.',
  },
];

export const AuthSidePanel = () => {
  return (
    <aside className="relative hidden h-full overflow-hidden bg-slate-950 px-8 py-5 text-white lg:block xl:px-12">
      <img
        src={dashboardLoginImage}
        alt="Componentes de computador NeoHW"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-teal-950/15 to-slate-950/80" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="pt-3 text-center xl:pt-5">
          <div className="inline-flex items-center gap-4">
            <Box className="h-12 w-12 text-teal-400 xl:h-14 xl:w-14" strokeWidth={2.6} />
            <h1 className="text-5xl font-extrabold leading-none xl:text-6xl">
              Neo<span className="text-teal-400">HW</span>
            </h1>
          </div>
          <p className="mt-4 text-lg font-medium text-slate-200">
            Potencia tus ideas. Ensambla sin limites.
          </p>
        </div>

        <div className="mt-auto grid grid-cols-4 pb-2 pt-5">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className={`px-3 text-center ${index > 0 ? 'border-l border-teal-200/15' : ''}`}
              >
                <Icon className="mx-auto mb-2 h-8 w-8 text-teal-400 xl:h-9 xl:w-9" strokeWidth={2.35} />
                <h2 className="mx-auto min-h-8 max-w-36 text-xs font-bold leading-tight text-white xl:text-sm">
                  {benefit.title}
                </h2>
                <p className="mx-auto mt-1.5 max-w-40 text-[11px] leading-relaxed text-slate-100 xl:text-xs">
                  {benefit.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
