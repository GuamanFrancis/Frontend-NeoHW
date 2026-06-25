import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Clock3,
  Package,
  ShoppingCart,
  ArrowUpRight,
  Calendar,
  Sliders,
  FileText,
  PieChart as PieIcon,
  TrendingUp,
  Search
} from 'lucide-react';
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

const statusConfig: Record<string, { label: string; color: string; textClass: string }> = {
  PENDING_PAYMENT: { label: 'Pago Confirmado', color: '#10b981', textClass: 'text-emerald-600 dark:text-emerald-400' },
  PROCESSING: { label: 'En proceso', color: '#3b82f6', textClass: 'text-blue-600 dark:text-blue-400' },
  SHIPPED: { label: 'Enviado', color: '#8b5cf6', textClass: 'text-violet-600 dark:text-violet-400' },
  DELIVERED: { label: 'Entregado', color: '#06b6d4', textClass: 'text-cyan-600 dark:text-cyan-400' },
  CANCELLED: { label: 'Cancelado', color: '#f43f5e', textClass: 'text-rose-600 dark:text-rose-400' },
};

// Robust helper to extract client name from order user/shipping info
const getClientName = (order: OrderBackend): string => {
  let name = `Usuario #${order.userId.slice(0, 8)}`;
  if (order.user) {
    const fn = order.user.firstName || '';
    const ln = order.user.lastName || '';
    const fullName = [fn, ln].filter(Boolean).join(' ');
    if (fullName) name = fullName;
  } else if (order.shippingAddress) {
    try {
      const addr = typeof order.shippingAddress === 'string'
        ? JSON.parse(order.shippingAddress)
        : order.shippingAddress;
      if (addr && typeof addr === 'object') {
        if (addr.fullName || addr.name) {
          name = addr.fullName || addr.name;
        }
      }
    } catch {
      // Ignore JSON parse error
    }
  }
  return name;
};

// Helper sub-component for target progress rings
const CircularProgressRing = ({ percentage, color, label }: { percentage: number; color: string; label: string }) => {
  const radius = 20;
  const strokeWidth = 4.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <div className="relative flex items-center justify-center h-16 w-16">
        <svg viewBox="0 0 50 50" className="h-full w-full -rotate-90">
          <circle
            cx="25"
            cy="25"
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            className="dark:stroke-neutral-800"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx="25"
            cy="25"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <span className="absolute text-sm font-medium text-slate-900 dark:text-white">
          {Math.round(percentage)}%
        </span>
      </div>
      <span className="text-xs font-medium text-slate-900 dark:text-white uppercase tracking-wider text-center max-w-[70px] truncate leading-tight">
        {label}
      </span>
    </div>
  );
};

export const VendedorEstadisticasPage = () => {
  const session = getStoredSession();
  const role = session?.user?.backendRole || 'SELLER';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'general' | 'orders' | 'pie' | 'performance'>('general');
  const [searchQuery, setSearchQuery] = useState('');

  const [orders, setOrders] = useState<OrderBackend[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredStatusIndex, setHoveredStatusIndex] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const [period, setPeriod] = useState<'diario' | 'semanal' | 'mensual'>('mensual');
  const [chartType, setChartType] = useState<'linea' | 'barras'>('linea');
  const [ordersLimit, setOrdersLimit] = useState<number>(50);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

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
    const barWidth = spacing * 0.45;
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

  const donutData = useMemo(() => {
    const rawData = isAdmin ? globalStats?.ordersByStatus : activeSellerStats?.ordersByStatus;
    if (!rawData) return [];

    const items = Object.entries(rawData).map(([statusKey, count]) => {
      const cfg = statusConfig[statusKey] || { label: statusKey, color: '#94a3b8', textClass: 'text-slate-900 dark:text-white' };
      return {
        key: statusKey,
        label: cfg.label,
        color: cfg.color,
        count: Number(count),
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



  // Calculates products sold specifically by this seller for the performance tab
  const sellerProducts = useMemo(() => {
    const productMap: Record<string, { name: string; sku: string | null; price: number; quantity: number }> = {};
    for (const order of orders) {
      if (order.status === 'DELIVERED' && Array.isArray(order.items)) {
        for (const item of order.items) {
          const pid = item.productId;
          if (!productMap[pid]) {
            productMap[pid] = {
              name: item.product?.name || 'Componente',
              sku: item.product?.sku || null,
              price: Number(item.priceAtTime || 0),
              quantity: 0,
            };
          }
          productMap[pid].quantity += Number(item.quantity || 0);
        }
      }
    }
    return Object.values(productMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [orders]);

  // Filters orders based on searchQuery
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        getClientName(o).toLowerCase().includes(query) ||
        o.id.toLowerCase().includes(query) ||
        (statusConfig[o.status] && statusConfig[o.status].label.toLowerCase().includes(query))
    );
  }, [orders, searchQuery]);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm shadow-slate-200/70 dark:bg-neutral-900 dark:shadow-black/20">
        <div className="flex h-80 flex-col items-center justify-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-20"></span>
            <div className="h-4 w-4 rounded-full bg-teal-500 animate-pulse"></div>
          </div>
          <div className="text-base font-black text-slate-900 dark:text-white">
            Cargando...
          </div>
        </div>
      </div>
    );
  }

  // Dashboard content renderer (Pestaña 1)
  const renderDashboardTab = () => {
    const revenueVal = isAdmin && globalStats ? globalStats.overview.totalRevenue : activeSellerStats.totalRevenue;
    const ordersVal = isAdmin && globalStats ? globalStats.overview.totalOrders : activeSellerStats.totalOrdersAssigned;
    const pendingVal = isAdmin ? donutData.find(d => d.key === 'PROCESSING')?.count || 0 : activeSellerStats.pendingOrders;

    const deliveryPercentage = ordersVal > 0 ? ((isAdmin && globalStats ? (donutData.find(d => d.key === 'DELIVERED')?.count || 0) : activeSellerStats.totalDelivered) / ordersVal) * 100 : 0;
    const pendingPercentage = ordersVal > 0 ? (pendingVal / ordersVal) * 100 : 0;

    return (
      <div className="space-y-6">        {/* KPI Grid with custom colored gradient stripes */}
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {/* Card 1: Earnings */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-slate-955/60">
            <div className="h-2.5 bg-gradient-to-r from-pink-500 to-rose-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-wider text-slate-900 dark:text-white">GANANCIAS</span>
                <span className="h-6 w-6 rounded-lg bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-500 text-sm">
                  $
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{formatCurrency(revenueVal)}</p>
                <p className="text-xs text-slate-900 dark:text-white font-normal mt-1">Ingresos de pedidos completados</p>
              </div>
            </div>
          </div>

          {/* Card 2: Pedidos */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-slate-955/60">
            <div className="h-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-wider text-slate-900 dark:text-white">PEDIDOS</span>
                <span className="h-6 w-6 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-500 text-sm">
                  <ShoppingCart className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{ordersVal}</p>
                <p className="text-xs text-slate-900 dark:text-white font-normal mt-1">Total de pedidos gestionados</p>
              </div>
            </div>
          </div>

          {/* Card 3: Processing */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-slate-955/60">
            <div className="h-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-wider text-slate-900 dark:text-white">PROCESANDO</span>
                <span className="h-6 w-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 text-sm">
                  <Clock3 className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{pendingVal}</p>
                <p className="text-xs text-slate-900 dark:text-white font-normal mt-1">Órdenes pendientes de despacho</p>
              </div>
            </div>
          </div>

          {/* Card 4: Progress circular rings */}
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-950/60 flex items-center justify-around">
            <CircularProgressRing percentage={deliveryPercentage} color="#2563eb" label="Entregados" />
            <CircularProgressRing percentage={pendingPercentage} color="#3b82f6" label="En proceso" />
          </div>
        </div>
        <div className="w-full">
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-955/60 flex flex-col justify-between min-h-[290px]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-3">
              <div>
                <h3 className="text-lg font-light tracking-wide text-slate-900 dark:text-white uppercase border-l-4 border-blue-600 pl-2.5">
                  Rendimiento Temporal ({period})
                </h3>
                <p className="text-xs font-normal text-slate-900 dark:text-white mt-0.5">Gráfico interactivo de facturación</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-normal text-slate-900 dark:text-white block">Ingresos Totales</span>
                <span className="text-lg font-medium text-emerald-600 dark:text-emerald-400 block">
                  {formatCurrency(totalPeriodRevenue)}
                </span>
              </div>
            </div>

            <div className="relative mt-4 flex-1 flex items-center justify-center">
              {totalPeriodRevenue === 0 ? (
                <p className="text-sm font-normal text-slate-900 dark:text-white">Sin ingresos en este período</p>
              ) : (
                <div className="w-full relative">
                  {chartType === 'linea' && (
                    <svg viewBox="0 0 500 180" className="w-full h-auto overflow-visible">
                      <defs>
                        {/* Define glowing line gradient */}
                        <linearGradient id="neonLineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#1e40af" />
                          <stop offset="50%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                        {/* Define glowing area gradient */}
                        <linearGradient id="neonAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1e40af" stopOpacity="0.22" />
                          <stop offset="50%" stopColor="#2563eb" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="50" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" className="dark:stroke-neutral-900/60" />
                      <line x1="50" y1="82.5" x2="480" y2="82.5" stroke="#f1f5f9" strokeDasharray="3 3" className="dark:stroke-neutral-900/60" />
                      <line x1="50" y1="145" x2="480" y2="145" stroke="#e2e8f0" className="dark:stroke-neutral-900" strokeWidth="1.2" />

                      {/* Glowing Area Fill */}
                      {areaPath && <path d={areaPath} fill="url(#neonAreaGradient)" />}

                      {/* Glowing Line behind for blur glow effect */}
                      {linePath && (
                        <motion.path
                          d={linePath}
                          fill="none"
                          stroke="url(#neonLineGradient)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          opacity="0.18"
                          className="blur-[3px]"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                      )}

                      {/* Main Foreground Neon Line */}
                      {linePath && (
                        <motion.path
                          d={linePath}
                          fill="none"
                          stroke="url(#neonLineGradient)"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                      )}

                      {/* Interactive Points */}
                      {chartPoints.map((pt, idx) => (
                        <g key={pt.label}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={hoveredPointIndex === idx ? 8 : 14}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPointIndex(idx)}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                          />
                          <motion.circle
                            cx={pt.x}
                            cy={pt.y}
                            r={hoveredPointIndex === idx ? 6.5 : 4.5}
                            fill={hoveredPointIndex === idx ? '#2563eb' : '#1d4ed8'}
                            stroke="#ffffff"
                            strokeWidth="2.2"
                            className="cursor-pointer dark:stroke-slate-955 transition-all duration-150"
                            onMouseEnter={() => setHoveredPointIndex(idx)}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.04 }}
                          />
                          <text
                            x={pt.x}
                            y="163"
                            textAnchor="middle"
                            fontSize="10.5"
                            className="fill-slate-900 font-normal dark:fill-white"
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
                        <linearGradient id="neonBarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1e40af" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <line x1="50" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" className="dark:stroke-neutral-900/60" />
                      <line x1="50" y1="82.5" x2="480" y2="82.5" stroke="#f1f5f9" strokeDasharray="3 3" className="dark:stroke-neutral-900/60" />
                      <line x1="50" y1="145" x2="480" y2="145" stroke="#e2e8f0" className="dark:stroke-neutral-900" strokeWidth="1.2" />

                      {barPoints.map((bar, idx) => (
                        <g key={bar.label}>
                          <motion.rect
                            x={bar.x}
                            y={bar.y}
                            width={bar.width}
                            height={bar.height}
                            fill="url(#neonBarGradient)"
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
                            y="163"
                            textAnchor="middle"
                            fontSize="10.5"
                            className="fill-slate-900 font-normal dark:fill-white"
                          >
                            {bar.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  )}

                  {/* Animated Neon Tooltip */}
                  <AnimatePresence>
                    {hoveredPointIndex !== null && periodData[hoveredPointIndex] && (
                      <motion.div
                        className="absolute z-10 rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/95 pointer-events-none min-w-[130px]"
                        style={{
                          left: `${(chartType === 'linea' ? chartPoints[hoveredPointIndex].x : barPoints[hoveredPointIndex].x + barPoints[hoveredPointIndex].width / 2) / 500 * 100}%`,
                          top: `${(chartType === 'linea' ? chartPoints[hoveredPointIndex].y : barPoints[hoveredPointIndex].y) / 180 * 100 - 38}%`,
                          transform: 'translateX(-50%)',
                        }}
                        initial={{ opacity: 0, scale: 0.9, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                          {periodData[hoveredPointIndex].fullLabel}
                        </p>
                        <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                          {formatCurrency(periodData[hoveredPointIndex].revenue)}
                        </p>
                        <p className="text-[10px] font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1 leading-none">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 inline-block"></span>
                          {periodData[hoveredPointIndex].ordersCount} {periodData[hoveredPointIndex].ordersCount === 1 ? 'pedido' : 'pedidos'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-955/60">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-3">
            <div>
              <h3 className="text-lg font-light tracking-wide text-slate-900 dark:text-white uppercase border-l-4 border-blue-600 pl-2.5">
                Detalle de Ventas
              </h3>
              <p className="text-xs font-normal text-slate-900 dark:text-white mt-0.5">Ventas por período</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-900 dark:border-neutral-900 dark:bg-neutral-900/20 dark:text-white">
                  <th className="py-3 px-3.5 font-medium uppercase tracking-wider text-xs">Intervalo</th>
                  <th className="py-3 px-3.5 font-medium uppercase tracking-wider text-xs text-right">Ventas Totales</th>
                  <th className="py-3 px-3.5 font-medium uppercase tracking-wider text-xs text-right">Pedidos</th>
                  <th className="py-3 px-3.5 font-medium uppercase tracking-wider text-xs text-right">Monto Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
                {periodData.map((item) => (
                  <tr key={item.key} className="text-slate-900 dark:text-neutral-300 hover:bg-slate-50/30 dark:hover:bg-neutral-900/40 transition-colors">
                    <td className="py-3 px-3.5 font-normal">{item.fullLabel}</td>
                    <td className="py-3 px-3.5 text-right font-normal text-slate-900 dark:text-white">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-normal">{item.ordersCount}</td>
                    <td className="py-3 px-3.5 text-right font-normal text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.ordersCount > 0 ? item.revenue / item.ordersCount : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderOrdersTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-2xl font-light tracking-wide text-slate-900 dark:text-white uppercase border-l-4 border-blue-600 pl-3">
              Ventas y Pedidos Asignados
            </h3>
            <p className="text-sm font-normal text-slate-900 dark:text-white">
              Listado de transacciones vinculadas a tu cuenta
            </p>
          </div>
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-900 dark:text-white" />
            <input
              type="text"
              placeholder="Buscar por cliente o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm font-normal rounded-xl border border-slate-200 bg-white/70 focus:border-purple-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-white"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center dark:bg-slate-955/60">
            <p className="text-sm font-normal text-slate-900 dark:text-white">No se encontraron pedidos con el criterio de búsqueda</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-slate-955/60">
            <div className="max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-955 z-10 border-b border-slate-200 dark:border-neutral-800">
                  <tr className="bg-slate-50/70 text-slate-900 dark:bg-neutral-900/40 dark:text-white">
                    <th className="py-3 px-4 font-medium uppercase tracking-wider text-xs">Código de Pedido</th>
                    <th className="py-3 px-4 font-medium uppercase tracking-wider text-xs">Cliente</th>
                    <th className="py-3 px-4 font-medium uppercase tracking-wider text-xs">Fecha de Registro</th>
                    <th className="py-3 px-4 font-medium uppercase tracking-wider text-xs text-right">Monto Total</th>
                    <th className="py-3 px-4 font-medium uppercase tracking-wider text-xs text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
                  {filteredOrders.map((order) => {
                    const cfg = statusConfig[order.status] || { label: order.status, color: '#94a3b8', textClass: 'text-slate-900 dark:text-white' };
                    return (
                      <tr key={order.id} className="text-slate-900 dark:text-neutral-300 hover:bg-slate-50/30 dark:hover:bg-neutral-900/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-normal text-slate-900 dark:text-white">
                          #{order.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="py-3 px-4 font-normal">
                          {getClientName(order)}
                        </td>
                        <td className="py-3 px-4">
                          {new Date(order.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-right font-normal text-base text-slate-900 dark:text-white">
                          {formatCurrency(Number(order.totalAmount || 0))}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-sm font-normal tracking-wide ${cfg.textClass}`}>
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPieTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-light tracking-wide text-slate-900 dark:text-white uppercase border-l-4 border-blue-600 pl-3">
            Distribución de Pedidos
          </h3>
          <p className="text-sm font-normal text-slate-900 dark:text-white mt-1">
            Desglose del volumen comercial según estados de despacho
          </p>
        </div>

        {donutTotal === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center dark:bg-neutral-950/60">
            <p className="text-sm font-normal text-slate-900 dark:text-white">No hay datos suficientes para generar el gráfico circular.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* SVG Pie Chart Wrapper */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-955/60 flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative flex items-center justify-center w-56 h-56">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="transparent"
                    stroke="#f8fafc"
                    className="dark:stroke-neutral-900/60"
                    strokeWidth="9.5"
                  />
                  {donutData.map((item, idx) => (
                    <motion.circle
                      key={item.key}
                      cx="50"
                      cy="50"
                      r="35"
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth={hoveredStatusIndex === idx ? 12.5 : 9.5}
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
                <div className="absolute flex flex-col items-center justify-center text-center p-3 rounded-full shadow-md backdrop-blur-sm bg-white/40 dark:bg-black/40 border border-slate-100/50 dark:border-neutral-800/50 w-36 h-36">
                  <span className="text-3xl font-normal text-slate-900 dark:text-white leading-none">
                    {hoveredStatusIndex !== null ? donutData[hoveredStatusIndex].count : donutTotal}
                  </span>
                  <span className="text-sm font-medium uppercase tracking-wider text-slate-900 dark:text-white mt-2 max-w-[110px] truncate block leading-tight text-center">
                    {hoveredStatusIndex !== null ? donutData[hoveredStatusIndex].label : 'Total Pedidos'}
                  </span>
                </div>
              </div>
                   {/* List and breakdowns */}
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-955/60 flex flex-col justify-center">
              <h4 className="text-base font-normal text-slate-900 dark:text-white uppercase tracking-widest mb-4">Resumen de Ventas</h4>
              <div className="space-y-3">
                {donutData.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 rounded-xl px-4 py-2"
                  >
                    <div className="min-w-0">
                      <span className="text-base font-normal block truncate" style={{ color: item.color }}>
                        {item.label}
                      </span>
                      <span className="text-sm font-normal text-slate-500 dark:text-neutral-400 block mt-0.5">
                        {item.count} {item.count === 1 ? 'pedido' : 'pedidos'}
                      </span>
                    </div>
                    <span className="ml-auto text-lg font-normal pl-4" style={{ color: item.color }}>
                      {Math.round(item.percentage * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>       </div>
          </div>
        )}
      </div>
    );
  };

  const renderPerformanceTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-light tracking-wide text-slate-900 dark:text-white uppercase border-l-4 border-blue-600 pl-3">
            Desempeño del Empleado
          </h3>
          <p className="text-sm font-normal text-slate-900 dark:text-white mt-1">
            {isAdmin ? 'Volumen comercial de cada vendedor activo' : 'Resumen detallado de despacho de componentes y eficiencia'}
          </p>
        </div>

        {isAdmin && globalStats ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Products */}
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-955/60">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3 mb-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Productos más vendidos</h4>
                <ArrowUpRight className="h-4.5 w-4.5 text-slate-900 dark:text-white" />
              </div>
              {globalStats.topProducts.length === 0 ? (
                <p className="text-sm font-bold text-slate-900 dark:text-white py-4">No hay ventas en la base de datos.</p>
              ) : (
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                  {globalStats.topProducts.map(({ product, totalSold }) => (
                    <div key={product.id} className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 dark:hover:bg-neutral-900/30 rounded-xl transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={(!failedImages[product.id] && product.imageUrl) ? product.imageUrl : '/favicon.jpg'}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover border border-slate-100 dark:border-neutral-800 shrink-0"
                          onError={() => {
                            if (product.imageUrl && product.imageUrl !== '/favicon.jpg') {
                              setFailedImages((prev) => ({ ...prev, [product.id]: true }));
                            }
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[150px] leading-tight">
                            {product.name}
                          </p>
                          <span className="text-[10px] text-slate-900 dark:text-white font-bold block mt-0.5">
                            {product.sku && product.sku !== 'N/A' && product.sku !== 'null' && product.sku !== 'undefined' && <span>SKU: {product.sku} • </span>} {formatCurrency(Number(product.price))}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-cyan-600 dark:text-cyan-400">{totalSold} unds</p>
                        <p className="text-[9px] text-slate-900 dark:text-white uppercase tracking-widest font-black">vendidos</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seller performance ranking */}
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-950/60">
              <div className="border-b border-slate-100 dark:border-neutral-900 pb-3 mb-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Rendimiento por Vendedor</h4>
              </div>
              {globalStats.sellerPerformance.length === 0 ? (
                <p className="text-sm font-bold text-slate-900 dark:text-white py-4">No hay estadísticas de vendedores.</p>
              ) : (
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                  {globalStats.sellerPerformance.map(({ seller, ordersDelivered, totalRevenue }) => (
                    <div key={seller.id} className="space-y-1.5 px-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                        <span>{seller.firstName} {seller.lastName}</span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {formatCurrency(totalRevenue)} <span className="text-[10px] font-normal text-slate-900 dark:text-white">({ordersDelivered} {ordersDelivered === 1 ? 'pedido' : 'pedidos'})</span>
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-neutral-900/60 overflow-hidden shadow-inner">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600"
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
        ) : (
          /* Seller-specific Dispatch summary with extra sections */
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm dark:from-neutral-900/60 dark:to-neutral-950/40">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                  <Package className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Eficiencia de Despacho</h4>
                  <p className="text-xs text-slate-900 dark:text-white leading-relaxed mt-0.5">
                    Se han despachado de forma exitosa <span className="font-black text-slate-900 dark:text-white">{activeSellerStats.totalDelivered}</span> de los <span className="font-black text-slate-900 dark:text-white">{activeSellerStats.totalOrdersAssigned}</span> pedidos asignados. Esto equivale a un total de <span className="font-black text-emerald-600 dark:text-emerald-400">{totalItemsSold}</span> componentes físicos de hardware suministrados por el empleado.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-950/60">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest block">Monto Promedio por Pedido</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  {formatCurrency(activeSellerStats.totalDelivered > 0 ? activeSellerStats.totalRevenue / activeSellerStats.totalDelivered : 0)}
                </p>
                <p className="text-[11px] text-slate-900 dark:text-white font-bold mt-1">Suma media facturada para las entregas completadas</p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-955/60">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest block">Volumen de Entrega</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  {activeSellerStats.totalDelivered} <span className="text-xs font-bold text-slate-900 dark:text-white">pedidos</span>
                </p>
                <p className="text-[11px] text-slate-900 dark:text-white font-bold mt-1">Total de transacciones marcadas como "Entregado"</p>
              </div>
            </div>

            {/* Dynamic Seller Top Components List */}
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-950/60">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-neutral-800 pb-2">Componentes Despachados por el Empleado</h4>
              {sellerProducts.length === 0 ? (
                <p className="text-sm font-bold text-slate-900 dark:text-white">No se han registrado entregas para cuantificar componentes despachados.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-neutral-900">
                  {sellerProducts.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3">
                      <div>
                        <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">{p.name}</span>
                        <span className="text-[10px] font-bold text-slate-900 dark:text-white mt-1 block">
                          {p.sku && p.sku !== 'N/A' && p.sku !== 'null' && p.sku !== 'undefined' && <span>SKU: {p.sku} • </span>} {formatCurrency(p.price)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-cyan-600 dark:text-cyan-400 block">{p.quantity} unds</span>
                        <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-wider block">despachadas</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm shadow-slate-200/70 dark:bg-neutral-900 dark:shadow-black/20">
      {/* Centered and well distributed horizontal navigation bar - Glued to the top */}
      <div className="flex justify-center w-full mb-3">
        <div className="flex flex-wrap gap-2.5 p-1.5 bg-slate-100/70 dark:bg-neutral-900/60 rounded-xl justify-center">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2.5 rounded-lg px-6 py-2 text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'general'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-700 dark:text-white'
                : 'text-slate-900 hover:bg-slate-200/50 dark:text-neutral-300 dark:hover:bg-neutral-800/50'
            }`}
          >
            <BarChart3 className="h-4.5 w-4.5" />
            General
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2.5 rounded-lg px-6 py-2 text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white'
                : 'text-slate-900 hover:bg-slate-200/50 dark:text-neutral-300 dark:hover:bg-neutral-800/50'
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab('pie')}
            className={`flex items-center gap-2.5 rounded-lg px-6 py-2 text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'pie'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white'
                : 'text-slate-900 hover:bg-slate-200/50 dark:text-neutral-300 dark:hover:bg-neutral-800/50'
            }`}
          >
            <PieIcon className="h-4.5 w-4.5" />
            Diagrama de Pastel
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-2.5 rounded-lg px-6 py-2 text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'performance'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white'
                : 'text-slate-900 hover:bg-slate-200/50 dark:text-neutral-300 dark:hover:bg-neutral-800/50'
            }`}
          >
            <TrendingUp className="h-4.5 w-4.5" />
            Rendimiento
          </button>
        </div>
      </div>

      {/* Control bar (Filtros) - Only rendered when tab uses them */}
      {(activeTab === 'general' || activeTab === 'orders') && (
        <div className="mb-4 rounded-2xl bg-white/70 dark:bg-slate-955/60 p-5 shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-sm font-black text-slate-800 dark:text-white block uppercase tracking-wider">Filtros</span>
                <span className="text-[10px] text-slate-900 dark:text-white font-bold">Filtros activos para la pestaña actual</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input - only on Orders tab */}
              {activeTab === 'orders' && (
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-900 dark:text-white" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs font-bold rounded-lg bg-slate-100/85 outline-none dark:bg-neutral-900/60 dark:text-white"
                  />
                </div>
              )}

              {/* Period selector - only on General tab */}
              {activeTab === 'general' && (
                <div className="flex rounded-xl bg-slate-100/80 p-1 dark:bg-neutral-900/60">
                  {(['diario', 'semanal', 'mensual'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`rounded-lg px-3.5 py-1 text-sm font-bold transition-all duration-200 cursor-pointer ${
                        period === p
                          ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white'
                          : 'text-slate-900 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              )}

              {/* Chart type selector - only on General tab */}
              {activeTab === 'general' && (
                <div className="flex rounded-xl bg-slate-100/80 p-1 dark:bg-neutral-900/60">
                  {(['linea', 'barras'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setChartType(t)}
                      className={`rounded-lg px-3.5 py-1 text-sm font-bold transition-all duration-200 cursor-pointer ${
                        chartType === t
                          ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white'
                          : 'text-slate-900 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
                      }`}
                    >
                      {t === 'linea' ? 'Línea' : 'Barras'}
                    </button>
                  ))}
                </div>
              )}

              {/* Limit selector - only on Orders tab */}
              {activeTab === 'orders' && (
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-3 py-1 dark:bg-neutral-900/60">
                  <Sliders className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
                  <select
                    value={ordersLimit}
                    onChange={(e) => setOrdersLimit(Number(e.target.value))}
                    className="bg-transparent text-sm font-bold text-slate-900 outline-none dark:text-white cursor-pointer pr-1"
                  >
                    <option value={20} className="dark:bg-neutral-950">Últimos 20 pedidos</option>
                    <option value={50} className="dark:bg-neutral-950">Últimos 50 pedidos</option>
                    <option value={100} className="dark:bg-neutral-950">Últimos 100 pedidos</option>
                    <option value={200} className="dark:bg-neutral-950">Últimos 200 pedidos</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Full width */}
      <div className="min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'general' && renderDashboardTab()}
            {activeTab === 'orders' && renderOrdersTab()}
            {activeTab === 'pie' && renderPieTab()}
            {activeTab === 'performance' && renderPerformanceTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
