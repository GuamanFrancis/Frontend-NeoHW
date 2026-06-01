import { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useCart } from '../../context/CartContext';

type CheckoutStatusProps = {
  type: 'success' | 'cancel';
};

export const CheckoutStatusPage = ({ type }: CheckoutStatusProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const orderId = searchParams.get('order_id') || '';
  const isSuccess = type === 'success';

  useEffect(() => {
    if (isSuccess) {
      clearCart();
      if (orderId) {
        try {
          const paidKey = 'neohw_paid_order_ids';
          const paidOrders = JSON.parse(localStorage.getItem(paidKey) || '[]');
          if (!paidOrders.includes(orderId)) {
            paidOrders.push(orderId);
            localStorage.setItem(paidKey, JSON.stringify(paidOrders));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isSuccess, orderId, clearCart]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-neutral-900 bg-neutral-950 p-8 text-center shadow-2xl relative overflow-hidden">
        <div className={`absolute right-0 top-0 w-32 h-32 ${isSuccess ? 'bg-emerald-500/5' : 'bg-rose-500/5'} blur-3xl rounded-full pointer-events-none`} />
        
        <div className="flex flex-col items-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800">
            {isSuccess ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-bounce" />
            ) : (
              <AlertTriangle className="h-10 w-10 text-rose-500 animate-pulse" />
            )}
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            {isSuccess ? '¡Pedido Confirmado!' : 'Pedido Cancelado'}
          </h2>
          
          <p className="text-xs text-neutral-400 mt-2 font-medium max-w-sm leading-relaxed">
            {isSuccess
              ? 'Tu pedido ha sido registrado de forma exitosa y está listo para ser atendido.'
              : 'Has cancelado el proceso de pedido. Si deseas completar la compra, puedes volver a generar tu pedido desde el catálogo.'}
          </p>

          {orderId && (
            <div className="mt-6 rounded-xl bg-neutral-900/50 p-4 w-full border border-neutral-900 text-left text-xs font-semibold text-neutral-400 space-y-2">
              <div className="flex justify-between">
                <span>Número de Orden:</span>
                <span className="font-mono text-white select-all">#{orderId.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase ${
                  isSuccess ? 'bg-teal-500/10 text-teal-400' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {isSuccess ? 'Aprobado' : 'Pendiente'}
                </span>
              </div>
            </div>
          )}

          <div className="mt-8 w-full">
            <Link to="/cliente/catalogo" className="w-full block">
              <Button
                type="button"
                fullWidth
                className="bg-teal-500 hover:bg-teal-400 text-neutral-950 font-extrabold"
              >
                Volver al catálogo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
