import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, DollarSign, Package, ShoppingCart, Users, ArrowUpRight, Calendar, Sliders } from 'lucide-react';
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

  const [period, setPeriod] = useState<'diario' | 'semanal' | 'mensual'>('mensual');
  const [chartType, setChartType] = useState<'linea' | 'barras' | 'pastel'>('linea');
  const [ordersLimit, setOrdersLimit] = useState<number>(50);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const ordersRes = await getOrders(undefined, 1, ordersLimit);
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
  }, [isAdmin, ordersLimit]);

  const computedStats = useMemo(() => {
    const statusCounts: Record<string, number> = {
      PENDING_PAYMENT: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    let totalRevenue = 0;
    let totalDelivered = 0;
    let pendingOrders = 0;

    for (const order of orders) {
      if (statusCounts[order.status] !== undefined) {
        statusCounts[order.status]++;
      }
      if (order.status === 'DELIVERED') {
        totalRevenue += Number(order.totalAmount || 0);
        totalDelivered++;
      }
      if (order.status === 'PROCESSING') {
        pendingOrders++;
      }
    }

    return {
      totalOrdersAssigned: orders.length,
      ordersByStatus: statusCounts,
      pendingOrders,
      totalRevenue,
      totalDelivered,
    };
  }, [orders]);

  const activeSellerStats = useMemo(() => {
    if (sellerStats && sellerStats.totalOrdersAssigned > 0) {
      return sellerStats;
    }
    return computedStats;
  }, [sellerStats, computedStats]);

  const periodData = useMemo(() => {
    if (period === 'diario') {
      const list = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        list.push({
          key: d.toDateString(),
          label: d.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric' }),
          fullLabel: d.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }),
          revenue: 0,
          ordersCount: 0,
        });
      }
      for (const order of orders) {
        const orderDate = new Date(order.createdAt);
        const orderKey = orderDate.toDateString();
        const found = list.find((item) => item.key === orderKey);
        if (found) {
          found.ordersCount++;
          if (order.status === 'DELIVERED') {
            found.revenue += Number(order.totalAmount || 0);
          }
        }
      }
      return list;
    } else if (period === 'semanal') {
      const list = [];
      const now = new Date();
      for (let i = 3; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - (i * 7 + 6));
        start.setHours(0, 0, 0, 0);

        const end = new Date(now);
        end.setDate(now.getDate() - i * 7);
        end.setHours(23, 59, 59, 999);

        const label = `${start.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}`;
        list.push({
          start,
          end,
          key: `W${i}`,
          label,
          fullLabel: `Semana del ${start.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })} al ${end.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}`,
          revenue: 0,
          ordersCount: 0,
        });
      }
      for (const order of orders) {
        const orderDate = new Date(order.createdAt);
        const found = list.find((item) => orderDate >= item.start && orderDate <= item.end);
        if (found) {
          found.ordersCount++;
          if (order.status === 'DELIVERED') {
            found.revenue += Number(order.totalAmount || 0);
          }
        }
      }
      return list;
    } else {
      const list = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        list.push({
          year: d.getFullYear(),
          month: d.getMonth(),
          key: `${d.getFullYear()}-${d.getMonth()}`,
          label: d.toLocaleDateString('es-EC', { month: 'short', year: '2-digit' }),
          fullLabel: d.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }),
          revenue: 0,
          ordersCount: 0,
        });
      }
      for (const order of orders) {
        const orderDate = new Date(order.createdAt);
        const y = orderDate.getFullYear();
        const m = orderDate.getMonth();
        const found = list.find((item) => item.year === y && item.month === m);
        if (found) {
          found.ordersCount++;
          if (order.status === 'DELIVERED') {
            found.revenue += Number(order.totalAmount || 0);
          }
        }
      }
      return list;
    }
  }, [orders, period]);

  const maxValue = useMemo(() => {
    const vals = periodData.map((p) => p.revenue);
    return Math.max(...vals, 1);
  }, [periodData]);

  const chartPoints = useMemo(() => {
    if (periodData.length === 0) return [];
    return periodData.map((item, idx) => {
      const x = 50 + (idx / Math.max(periodData.length - 1, 1)) * 430;
      const y = 20 + 125 - (item.revenue / maxValue) * 125;
      return { x, y, label: item.label, fullLabel: item.fullLabel, revenue: item.revenue, ordersCount: item.ordersCount };
    });
  }, [periodData, maxValue]);

  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    let path = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 1; i < chartPoints.length; i++) {
      path += ` L ${chartPoints[i].x} ${chartPoints[i].y}`;
    }
    const lastX = chartPoints[chartPoints.length - 1].x;
    const firstX = chartPoints[0].x;
    const bottomY = 145;
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

  const barPoints = useMemo(() => {
    const spacing = 430 / Math.max(periodData.length, 1);
    const barWidth = spacing * 0.5;
    return periodData.map((item, idx) => {
      const x = 50 + idx * spacing + (spacing - barWidth) / 2;
      const barHeight = (item.revenue / maxValue) * 125;
      const y = 20 + 125 - barHeight;
      return {
        x,
        y,
        width: barWidth,
        height: barHeight,
        label: item.label,
        fullLabel: item.fullLabel,
        revenue: item.revenue,
        ordersCount: item.ordersCount,
      };
    });
  }, [periodData, maxValue]);

  const totalPeriodRevenue = useMemo(() => {
    return periodData.reduce((sum, item) => sum + item.revenue, 0);
  }, [periodData]);

  const pieSlices = useMemo(() => {
    let accumulatedLength = 0;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const colors = [
      '#06b6d4',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#f59e0b',
      '#10b981',
      '#6366f1',
    ];
    return periodData.map((item, idx) => {
      const percentage = totalPeriodRevenue > 0 ? item.revenue / totalPeriodRevenue : 0;
      const strokeLength = percentage * circumference;
      const strokeOffset = circumference - strokeLength + accumulatedLength;
      accumulatedLength += strokeLength;
      return {
        ...item,
        percentage,
        color: colors[idx % colors.length],
        strokeDasharray: `${strokeLength} ${circumference}`,
        strokeDashoffset: strokeOffset,
      };
    }).filter((item) => item.percentage > 0);
  }, [periodData, totalPeriodRevenue]);

  const donutData = useMemo(() => {
    const rawData = isAdmin ? globalStats?.ordersByStatus : activeSellerStats?.ordersByStatus;
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
  }, [isAdmin, globalStats, activeSellerStats]);

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
        icon={<BarChart3 className="h-6 w-6 text-teal-500" />}
      >
        <div className="flex h-80 flex-col items-center justify-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-20"></span>
            <div className="h-4 w-4 rounded-full bg-teal-500 animate-pulse"></div>
          </div>
          <div className="text-sm font-semibold text-slate-500 dark:text-neutral-455">
            Cargando estadísticas en tiempo real...
          </div>
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard
      title="Estadísticas de ventas"
      text={isAdmin ? "Panel de administración y métricas globales de la tienda." : "Resumen de tus ventas, pedidos y estadísticas generales."}
      icon={<BarChart3 className="h-6 w-6 text-teal-500" />}
    >
      {/* Control bar */}
      <div className="mb-8 rounded-2xl border border-slate-200/60 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-950/60 p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">Historial & Proyecciones</span>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">Filtra y visualiza el rendimiento comercial</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Period selector */}
            <div className="flex rounded-xl bg-slate-100/80 p-1 dark:bg-neutral-900/60">
              {(['diario', 'semanal', 'mensual'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                    period === p
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-neutral-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {/* Chart type selector */}
            <div className="flex rounded-xl bg-slate-100/80 p-1 dark:bg-neutral-900/60">
              {(['linea', 'barras', 'pastel'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                    chartType === t
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-neutral-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {t === 'linea' ? 'Línea' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Limit selector */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1.5 shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 dark:border-neutral-800 dark:bg-neutral-900/40">
              <Sliders className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500" />
              <select
                value={ordersLimit}
                onChange={(e) => setOrdersLimit(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none dark:text-neutral-300 cursor-pointer pr-1"
              >
                <option value={20} className="dark:bg-neutral-950">Últimos 20 pedidos</option>
                <option value={50} className="dark:bg-neutral-950">Últimos 50 pedidos</option>
                <option value={100} className="dark:bg-neutral-950">Últimos 100 pedidos</option>
                <option value={200} className="dark:bg-neutral-950">Últimos 200 pedidos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {isAdmin && globalStats ? (
          <>
            <div className="group relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 dark:border-neutral-800/80 dark:from-neutral-900/60 dark:to-neutral-950/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-neutral-500">Ventas totales</span>
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-955 dark:text-white tracking-tight">{formatCurrency(globalStats.overview.totalRevenue)}</p>
              <p className="mt-2 text-[10px] text-slate-400 dark:text-neutral-500 font-medium">Ingresos acumulados (pedidos entregados)</p>
            </div>

            <div className="group relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 dark:border-neutral-800/80 dark:from-neutral-900/60 dark:to-neutral-950/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-neutral-500">Pedidos totales</span>
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-955 dark:text-white tracking-tight">{globalStats.overview.totalOrders}</p>
              <p className="mt-2 text-[10px] text-slate-400 dark:text-neutral-500 font-medium">Total histórico de pedidos</p>
            </div>

            <div className="group relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 dark:border-neutral-800/80 dark:from-neutral-900/60 dark:to-neutral-950/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-neutral-500">Clientes registrados</span>
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-955 dark:text-white tracking-tight">{globalStats.overview.totalUsers}</p>
              <p className="mt-2 text-[10px] text-slate-400 dark:text-neutral-500 font-medium">Usuarios con rol cliente</p>
            </div>

            <div className="group relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 dark:border-neutral-800/80 dark:from-neutral-900/60 dark:to-neutral-950/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-neutral-500">Catálogo activo</span>
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform duration-300">
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-955 dark:text-white tracking-tight">{globalStats.overview.totalProducts}</p>
              <p className="mt-2 text-[10px] text-slate-400 dark:text-neutral-500 font-medium">Componentes de hardware activos</p>
            </div>
          </>
        ) : activeSellerStats ? (
          <>
            <div className="group relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 dark:border-neutral-800/80 dark:from-neutral-900/60 dark:to-neutral-950/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-neutral-500">Ventas totales</span>
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-955 dark:text-white tracking-tight">{formatCurrency(activeSellerStats.totalRevenue)}</p>
              <p className="mt-2 text-[10px] text-slate-400 dark:text-neutral-500 font-medium">Ingresos personales (pedidos entregados)</p>
            </div>

            <div className="group relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 dark:border-neutral-800/80 dark:from-neutral-900/60 dark:to-neutral-950/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-neutral-500">Pedidos asignados</span>
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-955 dark:text-white tracking-tight">{activeSellerStats.totalOrdersAssigned}</p>
              <p className="mt-2 text-[10px] text-slate-400 dark:text-neutral-500 font-medium">Pedidos asignados a tu cuenta</p>
            </div>

            <div className="group relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 dark:border-neutral-800/80 dark:from-neutral-900/60 dark:to-neutral-950/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-neutral-500">Pendientes de atención</span>
                <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform duration-300">
                  <Clock3 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-955 dark:text-white tracking-tight">{activeSellerStats.pendingOrders}</p>
              <p className="mt-2 text-[10px] text-slate-400 dark:text-neutral-500 font-medium">Pedidos en estado de procesamiento</p>
            </div>

            <div className="group relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 dark:border-neutral-800/80 dark:from-neutral-900/60 dark:to-neutral-950/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-neutral-500">Monto Promedio</span>
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-955 dark:text-white tracking-tight">
                {formatCurrency(activeSellerStats.totalDelivered > 0 ? activeSellerStats.totalRevenue / activeSellerStats.totalDelivered : 0)}
              </p>
              <p className="mt-2 text-[10px] text-slate-400 dark:text-neutral-500 font-medium">Monto medio facturado por pedido entregado</p>
            </div>
          </>
        ) : null}
      </div>

      {/* Charts Grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Main Chart card */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-950/60 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                Análisis de ventas - {period === 'diario' ? 'Diario (Últimos 7 días)' : period === 'semanal' ? 'Semanal (Últimas 4 semanas)' : 'Mensual (Últimos 6 meses)'}
              </h2>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 mt-0.5">Ingresos históricos representados visualmente</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-400 dark:text-neutral-500 block">Total período</span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 block -mt-0.5">
                {formatCurrency(totalPeriodRevenue)}
              </span>
            </div>
          </div>

          <div className="relative mt-8 flex-1 flex items-center justify-center min-h-[220px]">
            {totalPeriodRevenue === 0 && chartType === 'pastel' ? (
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500">
                  Sin ventas registradas en este período
                </p>
              </div>
            ) : periodData.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500">
                No hay ventas registradas en este período.
              </p>
            ) : (
              <div className="w-full relative">
                {chartType === 'linea' && (
                  <svg viewBox="0 0 500 180" className="w-full h-auto overflow-visible">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="50" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" className="dark:stroke-neutral-900/60" />
                    <line x1="50" y1="82.5" x2="480" y2="82.5" stroke="#f1f5f9" strokeDasharray="3 3" className="dark:stroke-neutral-900/60" />
                    <line x1="50" y1="145" x2="480" y2="145" stroke="#e2e8f0" className="dark:stroke-neutral-900" strokeWidth="1.5" />

                    {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}
                    {linePath && (
                      <motion.path
                        d={linePath}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                      />
                    )}

                    {chartPoints.map((pt, idx) => (
                      <g key={pt.label}>
                        <motion.circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredPointIndex === idx ? 7 : 4.5}
                          fill={hoveredPointIndex === idx ? '#0891b2' : '#22d3ee'}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="cursor-pointer dark:stroke-neutral-950 transition-all duration-150"
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                          onMouseLeave={() => setHoveredPointIndex(null)}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.04 }}
                        />
                        <text
                          x={pt.x}
                          y="165"
                          textAnchor="middle"
                          fontSize="9.5"
                          className="fill-slate-400 font-bold dark:fill-neutral-500"
                        >
                          {pt.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                )}

                {chartType === 'barras' && (
                  <svg viewBox="0 0 500 180" className="w-full h-auto overflow-visible">
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                    <line x1="50" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" className="dark:stroke-neutral-900/60" />
                    <line x1="50" y1="82.5" x2="480" y2="82.5" stroke="#f1f5f9" strokeDasharray="3 3" className="dark:stroke-neutral-900/60" />
                    <line x1="50" y1="145" x2="480" y2="145" stroke="#e2e8f0" className="dark:stroke-neutral-900" strokeWidth="1.5" />

                    {barPoints.map((bar, idx) => (
                      <g key={bar.label}>
                        <motion.rect
                          x={bar.x}
                          y={bar.y}
                          width={bar.width}
                          height={bar.height}
                          fill="url(#barGradient)"
                          rx="4"
                          ry="4"
                          className="cursor-pointer hover:opacity-85 transition-opacity duration-150"
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                          onMouseLeave={() => setHoveredPointIndex(null)}
                          initial={{ scaleY: 0, originY: 1 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.8, delay: idx * 0.04, ease: 'easeOut' }}
                        />
                        <text
                          x={bar.x + bar.width / 2}
                          y="165"
                          textAnchor="middle"
                          fontSize="9.5"
                          className="fill-slate-400 font-bold dark:fill-neutral-500"
                        >
                          {bar.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                )}

                {chartType === 'pastel' && (
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-8 py-2">
                    <div className="relative flex items-center justify-center w-40 h-40">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          fill="transparent"
                          stroke="#f8fafc"
                          className="dark:stroke-neutral-900/60"
                          strokeWidth="9"
                        />
                        {pieSlices.map((slice, idx) => (
                          <motion.circle
                            key={slice.key}
                            cx="50"
                            cy="50"
                            r="35"
                            fill="transparent"
                            stroke={slice.color}
                            strokeWidth={hoveredPointIndex === idx ? 12 : 9}
                            strokeDasharray={slice.strokeDasharray}
                            strokeDashoffset={slice.strokeDashoffset}
                            strokeLinecap="round"
                            onMouseEnter={() => setHoveredPointIndex(idx)}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                            className="cursor-pointer transition-all duration-150"
                            initial={{ strokeDasharray: `0 ${2 * Math.PI * 35}` }}
                            animate={{ strokeDasharray: slice.strokeDasharray }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                          />
                        ))}
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center p-3 rounded-full shadow-md backdrop-blur-sm bg-white/40 dark:bg-black/40 border border-slate-100/50 dark:border-neutral-800/50 w-24 h-24">
                        <span className="text-xs font-black text-slate-950 dark:text-white leading-tight">
                          {hoveredPointIndex !== null && pieSlices[hoveredPointIndex]
                            ? formatCurrency(pieSlices[hoveredPointIndex].revenue)
                            : formatCurrency(totalPeriodRevenue)}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-450 mt-1 max-w-[80px] truncate block text-center">
                          {hoveredPointIndex !== null && pieSlices[hoveredPointIndex]
                            ? pieSlices[hoveredPointIndex].label
                            : 'Ventas Período'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 w-full sm:w-auto max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                      {pieSlices.map((slice, idx) => (
                        <div
                          key={slice.key}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors cursor-pointer border border-transparent ${
                            hoveredPointIndex === idx
                              ? 'bg-slate-50 border-slate-100 dark:bg-neutral-900/50 dark:border-neutral-800/60'
                              : 'hover:bg-slate-50/50 dark:hover:bg-neutral-900/20'
                          }`}
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                          onMouseLeave={() => setHoveredPointIndex(null)}
                        >
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-neutral-350">
                            {slice.label}
                          </span>
                          <span className="ml-auto text-[11px] font-extrabold text-slate-955 dark:text-white pl-4">
                            {formatCurrency(slice.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Animated Tooltips */}
                <AnimatePresence>
                  {hoveredPointIndex !== null && chartType !== 'pastel' && periodData[hoveredPointIndex] && (
                    <motion.div
                      className="absolute z-10 rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/95 pointer-events-none min-w-[120px]"
                      style={{
                        left: `${chartType === 'linea'
                          ? (chartPoints[hoveredPointIndex].x / 500) * 100
                          : ((barPoints[hoveredPointIndex].x + barPoints[hoveredPointIndex].width / 2) / 500) * 100}%`,
                        top: `${chartType === 'linea'
                          ? (chartPoints[hoveredPointIndex].y / 180) * 100 - 36
                          : (barPoints[hoveredPointIndex].y / 180) * 100 - 36}%`,
                        transform: 'translateX(-50%)',
                      }}
                      initial={{ opacity: 0, scale: 0.9, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="text-[9px] font-extrabold text-slate-450 dark:text-neutral-500 uppercase tracking-wider">
                        {periodData[hoveredPointIndex].fullLabel}
                      </p>
                      <p className="text-sm font-black text-slate-950 dark:text-white mt-0.5">
                        {formatCurrency(periodData[hoveredPointIndex].revenue)}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-500 dark:text-neutral-455 mt-0.5 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 inline-block"></span>
                        {periodData[hoveredPointIndex].ordersCount} {periodData[hoveredPointIndex].ordersCount === 1 ? 'pedido' : 'pedidos'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Donut Card */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-950/60 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Estado de pedidos</h2>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 mt-0.5">Distribución porcentual de los estados de pedidos</p>
          </div>

          {donutTotal === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500">
                No hay pedidos registrados para graficar.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 mt-6">
              <div className="relative flex items-center justify-center w-36 h-36">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="transparent"
                    stroke="#f8fafc"
                    className="dark:stroke-neutral-900/60"
                    strokeWidth="9"
                  />
                  {donutData.map((item, idx) => (
                    <motion.circle
                      key={item.key}
                      cx="50"
                      cy="50"
                      r="35"
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth={hoveredStatusIndex === idx ? 12 : 9}
                      strokeDasharray={item.strokeDasharray}
                      strokeDashoffset={item.strokeDashoffset}
                      strokeLinecap="round"
                      onMouseEnter={() => setHoveredStatusIndex(idx)}
                      onMouseLeave={() => setHoveredStatusIndex(null)}
                      className="cursor-pointer transition-all duration-150"
                      initial={{ strokeDasharray: `0 ${2 * Math.PI * 35}` }}
                      animate={{ strokeDasharray: item.strokeDasharray }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  ))}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center p-3 rounded-full shadow-md backdrop-blur-sm bg-white/40 dark:bg-black/40 border border-slate-100/50 dark:border-neutral-800/50 w-24 h-24">
                  <span className="text-2xl font-black text-slate-955 dark:text-white leading-none">
                    {hoveredStatusIndex !== null ? donutData[hoveredStatusIndex].count : donutTotal}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-450 mt-1 max-w-[80px] truncate block leading-tight">
                    {hoveredStatusIndex !== null ? donutData[hoveredStatusIndex].label : 'Total Pedidos'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 w-full sm:w-auto">
                {donutData.map((item, idx) => (
                  <div
                    key={item.key}
                    className={`flex items-center gap-3 rounded-xl px-3 py-1.5 transition-colors cursor-pointer border border-transparent ${
                      hoveredStatusIndex === idx
                        ? 'bg-slate-50 border-slate-100 dark:bg-neutral-900/50 dark:border-neutral-800/60'
                        : 'hover:bg-slate-50/50 dark:hover:bg-neutral-900/20'
                    }`}
                    onMouseEnter={() => setHoveredStatusIndex(idx)}
                    onMouseLeave={() => setHoveredStatusIndex(null)}
                  >
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-slate-700 dark:text-neutral-350">
                      {item.label}
                    </span>
                    <span className="ml-auto text-xs font-extrabold text-slate-950 dark:text-white pl-4">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Table */}
      <div className="mt-6 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-950/60">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-neutral-400">
            Detalle del Período Seleccionado
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Valores numéricos consolidados correspondientes al filtro activo</p>
        </div>
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-100 dark:border-neutral-900">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-455 dark:border-neutral-900 dark:bg-neutral-900/30">
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Intervalo</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right">Ventas Totales</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right">Pedidos</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right">Monto Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
              {periodData.map((item) => (
                <tr key={item.key} className="text-slate-700 dark:text-neutral-350 hover:bg-slate-50/50 dark:hover:bg-neutral-900/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold">{item.fullLabel}</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                    {formatCurrency(item.revenue)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium">{item.ordersCount}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(item.ordersCount > 0 ? item.revenue / item.ordersCount : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin specific widgets */}
      {isAdmin && globalStats && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Top Products */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-950/60">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-955 dark:text-white">Productos más vendidos</h2>
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Componentes con mayor cantidad de unidades facturadas</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-400" />
            </div>
            {globalStats.topProducts.length === 0 ? (
              <p className="mt-4 text-xs font-semibold text-slate-400 dark:text-neutral-500">
                No hay productos vendidos en el registro de órdenes.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-slate-100 dark:divide-neutral-900">
                {globalStats.topProducts.map(({ product, totalSold }) => (
                  <div key={product.id} className="flex items-center justify-between py-3.5 hover:bg-slate-50/30 dark:hover:bg-neutral-900/10 px-1 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-11 w-11 rounded-xl object-cover border border-slate-150 dark:border-neutral-800 shadow-sm"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-neutral-900 flex items-center justify-center">
                          <Package className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-950 dark:text-white max-w-[220px] truncate leading-tight">
                          {product.name}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-neutral-500 font-medium mt-1">
                          SKU: <span className="font-bold text-slate-550 dark:text-neutral-400">{product.sku || 'N/A'}</span> • {formatCurrency(Number(product.price))}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-teal-600 dark:text-teal-400">{totalSold} unds</p>
                      <p className="text-[9px] text-slate-455 dark:text-neutral-500 uppercase tracking-wider font-bold">vendidos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seller performance */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-950/60">
            <div className="border-b border-slate-100 dark:border-neutral-900 pb-3">
              <h2 className="text-base font-extrabold text-slate-955 dark:text-white">Rendimiento por vendedor</h2>
              <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Ingresos acumulados y volumen de despacho por vendedor asignado</p>
            </div>
            {globalStats.sellerPerformance.length === 0 ? (
              <p className="mt-4 text-xs font-semibold text-slate-400 dark:text-neutral-500">
                No hay rendimiento de vendedores registrado aún.
              </p>
            ) : (
              <div className="mt-5 space-y-5">
                {globalStats.sellerPerformance.map(({ seller, ordersDelivered, totalRevenue }) => (
                  <div key={seller.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-neutral-300">
                      <span className="font-bold">{seller.firstName} {seller.lastName}</span>
                      <span className="text-slate-950 dark:text-white font-extrabold">
                        {formatCurrency(totalRevenue)} <span className="text-[10px] font-normal text-slate-400">({ordersDelivered} {ordersDelivered === 1 ? 'pedido' : 'pedidos'})</span>
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 dark:bg-neutral-900 overflow-hidden shadow-inner">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-400"
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

      {/* Seller dispatch performance summary */}
      {!isAdmin && activeSellerStats && (
        <div className="mt-6 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm dark:border-neutral-800/80 dark:from-neutral-900/60 dark:to-neutral-950/40">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-955 dark:text-white">Rendimiento de despacho</p>
              <p className="text-xs text-slate-550 dark:text-neutral-400 leading-relaxed mt-0.5">
                Has completado y despachado <span className="font-bold text-slate-955 dark:text-white">{activeSellerStats.totalDelivered}</span> de tus <span className="font-bold text-slate-955 dark:text-white">{activeSellerStats.totalOrdersAssigned}</span> pedidos asignados. Esto representa un total de <span className="font-bold text-teal-600 dark:text-teal-450">{totalItemsSold}</span> componentes físicos de hardware suministrados.
              </p>
            </div>
          </div>
        </div>
      )}
    </PageCard>
  );
};
