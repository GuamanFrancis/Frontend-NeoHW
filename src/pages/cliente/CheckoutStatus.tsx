import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { CheckCircle2, AlertCircle, ShoppingBag, ArrowLeft, CreditCard } from 'lucide-react';
import { useCart } from '../../context/CartContext';

type CheckoutStatusProps = {
  type: 'success' | 'cancel';
};

export const CheckoutStatusPage = ({ type }: CheckoutStatusProps) => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const orderId = searchParams.get('order_id') || '';
  const isSuccess = type === 'success';

  useEffect(() => {
    if (isSuccess) {
      clearCart(true);
    }
  }, [isSuccess, clearCart]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#070b13] px-4 text-white relative overflow-hidden font-sans">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none" />
      {isSuccess ? (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.04] blur-[180px] pointer-events-none" />
      ) : (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/[0.04] blur-[180px] pointer-events-none" />
      )}

      <div className="w-full max-w-xl rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 md:p-12 text-center shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative z-10 overflow-hidden font-sans">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] pointer-events-none" />

        <div className="flex flex-col items-center relative z-10">
          
          {/* Circular badge icon with pulse/bounce effect */}
          <div className={`mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border transition-all duration-500 relative ${
            isSuccess 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.15)]' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.15)]'
          }`}>
            {isSuccess ? (
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            ) : (
              <AlertCircle className="h-12 w-12 text-amber-400 animate-pulse" />
            )}
            
            {/* Soft inner glow ring */}
            <span className={`absolute inset-0.5 rounded-[14px] border border-dashed pointer-events-none ${
              isSuccess ? 'border-emerald-500/20' : 'border-amber-500/20'
            }`} />
          </div>

          {/* Heading */}
          <h2 className={`text-4xl font-black tracking-tight bg-gradient-to-r bg-clip-text text-transparent mb-4 ${
            isSuccess ? 'from-teal-400 via-emerald-400 to-teal-300' : 'from-amber-400 via-orange-400 to-yellow-300'
          }`}>
            {isSuccess ? '¡Pago Completado!' : 'Pago Cancelado'}
          </h2>
          
          {/* Subheading status text */}
          <p className={`text-xs font-bold uppercase tracking-widest ${
            isSuccess ? 'text-teal-400' : 'text-amber-400'
          }`}>
            {isSuccess ? 'Pedido Registrado y Aprobado' : 'Tu Pedido Sigue Activo'}
          </p>
          
          {/* Description - Made larger & clearer */}
          <p className="text-base text-slate-350 mt-6 leading-relaxed max-w-lg font-medium">
            {isSuccess
              ? 'Tu transacción ha sido procesada de forma segura por Stripe. Tu orden está en camino; un vendedor asignado preparará los componentes para su despacho a la brevedad.'
              : 'Has cancelado el proceso de pago en la pasarela de Stripe. Queremos recordarte que tu pedido NO ha sido eliminado, sino que está guardado como PENDIENTE. Puedes pagarlo en cualquier momento desde tu historial de compras.'}
          </p>

          {/* Order Details Card */}
          {orderId && (
            <div className="mt-8 w-full rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 text-left shadow-inner">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-white/[0.04]">
                Información de la Transacción
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400 font-medium">Número de Orden</span>
                  <span className="font-mono text-white select-all text-sm bg-white/[0.05] px-3 py-1 rounded-lg border border-white/[0.06] shadow-sm">
                    #{orderId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400 font-medium">Estado del Pago</span>
                  <span className={`font-black px-3.5 py-1 rounded-full text-xs uppercase border ${
                    isSuccess 
                      ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.15)]' 
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  }`}>
                    {isSuccess ? 'Aprobado' : 'Pendiente de Pago'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400 font-medium">Pasarela de Pago</span>
                  <span className="text-sm font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
                    Stripe Checkout
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full">
            {isSuccess ? (
              // Success Buttons
              <>
                <a
                  href="/cliente/catalogo"
                  className="flex-1 h-14 flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-neutral-950 font-bold uppercase tracking-wider text-xs shadow-[0_4px_20px_rgba(20,184,166,0.25)] transition duration-300 cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="h-4.5 w-4.5 text-neutral-950" />
                  <span>Volver al Catálogo</span>
                </a>
                
                <a
                  href="/cliente/pedidos"
                  className="flex-1 h-14 flex items-center justify-center gap-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] font-bold uppercase tracking-wider text-xs shadow-md transition duration-300 cursor-pointer active:scale-95"
                >
                  <ShoppingBag className="h-4.5 w-4.5 text-white" />
                  <span>Ver Mis Pedidos</span>
                </a>
              </>
            ) : (
              // Cancel Buttons
              <>
                <a
                  href="/cliente/pedidos"
                  className="flex-1 h-14 flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold uppercase tracking-wider text-xs shadow-[0_4px_20px_rgba(245,158,11,0.25)] transition duration-300 cursor-pointer active:scale-95"
                >
                  <CreditCard className="h-4.5 w-4.5 text-neutral-950" />
                  <span>Ir a Pagar en Historial</span>
                </a>
                
                <a
                  href="/cliente/catalogo"
                  className="flex-1 h-14 flex items-center justify-center gap-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] font-bold uppercase tracking-wider text-xs shadow-md transition duration-300 cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="h-4.5 w-4.5 text-white" />
                  <span>Volver al Catálogo</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
