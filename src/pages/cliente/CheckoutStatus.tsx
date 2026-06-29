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
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-neutral-955 px-4 transition-colors duration-300 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 text-center shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden relative">
        
        {/* Banner Superior */}
        <div className={`p-8 flex flex-col items-center justify-center ${
          isSuccess 
            ? 'bg-teal-600' 
            : 'bg-rose-600'
        }`}>
          {/* Círculo Blanco con Icono */}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
            {isSuccess ? (
              <CheckCircle2 className="h-9 w-9 text-teal-600" />
            ) : (
              <AlertCircle className="h-9 w-9 text-rose-600" />
            )}
          </div>

          {/* Título en Banner */}
          <h2 className="text-xl font-bold text-white tracking-wide">
            {isSuccess ? 'Su pago se ha completado correctamente' : 'Pago Cancelado'}
          </h2>
        </div>

        {/* Cuerpo de la Tarjeta */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Detalles */}
          {orderId && (
            <div className="rounded-xl bg-slate-50 dark:bg-neutral-950/40 border border-slate-100 dark:border-neutral-800 p-5 space-y-4 text-left">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-neutral-800">
                <span className="text-sm font-medium text-slate-500 dark:text-neutral-400">Número de Orden</span>
                <span className="font-mono text-sm font-semibold text-slate-800 dark:text-white select-all">
                  #{orderId}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-neutral-800">
                <span className="text-sm font-medium text-slate-500 dark:text-neutral-400">Estado del Pago</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  isSuccess 
                    ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900 text-teal-600 dark:text-teal-400' 
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400'
                }`}>
                  {isSuccess ? 'Aprobado' : 'Pendiente de Pago'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500 dark:text-neutral-400">Método de Pago</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-neutral-200">
                  Stripe Checkout
                </span>
              </div>
            </div>
          )}

          {/* Mensaje de Estado Simplificado */}
          <p className="text-sm text-slate-600 dark:text-neutral-350 leading-relaxed font-medium text-center">
            {isSuccess
              ? 'A la brevedad un vendedor preparará y despachará sus componentes.'
              : 'El pago fue cancelado. Su pedido sigue activo como PENDIENTE. Puede pagarlo en cualquier momento desde su historial.'}
          </p>

          {/* Botones de Acción */}
          <div className="flex flex-col gap-3 pt-2">
            {isSuccess ? (
              <>
                <a
                  href="/cliente/catalogo"
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition duration-200 shadow-md cursor-pointer active:scale-[0.98]"
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                  <span>Volver al Catálogo</span>
                </a>
                
                <a
                  href="/cliente/pedidos"
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-transparent hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 font-semibold transition duration-200 cursor-pointer active:scale-[0.98]"
                >
                  <ShoppingBag className="h-4.5 w-4.5" />
                  <span>Ver Mis Pedidos</span>
                </a>
              </>
            ) : (
              <>
                <a
                  href="/cliente/pedidos"
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition duration-200 shadow-md cursor-pointer active:scale-[0.98]"
                >
                  <CreditCard className="h-4.5 w-4.5" />
                  <span>Ir a Pagar en Historial</span>
                </a>
                
                <a
                  href="/cliente/catalogo"
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-transparent hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 font-semibold transition duration-200 cursor-pointer active:scale-[0.98]"
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
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
