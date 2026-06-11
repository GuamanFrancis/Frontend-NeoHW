import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, DollarSign, Package, ShoppingCart, Users, ArrowUpRight } from 'lucide-react';
import { PageCard } from '../../components/ui/PageCard';
import { getOrders, type OrderBackend } from '../../services/ordersService';
import { getSellerStats, getGlobalStats, type SellerStats, type GlobalStats } from '../../services/statisticsService';
import { getStoredSession } from '../../services/session';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

const statusConfig: Record<string, { label: string; color: string; bgClass: string; textClass: string }> = {
  PENDING_PAYMENT: { label: 'Pendiente de Pago', color: '#10b981', bgClass: 'bg-emerald-400/10', textClass: 'text-emerald-700 dark:text-emerald-300' },
  PROCESSING: { label: 'En proceso', color: '#3b82f6', bgClass: 'bg-blue-400/10', textClass: 'text-blue-700 dark:text-blue-300' },
  SHIPPED: { label: 'Enviado', color: '#8b5cf6', bgClass: 'bg-violet-400/10', textClass: 'text-violet-700 dark:text-violet-300' },
  DELIVERED: { label: 'Entregado', color: '#06b6d4', bgClass: 'bg-cyan-400/10', textClass: 'text-cyan-700 dark:text-cyan-300' },
  CANCELLED: { label: 'Cancelado', color: '#f43f5e', bgClass: 'bg-rose-400/10', textClass: 'text-rose-700 dark:text-rose-300' },
};

export const VendedorEstadisticasPage = () => {
  const session = getStoredSession();
  const role = session?.user?.backendRole || 'SELLER';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const [orders, setOrders] = useState<OrderBackend[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredStatusIndex, setHoveredStatusIndex] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const ordersRes = await getOrders();
        if (active && ordersRes && Array.isArray(ordersRes.data)) {
          setOrders(ordersRes.data);
        }

        if (isAdmin) {
          const globalRes = await getGlobalStats();
          if (active && globalRes?.stats) {
            setGlobalStats(globalRes.stats);
          }
        } else {
          const sellerRes = await getSellerStats();
          if (active && sellerRes?.stats) {
            setSellerStats(sellerRes.stats);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void fetchData();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const monthlySales = useMemo(() => {
    const monthBucket = new Map<string, number>();
    for (const order of orders) {
      const date = new Date(order.createdAt);
      if (!Number.isNaN(date.getTime())) {
        const key = new Intl.DateTimeFormat('es-EC', { month: 'short', year: '2-digit' }).format(date);
        monthBucket.set(key, (monthBucket.get(key) ?? 0) + Number(order.totalAmount || 0));
      }
    }
    const dataList = Array.from(monthBucket.entries()).map(([month, amount]) => ({ month, amount }));
    const maxVal = Math.max(...dataList.map((m) => m.amount), 1);
    return {
      data: dataList,
      maxValue: maxVal,
    };
  }, [orders]);

  const chartPoints = useMemo(() => {
    const dataList = monthlySales.data;
    if (dataList.length === 0) return [];
    const width = 500;
    const height = 160;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const maxVal = monthlySales.maxValue;

    return dataList.map((item, idx) => {
      const x = paddingLeft + (idx / Math.max(dataList.length - 1, 1)) * chartWidth;
      const y = paddingTop + chartHeight - (item.amount / maxVal) * chartHeight;
      return { x, y, month: item.month, amount: item.amount };
    });
  }, [monthlySales]);

  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    let path = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 1; i < chartPoints.length; i++) {
      path += ` L ${chartPoints[i].x} ${chartPoints[i].y}`;
    }
    const lastX = chartPoints[chartPoints.length - 1].x;
    const firstX = chartPoints[0].x;
    const bottomY = 130;
    path += ` L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    return path;
  }, [chartPoints]);

  const linePath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    let path = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 1; i < chartPoints.length; i++) {
      path += ` L ${chartPoints[i].x} ${chartPoints[i].y}`;
    }
    return path;
  }, [chartPoints]);

  const donutData = useMemo(() => {
    const rawData = isAdmin ? globalStats?.ordersByStatus : sellerStats?.ordersByStatus;
    if (!rawData) return [];

    const items = Object.entries(rawData).map(([statusKey, count]) => {
      const cfg = statusConfig[statusKey] || { label: statusKey, color: '#94a3b8', bgClass: 'bg-slate-400/10', textClass: 'text-slate-700' };
      return {
        key: statusKey,
        label: cfg.label,
        color: cfg.color,
        count: Number(count),
        bgClass: cfg.bgClass,
        textClass: cfg.textClass,
      };
    }).filter(item => item.count > 0);

    const totalCount = items.reduce((sum, item) => sum + item.count, 0);

    let accumulatedLength = 0;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;

    return items.map((item) => {
      const percentage = totalCount > 0 ? item.count / totalCount : 0;
      const strokeLength = percentage * circumference;
      const strokeOffset = circumference - strokeLength + accumulatedLength;
      accumulatedLength += strokeLength;
      return {
        ...item,
        percentage,
        strokeDasharray: `${strokeLength} ${circumference}`,
        strokeDashoffset: strokeOffset,
      };
    });
  }, [isAdmin, globalStats, sellerStats]);

  const donutTotal = useMemo(() => {
    return donutData.reduce((sum, item) => sum + item.count, 0);
  }, [donutData]);

  const maxSellerRevenue = useMemo(() => {
    if (!globalStats?.sellerPerformance) return 1;
    const vals = globalStats.sellerPerformance.map(s => Number(s.totalRevenue));
    return Math.max(...vals, 1);
  }, [globalStats]);

  const totalItemsSold = useMemo(() => {
    return orders.reduce((acc, order) => {
      const itemsCount = Array.isArray(order.items)
        ? order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        : 0;
      return acc + itemsCount;
    }, 0);
  }, [orders]);

  if (isLoading) {
    return (
      <PageCard
        title="Estadísticas de ventas"
        text="Cargando resumen de pedidos, facturación y rendimiento..."
        icon={<BarChart3 className="h-6 w-6" />}
      >
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm font-semibold text-slate-500 dark:text-neutral-400">
            Cargando estadísticas...
          </div>
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard
      title="Estadísticas de ventas"
      text={isAdmin ? "Panel de administración y métricas de rendimiento comercial global." : "Resumen de pedidos, facturación y rendimiento asignado en tiempo real."}
      icon={<BarChart3 className="h-6 w-6" />}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isAdmin && globalStats ? (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-neutral-400">Ventas totales</p>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{formatCurrency(globalStats.overview.totalRevenue)}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-neutral-400">Ingresos acumulados (pedidos entregados)</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-neutral-400">Pedidos totales</p>
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{globalStats.overview.totalOrders}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-neutral-400">Total histórico de pedidos</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-neutral-400">Clientes registrados</p>
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{globalStats.overview.totalUsers}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-neutral-400">Usuarios con rol cliente</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-neutral-400">Catálogo activo</p>
                <Package className="h-4 w-4 text-cyan-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{globalStats.overview.totalProducts}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-neutral-400">Componentes de hardware activos</p>
            </div>
          </>
        ) : sellerStats ? (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-neutral-400">Ventas totales</p>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{formatCurrency(sellerStats.totalRevenue)}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-neutral-400">Ingresos personales (pedidos entregados)</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-neutral-400">Pedidos asignados</p>
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{sellerStats.totalOrdersAssigned}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-neutral-400">Pedidos asignados a tu cuenta</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-neutral-400">Pendientes de atención</p>
                <Clock3 className="h-4 w-4 text-violet-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{sellerStats.pendingOrders}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-neutral-400">Pedidos en estado de procesamiento</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-neutral-400">Ticket Promedio</p>
                <CheckCircle2 className="h-4 w-4 text-cyan-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                {formatCurrency(sellerStats.totalOrdersAssigned > 0 ? sellerStats.totalRevenue / sellerStats.totalOrdersAssigned : 0)}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-neutral-400">Monto medio facturado por pedido</p>
            </div>
          </>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Ventas por mes</h2>
          {monthlySales.data.length === 0 ? (
            <p className="mt-4 text-xs font-semibold text-slate-400 dark:text-neutral-500">
              No hay ventas registradas por mes aún.
            </p>
          ) : (
            <div className="relative mt-4">
              <svg viewBox="0 0 500 160" className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                <line x1="40" y1="20" x2="480" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" className="dark:stroke-neutral-800" />
                <line x1="40" y1="75" x2="480" y2="75" stroke="#e2e8f0" strokeDasharray="3 3" className="dark:stroke-neutral-800" />
                <line x1="40" y1="130" x2="480" y2="130" stroke="#cbd5e1" className="dark:stroke-neutral-800" />

                {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}
                {linePath && (
                  <motion.path
                    d={linePath}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                )}

                {chartPoints.map((pt, idx) => (
                  <g key={pt.month}>
                    <motion.circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPointIndex === idx ? 6 : 4}
                      fill={hoveredPointIndex === idx ? '#0891b2' : '#22d3ee'}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer dark:stroke-neutral-950"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                    />
                    <text
                      x={pt.x}
                      y="148"
                      textAnchor="middle"
                      fontSize="10"
                      className="fill-slate-500 font-semibold dark:fill-neutral-400"
                    >
                      {pt.month}
                    </text>
                  </g>
                ))}
              </svg>

              <AnimatePresence>
                {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
                  <motion.div
                    className="absolute z-10 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
                    style={{
                      left: `${(chartPoints[hoveredPointIndex].x / 500) * 100}%`,
                      top: `${(chartPoints[hoveredPointIndex].y / 160) * 100 - 35}%`,
                      transform: 'translateX(-50%)',
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="text-[10px] font-bold text-slate-500 dark:text-neutral-400">
                      {chartPoints[hoveredPointIndex].month}
                    </p>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(chartPoints[hoveredPointIndex].amount)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 flex flex-col justify-between">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Estado de pedidos</h2>
          {donutTotal === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500">
                No hay pedidos registrados para graficar.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 mt-4">
              <div className="relative flex items-center justify-center w-36 h-36">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="transparent"
                    stroke="#f1f5f9"
                    className="dark:stroke-neutral-900"
                    strokeWidth="10"
                  />
                  {donutData.map((item, idx) => (
                    <motion.circle
                      key={item.key}
                      cx="50"
                      cy="50"
                      r="35"
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth={hoveredStatusIndex === idx ? 12 : 10}
                      strokeDasharray={item.strokeDasharray}
                      strokeDashoffset={item.strokeDashoffset}
                      strokeLinecap="round"
                      onMouseEnter={() => setHoveredStatusIndex(idx)}
                      onMouseLeave={() => setHoveredStatusIndex(null)}
                      className="cursor-pointer"
                      initial={{ strokeDasharray: `0 ${2 * Math.PI * 35}` }}
                      animate={{ strokeDasharray: item.strokeDasharray }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  ))}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-slate-950 dark:text-white">
                    {hoveredStatusIndex !== null ? donutData[hoveredStatusIndex].count : donutTotal}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 max-w-[80px] truncate">
                    {hoveredStatusIndex !== null ? donutData[hoveredStatusIndex].label : 'Total Pedidos'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 w-full sm:w-auto">
                {donutData.map((item, idx) => (
                  <div
                    key={item.key}
                    className={`flex items-center gap-2 rounded-lg p-1 transition-colors ${hoveredStatusIndex === idx ? 'bg-slate-50 dark:bg-neutral-900' : ''}`}
                    onMouseEnter={() => setHoveredStatusIndex(idx)}
                    onMouseLeave={() => setHoveredStatusIndex(null)}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                      {item.label}
                    </span>
                    <span className="ml-auto text-xs font-bold text-slate-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isAdmin && globalStats && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white flex items-center justify-between">
              <span>Productos más vendidos</span>
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </h2>
            {globalStats.topProducts.length === 0 ? (
              <p className="mt-4 text-xs font-semibold text-slate-400 dark:text-neutral-500">
                No hay productos vendidos en el registro de órdenes.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100 dark:divide-neutral-900">
                {globalStats.topProducts.map(({ product, totalSold }) => (
                  <div key={product.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover border border-slate-100 dark:border-neutral-800"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
                          <Package className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-950 dark:text-white max-w-[200px] truncate">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-neutral-400">
                          SKU: {product.sku || 'N/A'} • {formatCurrency(Number(product.price))}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-teal-600 dark:text-teal-400">{totalSold} unds</p>
                      <p className="text-[10px] text-slate-400">vendidos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Rendimiento por vendedor</h2>
            {globalStats.sellerPerformance.length === 0 ? (
              <p className="mt-4 text-xs font-semibold text-slate-400 dark:text-neutral-500">
                No hay rendimiento de vendedores registrado aún.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {globalStats.sellerPerformance.map(({ seller, ordersDelivered, totalRevenue }) => (
                  <div key={seller.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-neutral-300">
                      <span>{seller.firstName} {seller.lastName}</span>
                      <span className="text-slate-900 dark:text-white">
                        {formatCurrency(totalRevenue)} ({ordersDelivered} {ordersDelivered === 1 ? 'pedido' : 'pedidos'})
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(totalRevenue / maxSellerRevenue) * 100}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!isAdmin && sellerStats && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950 dark:text-white">Rendimiento de despacho</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Has despachado <span className="font-bold text-slate-950 dark:text-white">{sellerStats.totalDelivered}</span> de tus <span className="font-bold text-slate-950 dark:text-white">{sellerStats.totalOrdersAssigned}</span> pedidos totales asignados (con <span className="font-bold text-slate-950 dark:text-white">{totalItemsSold}</span> productos vendidos).
              </p>
            </div>
          </div>
        </div>
      )}
    </PageCard>
  );
};
