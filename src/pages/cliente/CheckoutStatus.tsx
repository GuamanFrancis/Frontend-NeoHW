import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { getStoredSession } from '../../services/session';

type CheckoutStatusProps = {
  type: 'success' | 'cancel';
};

export const CheckoutStatusPage = ({ type }: CheckoutStatusProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id') || '';
  const [totalAmount, setTotalAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const session = getStoredSession();
    const userId = session?.user.id;
    if (userId) {
      try {
        const ordersKey = `client_orders_${userId}`;
        const currentOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
        
        let foundOrderAmount = null;
        const updatedOrders = currentOrders.map((order: any) => {
          if (order.id === orderId) {
            foundOrderAmount = Number(order.totalAmount);
            return {
              ...order,
              status: type === 'success' ? 'PROCESSING' : 'PENDING_PAYMENT',
            };
          }
          return order;
        });

        if (foundOrderAmount !== null) {
          setTotalAmount(foundOrderAmount);
          localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));
        }

        if (type === 'success') {
          const paidKey = 'neohw_paid_order_ids';
          const paidOrders = JSON.parse(localStorage.getItem(paidKey) || '[]');
          if (!paidOrders.includes(orderId)) {
            paidOrders.push(orderId);
            localStorage.setItem(paidKey, JSON.stringify(paidOrders));
          }
        }
      } catch (e) {
        console.error('Error updating order status locally:', e);
      }
    }
  }, [orderId, type]);

  const isSuccess = type === 'success';

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
            {isSuccess ? '¡Pago Confirmado!' : 'Pago Cancelado'}
          </h2>
          
          <p className="text-xs text-neutral-400 mt-2 font-medium max-w-sm leading-relaxed">
            {isSuccess
              ? 'Tu pago con Stripe ha sido procesado de forma exitosa y el pedido está en marcha.'
              : 'Has cancelado el proceso de pago. El pedido se mantiene registrado en tu historial para que puedas completarlo cuando desees.'}
          </p>

          {orderId && (
            <div className="mt-6 rounded-xl bg-neutral-900/50 p-4 w-full border border-neutral-900 text-left text-xs font-semibold text-neutral-400 space-y-2">
              <div className="flex justify-between">
                <span>Número de Orden:</span>
                <span className="font-mono text-white select-all">#{orderId.slice(0, 8)}...</span>
              </div>
              {totalAmount !== null && (
                <div className="flex justify-between">
                  <span>Monto Total:</span>
                  <span className="font-extrabold text-white">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase ${
                  isSuccess ? 'bg-teal-500/10 text-teal-400' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {isSuccess ? 'Pagado' : 'Pendiente de Pago'}
                </span>
              </div>
            </div>
          )}

          <div className="mt-8 w-full space-y-3">
            {isSuccess ? (
              <Button
                type="button"
                fullWidth
                onClick={() => navigate('/cliente/pedidos')}
                className="bg-teal-500 hover:bg-teal-400 text-neutral-950 font-extrabold"
              >
                Ver mis pedidos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                {orderId && (
                  <Button
                    type="button"
                    fullWidth
                    onClick={() => navigate('/cliente/pedidos')}
                    className="bg-teal-500 hover:bg-teal-400 text-neutral-950 font-extrabold"
                  >
                    Reintentar pago
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  fullWidth
                  variant="outline"
                  onClick={() => navigate('/cliente/catalogo')}
                >
                  Volver al catálogo
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
