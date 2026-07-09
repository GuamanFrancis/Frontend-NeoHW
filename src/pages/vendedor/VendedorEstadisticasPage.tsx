import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Clock3,
  ShoppingCart,
  TrendingUp,
  XCircle,
  Truck,
  FileText,
  Sliders,
  Search
} from 'lucide-react';
import { getOrders, type OrderBackend } from '../../services/ordersService';
import { getSellerStats, type SellerStats } from '../../services/statisticsService';
import { motion, AnimatePresence } from 'framer-motion';

const actionButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-teal-500/60 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 dark:hover:text-teal-200 cursor-pointer text-xs font-bold';

const fieldClass =
  'h-8 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:border-teal-400 dark:disabled:bg-neutral-900 font-bold';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

const statusConfig: Record<string, { label: string; textClass: string }> = {
  PENDING_PAYMENT: { label: 'Pendiente', textClass: 'text-emerald-600 dark:text-emerald-455 font-bold text-sm' },
  PROCESSING: { label: 'En proceso', textClass: 'text-blue-600 dark:text-blue-450 font-bold text-sm' },
  SHIPPED: { label: 'Enviado', textClass: 'text-purple-650 dark:text-purple-400 font-bold text-sm' },
  DELIVERED: { label: 'Entregado', textClass: 'text-cyan-600 dark:text-cyan-455 font-bold text-sm' },
  CANCELLED: { label: 'Cancelado', textClass: 'text-rose-600 dark:text-rose-455 font-bold text-sm' },
};

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

export const VendedorEstadisticasPage = () => {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'general' | 'orders' | 'performance'>('general');
  const [searchQuery, setSearchQuery] = useState('');

  const [orders, setOrders] = useState<OrderBackend[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const [period, setPeriod] = useState<'diario' | 'semanal' | 'mensual'>('mensual');
  const [chartType, setChartType] = useState<'linea' | 'barras'>('linea');
  const [ordersLimit, setOrdersLimit] = useState<number>(50);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [maxVisitedPage, setMaxVisitedPage] = useState(1);

  useEffect(() => {
    if (currentPage === 1) {
      setMaxVisitedPage(1);
    } else {
      setMaxVisitedPage((prev) => Math.max(prev, currentPage));
    }
  }, [currentPage]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setIsLoading(true);

      // Fetch seller specific orders
      try {
        const ordersRes = await getOrders(undefined, 1, ordersLimit);
        if (active && ordersRes && Array.isArray(ordersRes.data)) {
          setOrders(ordersRes.data);
        }
      } catch (err) {
        console.error('Error fetching seller orders:', err);
      }

      // Fetch seller stats
      try {
        const sellerRes = await getSellerStats();
        if (active && sellerRes?.stats) {
          setSellerStats(sellerRes.stats);
        }
      } catch (err) {
        console.error('Error fetching seller stats:', err);
      }

      if (active) setIsLoading(false);
    };

    void fetchData();

    return () => {
      active = false;
    };
  }, [ordersLimit]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter((order) => {
      const orderCode = order.trackingCode || `#${order.id.slice(0, 8).toUpperCase()}`;
      const orderIdMatch = orderCode.toLowerCase().includes(query);
      const userEmailMatch = order.user?.email?.toLowerCase().includes(query);
      const userNameMatch = getClientName(order).toLowerCase().includes(query);
      const statusMatch = order.status.toLowerCase().includes(query);
      return orderIdMatch || userEmailMatch || userNameMatch || statusMatch;
    });
  }, [orders, searchQuery]);

  // Compute period data for charts and tables
  const periodData = useMemo(() => {
    const groups: Record<
      string,
      { revenue: number; ordersCount: number; label: string; date: Date; fullLabel: string }
    > = {};

    // 1. Pre-populate the last 6 intervals starting from today
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      let key = '';
      let label = '';
      let fullLabel = '';

      if (period === 'diario') {
        d.setDate(today.getDate() - i);
        const dayStr = d.getDate().toString().padStart(2, '0');
        const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
        key = `${d.getFullYear()}-${monthStr}-${dayStr}`;
        label = `${dayStr}/${monthStr}`;
        fullLabel = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
      } else if (period === 'semanal') {
        d.setDate(today.getDate() - i * 7);
        const oneJan = new Date(d.getFullYear(), 0, 1);
        const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
        const weekNum = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
        key = `${d.getFullYear()}-W${weekNum}`;
        label = `S${weekNum}`;
        fullLabel = `Semana ${weekNum} - ${d.getFullYear()}`;
      } else {
        // mensual
        d.setMonth(today.getMonth() - i);
        const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
        key = `${d.getFullYear()}-${monthStr}`;
        label = d.toLocaleString('es-ES', { month: 'short' });
        fullLabel = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      }

      groups[key] = {
        revenue: 0,
        ordersCount: 0,
        label,
        date: d,
        fullLabel,
      };
    }

    // 2. Populate with orders data
    orders.forEach((order) => {
      if (order.status !== 'DELIVERED') return;

      const date = new Date(order.createdAt);
      let key = '';

      if (period === 'diario') {
        const dayStr = date.getDate().toString().padStart(2, '0');
        const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
        key = `${date.getFullYear()}-${monthStr}-${dayStr}`;
      } else if (period === 'semanal') {
        const oneJan = new Date(date.getFullYear(), 0, 1);
        const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
        const weekNum = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
        key = `${date.getFullYear()}-W${weekNum}`;
      } else {
        const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
        key = `${date.getFullYear()}-${monthStr}`;
      }

      if (groups[key]) {
        groups[key].ordersCount++;
        groups[key].revenue += Number(order.totalAmount || 0);
      }
    });

    return Object.entries(groups)
      .map(([key, value]) => ({
        key,
        revenue: value.revenue,
        ordersCount: value.ordersCount,
        label: value.label,
        fullLabel: value.fullLabel,
        date: value.date,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [orders, period]);

  const maxValue = useMemo(() => {
    const vals = periodData.map((item) => item.revenue);
    return vals.length > 0 ? Math.max(...vals, 100) : 100;
  }, [periodData]);

  // Chart coordinates
  const chartPoints = useMemo(() => {
    if (periodData.length === 0) return [];
    const width = 430;
    const height = 125;
    const startX = 50;
    const startY = 145;

    return periodData.map((item, idx) => {
      const x = startX + (idx / (periodData.length - 1 || 1)) * width;
      const y = startY - (item.revenue / maxValue) * height;
      return { x, y, label: item.label };
    });
  }, [periodData, maxValue]);

  const linePath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return chartPoints.reduce((path, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
    }, '');
  }, [chartPoints]);

  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    return `${linePath} L ${last.x} 145 L ${first.x} 145 Z`;
  }, [chartPoints, linePath]);

  const barPoints = useMemo(() => {
    if (periodData.length === 0) return [];
    const width = 430;
    const height = 125;
    const startX = 50;
    const startY = 145;
    const barWidth = 32;

    return periodData.map((item, idx) => {
      const x = startX + (idx / (periodData.length - 1 || 1)) * width - barWidth / 2;
      const barHeight = (item.revenue / maxValue) * height;
      const y = startY - barHeight;
      return { x, y, width: barWidth, height: barHeight, label: item.label };
    });
  }, [periodData, maxValue]);

  const totalPeriodRevenue = useMemo(() => {
    return periodData.reduce((sum, item) => sum + item.revenue, 0);
  }, [periodData]);

  // Seller components dispatched list
  const sellerProducts = useMemo(() => {
    const list: Array<{ name: string; quantity: number; price: number }> = [];
    const shippedOrDelivered = orders.filter((o) => o.status === 'SHIPPED' || o.status === 'DELIVERED');
    for (const order of shippedOrDelivered) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.product) {
            const existing = list.find((p) => p.name === item.product.name);
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              list.push({
                name: item.product.name,
                quantity: item.quantity,
                price: Number(item.priceAtTime),
              });
            }
          }
        }
      }
    }
    return list.sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  const totalItemsSold = useMemo(() => {
    return sellerProducts.reduce((sum, p) => sum + p.quantity, 0);
  }, [sellerProducts]);

  // Paginated list
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const firstResult = filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResult = Math.min(currentPage * pageSize, filteredOrders.length);

  if (isLoading && !sellerStats) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
        <p className="text-lg font-bold text-slate-900 dark:text-white">Cargando estadísticas del vendedor...</p>
      </div>
    );
  }

  // Dashboard Tab Renderer
  const renderDashboardTab = () => {
    const revenueVal = sellerStats?.totalRevenue ?? 0;
    const ordersVal = sellerStats?.totalOrdersAssigned ?? 0;
    const pendingVal = sellerStats?.pendingOrders ?? 0;
    const cancelledCount = sellerStats?.ordersByStatus?.['CANCELLED'] ?? 0;
    const shippedCount = sellerStats?.ordersByStatus?.['SHIPPED'] ?? 0;

    return (
      <div className="space-y-6">
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Card 1: Revenue */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="h-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">EFICIENCIA DE ENVIO</span>
                <span className="h-6 w-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 text-sm">
                  <TrendingUp className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{formatCurrency(revenueVal)}</p>
                <p className="text-sm font-semibold text-slate-505 dark:text-neutral-400 mt-1.5">Total acumulado de envíos exitosos</p>
              </div>
            </div>
          </div>

          {/* Card 2: Assigned Orders */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="h-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">PEDIDOS ASIGNADOS</span>
                <span className="h-6 w-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 text-sm">
                  <ShoppingCart className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{ordersVal}</p>
                <p className="text-sm font-semibold text-slate-505 dark:text-neutral-400 mt-1.5">Pedidos asignados a tu cuenta</p>
              </div>
            </div>
          </div>

          {/* Card 3: Pending */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="h-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">EN PROCESO</span>
                <span className="h-6 w-6 rounded-lg bg-amber-55 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 text-sm">
                  <Clock3 className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{pendingVal}</p>
                <p className="text-sm font-semibold text-slate-505 dark:text-neutral-400 mt-1.5">Órdenes pendientes de despacho</p>
              </div>
            </div>
          </div>

          {/* Card 4: Cancelled */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="h-2.5 bg-gradient-to-r from-rose-500 to-red-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">CANCELADOS</span>
                <span className="h-6 w-6 rounded-lg bg-rose-55 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 text-sm">
                  <XCircle className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{cancelledCount}</p>
                <p className="text-sm font-semibold text-slate-505 dark:text-neutral-400 mt-1.5">Total de pedidos cancelados</p>
              </div>
            </div>
          </div>

          {/* Card 5: Shipped */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="h-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">ENVIADOS</span>
                <span className="h-6 w-6 rounded-lg bg-violet-55 dark:bg-violet-950/40 flex items-center justify-center text-violet-500 text-sm">
                  <Truck className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{shippedCount}</p>
                <p className="text-sm font-semibold text-slate-555 dark:text-neutral-400 mt-1.5">Total de pedidos en tránsito</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-950 dark:border dark:border-neutral-800 flex flex-col justify-between min-h-[290px]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-3">
              <div>
                <h3 className="text-xl font-bold tracking-wide text-slate-900 dark:text-white uppercase border-l-4 border-blue-600 pl-2.5">
                  Rendimiento Temporal ({period})
                </h3>
                <p className="text-sm font-semibold text-slate-55 mt-1.5">Gráfico interactivo de facturación</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Ingresos Totales</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 block">
                  {formatCurrency(totalPeriodRevenue)}
                </span>
              </div>
            </div>

            <div className="relative mt-4 flex-1 flex items-center justify-center">
              {totalPeriodRevenue === 0 ? (
                <p className="text-base font-semibold text-slate-900 dark:text-white">Sin ingresos en este período</p>
              ) : (
                <div className="w-full relative">
                  {chartType === 'linea' && (
                    <svg viewBox="0 0 500 180" className="w-full h-auto overflow-visible">
                      <defs>
                        <linearGradient id="neonLineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#1e40af" />
                          <stop offset="50%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                        <linearGradient id="neonAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1e40af" stopOpacity="0.22" />
                          <stop offset="50%" stopColor="#2563eb" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      <line x1="50" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" className="dark:stroke-neutral-900/60" />
                      <line x1="50" y1="82.5" x2="480" y2="82.5" stroke="#f1f5f9" strokeDasharray="3 3" className="dark:stroke-neutral-900/60" />
                      <line x1="50" y1="145" x2="480" y2="145" stroke="#e2e8f0" className="dark:stroke-neutral-900" strokeWidth="1.2" />

                      {areaPath && <path d={areaPath} fill="url(#neonAreaGradient)" />}

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
                            fontSize="12.5"
                            className="fill-slate-900 font-semibold dark:fill-white"
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
                            fontSize="12.5"
                            className="fill-slate-900 font-semibold dark:fill-white"
                          >
                            {bar.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  )}

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
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                          {periodData[hoveredPointIndex].fullLabel}
                        </p>
                        <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                          {formatCurrency(periodData[hoveredPointIndex].revenue)}
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1 leading-none">
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

        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-950 dark:border dark:border-neutral-800">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-4">
            <div>
              <h3 className="text-2xl font-bold tracking-wide text-slate-900 dark:text-white uppercase border-l-4 border-blue-600 pl-3">
                Detalle de Ventas Periódicas
              </h3>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl">
            <table className="w-full border-collapse text-left text-base">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-900 dark:border-neutral-900 dark:bg-neutral-900/20 dark:text-white">
                  <th className="py-3.5 px-3.5 font-bold uppercase tracking-wider text-sm">Intervalo</th>
                  <th className="py-3.5 px-3.5 font-bold uppercase tracking-wider text-sm text-right">Ventas Totales</th>
                  <th className="py-3.5 px-3.5 font-bold uppercase tracking-wider text-sm text-right">Pedidos</th>
                  <th className="py-3.5 px-3.5 font-bold uppercase tracking-wider text-sm text-right">Monto Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-neutral-900">
                {periodData.map((item) => (
                  <tr key={item.key} className="text-slate-955 dark:text-white hover:bg-slate-50/30 dark:hover:bg-neutral-900/40 transition-colors">
                    <td className="py-3.5 px-3.5 font-semibold text-base">{item.fullLabel}</td>
                    <td className="py-3.5 px-3.5 text-right font-semibold text-base text-slate-900 dark:text-white">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-semibold text-base">{item.ordersCount}</td>
                    <td className="py-3.5 px-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 text-base">
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
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800 p-6">
          {/* Section Header */}
          <div className="flex flex-col border-b border-slate-100 dark:border-neutral-900 pb-4 mb-5">
            <h3 className="text-2xl font-bold tracking-wide text-slate-900 dark:text-white uppercase border-l-4 border-blue-600 pl-3">
              Historial de Pedidos Asignados
            </h3>
            <p className="text-sm font-semibold text-slate-505 dark:text-neutral-300 mt-1.5">
              Listado completo y estado de despacho de las transacciones bajo tu cuenta de vendedor.
            </p>
          </div>

          {/* Unified search and limit selector bar - responsive to light/dark themes */}
          <div className="mb-4 rounded-xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 p-3 shadow-sm flex items-center justify-between gap-4">
            {/* Search Input on the Left */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 rounded-lg pl-9 pr-4 py-2 outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            {/* Dropdown Selector on the Right */}
            <div className="relative flex items-center">
              <Sliders className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={ordersLimit}
                onChange={(e) => {
                  setOrdersLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-sm font-semibold text-slate-800 dark:text-white rounded-lg pl-9 pr-10 py-2 appearance-none outline-none focus:border-teal-500 transition-colors cursor-pointer select-none"
              >
                <option value={20} className="bg-white dark:bg-neutral-950 text-slate-800 dark:text-white">Últimos 20 pedidos</option>
                <option value={50} className="bg-white dark:bg-neutral-950 text-slate-800 dark:text-white">Últimos 50 pedidos</option>
                <option value={100} className="bg-white dark:bg-neutral-950 text-slate-800 dark:text-white">Últimos 100 pedidos</option>
                <option value={200} className="bg-white dark:bg-neutral-950 text-slate-800 dark:text-white">Últimos 200 pedidos</option>
              </select>
              <span className="absolute right-3 pointer-events-none text-slate-500 dark:text-slate-400 text-xs">▼</span>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">No se encontraron pedidos con el criterio de búsqueda</p>
            </div>
          ) : (
            <>
              {/* Order Table */}
              <div className="overflow-x-auto min-w-[800px]">
                <table className="w-full border-collapse text-left text-base">
                  <thead>
                    <tr className="border-b border-slate-155 bg-slate-55 text-slate-900 dark:border-neutral-900 dark:bg-neutral-900/20 dark:text-white">
                      <th className="py-4 px-5 font-bold uppercase tracking-wider text-sm text-slate-500 dark:text-neutral-300">CÓDIGO DE PEDIDO</th>
                      <th className="py-4 px-5 font-bold uppercase tracking-wider text-sm text-slate-500 dark:text-neutral-300">CLIENTE</th>
                      <th className="py-4 px-5 font-bold uppercase tracking-wider text-sm text-slate-500 dark:text-neutral-300">FECHA DE REGISTRO</th>
                      <th className="py-4 px-5 font-bold uppercase tracking-wider text-sm text-slate-500 dark:text-neutral-300 text-right">MONTO TOTAL</th>
                      <th className="py-4 px-5 font-bold uppercase tracking-wider text-sm text-slate-500 dark:text-neutral-300 text-right">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
                    {paginatedOrders.map((order) => {
                      const cfg = statusConfig[order.status] || {
                        label: order.status,
                        textClass: 'text-slate-500 font-bold text-sm',
                      };
                      const orderCode = order.trackingCode || `#${order.id.slice(0, 8).toUpperCase()}`;

                      const dateObj = new Date(order.createdAt);
                      const dayStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                      const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
                      const formattedDate = `${dayStr}, ${timeStr}`;

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/30 dark:hover:bg-neutral-900/40 transition-colors">
                          <td className="py-4 px-5 text-base text-slate-900 dark:text-neutral-200 font-semibold">{orderCode}</td>
                          <td className="py-4 px-5 text-base text-slate-900 dark:text-neutral-200 font-semibold">{getClientName(order)}</td>
                          <td className="py-4 px-5 text-base text-slate-900 dark:text-neutral-200 font-semibold">{formattedDate}</td>
                          <td className="py-4 px-5 text-base text-slate-900 dark:text-white font-black text-right">
                            {formatCurrency(Number(order.totalAmount || 0))}
                          </td>
                          <td className="py-4 px-5 text-right font-bold">
                            <span className={`text-base ${cfg.textClass}`}>
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Bar - matching VendedorPedidosPage.tsx style */}
              <div className="flex flex-col gap-3 border-t border-slate-205 px-4 py-3 text-sm text-slate-900 dark:text-white dark:border-neutral-800 md:flex-row md:items-center md:justify-between mt-4">
                <p className="font-semibold text-slate-700 dark:text-neutral-300">
                  Mostrando {firstResult} a {lastResult} de {filteredOrders.length} pedidos
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={actionButtonClass}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    aria-label="Pagina anterior"
                  >
                    {'<'}
                  </button>

                  {Array.from({ length: Math.min(totalPages, maxVisitedPage) }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={
                        page === currentPage
                          ? 'h-8 min-w-8 rounded-lg bg-teal-500 px-2 text-xs font-bold text-white cursor-pointer'
                          : actionButtonClass
                      }
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className={actionButtonClass}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Pagina siguiente"
                  >
                    {'>'}
                  </button>

                  <select
                    className={`${fieldClass} h-8 cursor-pointer bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 pr-1`}
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5} className="dark:bg-neutral-950">5 por página</option>
                    <option value={10} className="dark:bg-neutral-950">10 por página</option>
                    <option value={20} className="dark:bg-neutral-950">20 por página</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderPerformanceTab = () => {
    const dispatchedOrders = orders.filter((o) => o.status === 'SHIPPED' || o.status === 'DELIVERED');
    const dispatchedCount = dispatchedOrders.length;
    const dispatchedRevenue = dispatchedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const ordersVal = sellerStats?.totalOrdersAssigned ?? orders.length;

    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm dark:bg-neutral-950 dark:border dark:border-neutral-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-neutral-800 pb-4 mb-5">
            <div>
              <h4 className="text-xl font-bold text-slate-955 dark:text-white uppercase tracking-wider">Eficiencia de Despacho y Envío</h4>
              <p className="text-sm font-semibold text-slate-500 dark:text-neutral-300 mt-1.5">
                Métricas de cumplimiento y tasa de efectividad en los pedidos asignados a tu cuenta.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Tasa de Despacho</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 block">
                {ordersVal > 0 ? ((dispatchedCount / ordersVal) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>

          <div className="bg-slate-50/50 dark:bg-neutral-900/35 border border-slate-200/55 dark:border-neutral-800/80 p-5 rounded-2xl">
            <div className="flex flex-col gap-4 sm:flex-row items-center gap-5">
              <div className="h-14 w-14 shrink-0 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Truck className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <p className="text-base text-slate-955 dark:text-white leading-relaxed font-semibold">
                  Se han enviado de forma exitosa <span className="font-semibold text-slate-955 dark:text-white">{dispatchedCount}</span> de los <span className="font-semibold text-slate-955 dark:text-white">{ordersVal}</span> pedidos asignados. Esto equivale a un total de <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalItemsSold}</span> componentes físicos de hardware enviados por el vendedor.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Card 1: Average Amount */}
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <span className="text-base font-bold text-slate-955 dark:text-white uppercase tracking-widest block">Monto Promedio por Pedido</span>
            <p className="text-4xl md:text-5xl font-normal text-slate-900 dark:text-white mt-3">
              {formatCurrency(dispatchedCount > 0 ? dispatchedRevenue / dispatchedCount : 0)}
            </p>
            <p className="text-sm text-slate-500 dark:text-white/60 font-semibold mt-2.5">Suma media facturada para los envíos y entregas</p>
          </div>

          {/* Card 2: Ship Volume */}
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <span className="text-base font-bold text-slate-955 dark:text-white uppercase tracking-widest block">Volumen de Envío</span>
            <p className="text-4xl md:text-5xl font-normal text-slate-900 dark:text-white mt-3">
              {dispatchedCount} <span className="text-lg font-semibold text-slate-500 dark:text-white/60">pedidos</span>
            </p>
            <p className="text-sm text-slate-500 dark:text-white/60 font-semibold mt-2.5">Total de transacciones enviadas o entregadas</p>
          </div>
        </div>

        {/* Dynamic Seller Top Components List */}
        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm dark:bg-neutral-950 dark:border dark:border-neutral-800">
          <div className="border-b border-slate-100 dark:border-neutral-800 pb-3 mb-4">
            <h4 className="text-xl font-bold text-slate-955 dark:text-white uppercase tracking-wider">Componentes Despachados por el Vendedor</h4>
            <p className="text-sm font-semibold text-slate-550 dark:text-neutral-300 mt-1.5">
              Detalle de unidades de hardware enviadas o entregadas con éxito por tu usuario.
            </p>
          </div>
          {sellerProducts.length === 0 ? (
            <p className="text-base md:text-lg font-medium text-slate-955 dark:text-white">No se han registrado envíos para cuantificar componentes despachados.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-neutral-900">
              {sellerProducts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center py-4">
                  <div>
                    <span className="text-lg md:text-xl font-semibold text-slate-955 dark:text-white block leading-tight">
                      {p.name} <span className="text-sm md:text-base font-normal text-slate-500 dark:text-white/60 ml-2">({formatCurrency(p.price)})</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg md:text-xl font-bold text-cyan-600 dark:text-cyan-400 block">{p.quantity} unds</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider block">despachadas</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm shadow-slate-200/70 dark:bg-neutral-950 dark:shadow-none dark:border dark:border-neutral-800">
      {/* Tab selectors navigation bar */}
      <div className="flex justify-center w-full mb-3">
        <div className="flex flex-wrap gap-2.5 p-1.5 bg-slate-100/70 dark:bg-neutral-900/60 rounded-xl justify-center">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2.5 rounded-lg px-6 py-2 text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'general'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white'
                : 'text-slate-900 hover:bg-slate-200/50 dark:text-neutral-300 dark:hover:bg-neutral-800/50'
            }`}
          >
            <BarChart3 className="h-4.5 w-4.5" />
            General
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
          <button
            onClick={() => {
              setActiveTab('orders');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2.5 rounded-lg px-6 py-2 text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white'
                : 'text-slate-900 hover:bg-slate-200/50 dark:text-neutral-300 dark:hover:bg-neutral-800/50'
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            Pedidos
          </button>
        </div>
      </div>

      {/* Control bar (Filtros) */}
      {activeTab === 'general' && (
        <div className="mb-4 rounded-2xl bg-white/70 dark:bg-neutral-950 dark:border dark:border-neutral-800 p-4 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-end gap-3 w-full">
            <div className="flex rounded-xl bg-slate-100/80 p-1 dark:bg-neutral-900/60">
              {(['diario', 'semanal', 'mensual'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg px-3.5 py-1 text-sm font-bold transition-all duration-200 cursor-pointer ${
                    period === p
                      ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white'
                      : 'text-slate-900 hover:text-slate-950 dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex rounded-xl bg-slate-100/80 p-1 dark:bg-neutral-900/60">
              {(['linea', 'barras'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  className={`rounded-lg px-3.5 py-1 text-sm font-bold transition-all duration-200 cursor-pointer ${
                    chartType === t
                      ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white'
                      : 'text-slate-900 hover:text-slate-950 dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {t === 'linea' ? 'Línea' : 'Barras'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
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
            {activeTab === 'performance' && renderPerformanceTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
