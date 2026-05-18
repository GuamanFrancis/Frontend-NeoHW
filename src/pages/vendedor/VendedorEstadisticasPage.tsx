import { useMemo } from 'react';
import { BarChart3, CheckCircle2, Clock3, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { PageCard } from '../../components/ui/PageCard';
import { sellerOrdersData, type SellerOrderStatus } from './sellerOrdersData';

const statusOrder: SellerOrderStatus[] = ['Pendiente', 'En proceso', 'Enviado', 'Entregado', 'Cancelado'];

const statusLabelStyle: Record<SellerOrderStatus, string> = {
  Pendiente: 'bg-emerald-400/10 text-emerald-700 dark:text-emerald-300',
  'En proceso': 'bg-blue-400/10 text-blue-700 dark:text-blue-300',
  Enviado: 'bg-violet-400/10 text-violet-700 dark:text-violet-300',
  Entregado: 'bg-cyan-400/10 text-cyan-700 dark:text-cyan-300',
  Cancelado: 'bg-rose-400/10 text-rose-700 dark:text-rose-300',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

export const VendedorEstadisticasPage = () => {
  const {
    totalOrders,
    totalRevenue,
    completedOrders,
    pendingOrders,
    avgTicket,
    totalItems,
    statusStats,
    monthlySales,
    maxMonthValue,
  } = useMemo(() => {
    const total = sellerOrdersData.length;
    const revenue = sellerOrdersData.reduce((acc, order) => acc + order.total, 0);
    const completed = sellerOrdersData.filter((order) => order.status === 'Entregado').length;
    const pending = sellerOrdersData.filter((order) => order.status === 'Pendiente' || order.status === 'En proceso').length;
    const items = sellerOrdersData.reduce((acc, order) => acc + order.itemsCount, 0);

    const byStatus = statusOrder.map((status) => ({
      status,
      count: sellerOrdersData.filter((order) => order.status === status).length,
    }));

    const monthBucket = new Map<string, number>();
    for (const order of sellerOrdersData) {
      const date = new Date(order.createdAt);
      const key = new Intl.DateTimeFormat('es-EC', { month: 'short', year: '2-digit' }).format(date);
      monthBucket.set(key, (monthBucket.get(key) ?? 0) + order.total);
    }

    const monthly = Array.from(monthBucket.entries()).map(([month, amount]) => ({ month, amount }));
    const maxMonth = monthly.reduce((max, month) => Math.max(max, month.amount), 0);

    return {
      totalOrders: total,
      totalRevenue: revenue,
      completedOrders: completed,
      pendingOrders: pending,
      avgTicket: total > 0 ? revenue / total : 0,
      totalItems: items,
      statusStats: byStatus,
      monthlySales: monthly,
      maxMonthValue: maxMonth || 1,
    };
  }, []);

  return (
    <PageCard
      title="Estadisticas de ventas"
      text="Resumen de pedidos, facturacion y rendimiento del vendedor."
      icon={<BarChart3 className="h-6 w-6" />}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-neutral-400">Ventas totales</p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{formatCurrency(totalRevenue)}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-neutral-400">Ingresos acumulados de pedidos registrados.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-neutral-400">Pedidos totales</p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{totalOrders}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-neutral-400">Pedidos procesados en la vista comercial.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-neutral-400">Ticket promedio</p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{formatCurrency(avgTicket)}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-neutral-400">Promedio por pedido.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Ventas por mes</h2>
          <div className="mt-4 space-y-3">
            {monthlySales.map((month) => (
              <div key={month.month}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-neutral-300">{month.month}</span>
                  <span className="font-semibold text-teal-700 dark:text-teal-300">{formatCurrency(month.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-neutral-800">
                  <div
                    className="h-2 rounded-full bg-teal-500"
                    style={{ width: `${Math.max(8, (month.amount / maxMonthValue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Estado de pedidos</h2>
          <div className="mt-4 space-y-3">
            {statusStats.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusLabelStyle[item.status]}`}>
                  {item.status}
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-neutral-200">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-300">
            <ShoppingCart className="h-4 w-4" />
            <p className="text-sm font-semibold">Pedidos completados</p>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{completedOrders}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-300">
            <Clock3 className="h-4 w-4" />
            <p className="text-sm font-semibold">Pendientes y en proceso</p>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{pendingOrders}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-300">
            <Package className="h-4 w-4" />
            <p className="text-sm font-semibold">Productos vendidos</p>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{totalItems}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-300">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-sm font-semibold">Ingreso promedio</p>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{formatCurrency(avgTicket)}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-neutral-400">
            <DollarSign className="h-3.5 w-3.5" />
            <span>por pedido</span>
          </div>
        </div>
      </div>
    </PageCard>
  );
};
