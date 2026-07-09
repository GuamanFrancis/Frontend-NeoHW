import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Clock3,
  Package,
  ShoppingCart,
  ArrowUpRight,
  Sliders,
  TrendingUp,
  Search,
  UsersRound,
  XCircle,
  Truck,
  FileText
} from 'lucide-react';
import { useAdminStats } from './hooks/useAdminStats';
import { type OrderBackend } from '../../services/ordersService';
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

export const AdminEstadisticasPage = () => {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    globalStats,
    isLoading,
    hoveredPointIndex,
    setHoveredPointIndex,
    period,
    setPeriod,
    chartType,
    setChartType,
    failedImages,
    setFailedImages,
    stockStats,
    filteredOrders,
    periodData,
    chartPoints,
    linePath,
    areaPath,
    barPoints,
  } = useAdminStats();

  const [ordersLimit, setOrdersLimit] = useState<number>(50);
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

  const totalPeriodRevenue = useMemo(() => {
    return periodData.reduce((sum, item) => sum + item.revenue, 0);
  }, [periodData]);

  // Extract overview values from backend response
  const overviewObj = globalStats?.overview;

  const finalTotalRevenue = overviewObj?.totalRevenue != null ? Number(overviewObj.totalRevenue) : 0;
  const finalTotalOrders = overviewObj?.totalOrders != null ? Number(overviewObj.totalOrders) : 0;
  const finalTotalProducts = overviewObj?.totalProducts != null ? Number(overviewObj.totalProducts) : 0;
  const finalTotalUsers = overviewObj?.totalUsers != null ? Number(overviewObj.totalUsers) : 0;

  const pendingVal = globalStats?.ordersByStatus?.['PROCESSING'] != null ? Number(globalStats.ordersByStatus['PROCESSING']) : 0;
  const cancelledCount = globalStats?.ordersByStatus?.['CANCELLED'] != null ? Number(globalStats.ordersByStatus['CANCELLED']) : 0;
  const shippedCount = globalStats?.ordersByStatus?.['SHIPPED'] != null ? Number(globalStats.ordersByStatus['SHIPPED']) : 0;

  const topProductsList = globalStats?.topProducts || [];
  const sellerPerformanceList = globalStats?.sellerPerformance || [];

  const maxSellerRevenue = useMemo(() => {
    if (sellerPerformanceList.length === 0) return 1;
    const vals = sellerPerformanceList.map((s) => Number(s.totalRevenue));
    return Math.max(...vals, 1);
  }, [sellerPerformanceList]);

  // Slice filtered orders by global list limit (e.g. 50 orders)
  const limitedOrders = useMemo(() => {
    return filteredOrders.slice(0, ordersLimit);
  }, [filteredOrders, ordersLimit]);

  // Paginated list
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return limitedOrders.slice(start, start + pageSize);
  }, [limitedOrders, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(limitedOrders.length / pageSize));
  const firstResult = limitedOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResult = Math.min(currentPage * pageSize, limitedOrders.length);

  if (isLoading && !globalStats) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
        <p className="text-lg font-bold text-slate-900 dark:text-white">Cargando estadísticas globales...</p>
      </div>
    );
  }

  // Dashboard Tab Renderer
  const renderDashboardTab = () => {
    return (
      <div className="space-y-6">
        {/* KPI Grid with custom colored gradient stripes */}
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Card 1: Global Revenue */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="h-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">INGRESOS TOTALES</span>
                <span className="h-6 w-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 text-sm">
                  <TrendingUp className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{formatCurrency(finalTotalRevenue)}</p>
                <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400 mt-1.5">Facturación total global</p>
              </div>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="h-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">PEDIDOS TOTALES</span>
                <span className="h-6 w-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 text-sm">
                  <ShoppingCart className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{finalTotalOrders}</p>
                <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400 mt-1.5">Pedidos creados en la plataforma</p>
              </div>
            </div>
          </div>

          {/* Card 3: Pending Orders */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="h-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">EN PROCESO</span>
                <span className="h-6 w-6 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 text-sm">
                  <Clock3 className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{pendingVal}</p>
                <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400 mt-1.5">Órdenes pendientes de despacho</p>
              </div>
            </div>
          </div>

          {/* Card 4: Cancelled Orders */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="h-2.5 bg-gradient-to-r from-rose-500 to-red-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">CANCELADOS</span>
                <span className="h-6 w-6 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 text-sm">
                  <XCircle className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{cancelledCount}</p>
                <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400 mt-1.5">Total de pedidos cancelados</p>
              </div>
            </div>
          </div>

          {/* Card 5: Shipped Orders */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="h-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">ENVIADOS</span>
                <span className="h-6 w-6 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-500 text-sm">
                  <Truck className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{shippedCount}</p>
                <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400 mt-1.5">Total de pedidos en tránsito</p>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: System Parameters & Stock Breakdown */}
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-3 mt-5">
          {/* Card 1: Clients */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="h-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">CLIENTES REGISTRADOS</span>
                <span className="h-6 w-6 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-500 text-sm">
                  <UsersRound className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{finalTotalUsers}</p>
                <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400 mt-1.5">Usuarios con rol de cliente</p>
              </div>
            </div>
          </div>

          {/* Card 2: Products */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="h-2.5 bg-gradient-to-r from-amber-500 to-orange-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">PRODUCTOS ACTIVOS</span>
                <span className="h-6 w-6 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 text-sm">
                  <Package className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{finalTotalProducts}</p>
                <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400 mt-1.5">Componentes en catálogo</p>
              </div>
            </div>
          </div>

          {/* Card 3: Inventory Status */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">ESTADO DEL INVENTARIO</span>
                <span className="h-6 w-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 text-sm">
                  <Sliders className="h-4.5 w-4.5" />
                </span>
              </div>
              {stockStats ? (
                <div className="flex items-center justify-between gap-4 mt-2">
                  <div className="text-center flex-1">
                    <span className="text-xl font-bold text-emerald-500 block leading-tight">{stockStats.available}</span>
                    <span className="text-xs uppercase font-extrabold text-slate-955 dark:text-white">Disponibles</span>
                  </div>
                  <div className="text-center flex-1 border-x border-slate-100 dark:border-neutral-800">
                    <span className="text-xl font-bold text-amber-500 block leading-tight">{stockStats.lowStock}</span>
                    <span className="text-xs uppercase font-extrabold text-slate-955 dark:text-white">Stock bajo</span>
                  </div>
                  <div className="text-center flex-1">
                    <span className="text-xl font-bold text-rose-500 block leading-tight">{stockStats.outOfStock}</span>
                    <span className="text-xs uppercase font-extrabold text-slate-955 dark:text-white">Agotados</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-450 font-bold animate-pulse py-2">Calculando inventario...</div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Chart Container */}
        <div className="w-full mt-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-950 dark:border dark:border-neutral-800 flex flex-col justify-between min-h-[290px]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-3">
              <div>
                <h3 className="text-xl font-bold tracking-wide text-slate-900 dark:text-white uppercase border-l-4 border-blue-600 pl-2.5">
                  Rendimiento Temporal ({period})
                </h3>
                <p className="text-sm font-semibold text-slate-500 mt-1">Gráfico interactivo de facturación</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Ingresos Totales</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 block">
                  {formatCurrency(totalPeriodRevenue)}
                </span>
              </div>
            </div>

            {/* Chart rendering */}
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

        {/* Bottom Table: Sales Breakdown (Renamed to represent General Stats) */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-950 dark:border dark:border-neutral-800">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-4">
            <div>
              <h3 className="text-2xl font-bold tracking-wide text-slate-900 dark:text-white uppercase border-l-4 border-blue-600 pl-3">
                Detalle de Ventas Periódicas Generales
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
              Listado General de Pedidos
            </h3>
            <p className="text-sm font-semibold text-slate-505 dark:text-neutral-300 mt-1.5">
              Historial completo y estado de las transacciones registradas en el sistema.
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

          {limitedOrders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">No se encontraron pedidos con el criterio de búsqueda</p>
            </div>
          ) : (
            <>
              {/* Order Table */}
              <div className="overflow-x-auto min-w-[800px]">
                <table className="w-full border-collapse text-left text-base">
                  <thead>
                    <tr className="border-b border-slate-150 bg-slate-55 text-slate-900 dark:border-neutral-900 dark:bg-neutral-900/20 dark:text-white">
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
              <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-900 dark:text-white dark:border-neutral-800 md:flex-row md:items-center md:justify-between mt-4">
                <p className="font-semibold text-slate-700 dark:text-neutral-300">
                  Mostrando {firstResult} a {lastResult} de {limitedOrders.length} pedidos
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
    return (
      <div className="space-y-6">
        <div className="grid gap-8 sm:grid-cols-2">
          {/* Top Products */}
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="flex flex-col border-b border-slate-100 dark:border-neutral-800 pb-3 mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-955 dark:text-white uppercase tracking-wider">Componentes de Hardware más Vendidos</h4>
                <ArrowUpRight className="h-5 w-5 text-slate-955 dark:text-white" />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-neutral-300 mt-1.5">
                Listado de los 5 componentes con mayor volumen de salida y ventas en la plataforma.
              </p>
            </div>
            {topProductsList.length === 0 ? (
              <p className="text-sm font-semibold text-slate-955 dark:text-white py-4">No hay ventas en la base de datos.</p>
            ) : (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                {topProductsList.map(({ product, totalSold }) => (
                  <div key={product.id} className="flex items-center justify-between py-3 px-2 hover:bg-slate-55 dark:hover:bg-neutral-900/30 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={(!failedImages[product.id] && product.imageUrl) ? product.imageUrl : '/favicon.jpg'}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover border border-slate-100 dark:border-neutral-800 shrink-0"
                        onError={() => {
                          if (product.imageUrl && product.imageUrl !== '/favicon.jpg') {
                            setFailedImages((prev) => ({ ...prev, [product.id]: true }));
                          }
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-slate-955 dark:text-white truncate max-w-[180px] leading-tight">
                          {product.name}
                        </p>
                        <span className="text-sm font-semibold text-slate-500 dark:text-neutral-400 block mt-1">
                          {formatCurrency(Number(product.price))}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg md:text-xl font-bold text-cyan-600 dark:text-cyan-400">{totalSold} unds</p>
                      <p className="text-xs font-bold text-slate-955 dark:text-white uppercase tracking-wider block mt-0.5">vendidos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seller performance ranking */}
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm dark:bg-neutral-950 dark:border dark:border-neutral-800">
            <div className="flex flex-col border-b border-slate-100 dark:border-neutral-800 pb-3 mb-4">
              <h4 className="text-xl font-bold text-slate-955 dark:text-white uppercase tracking-wider">Rendimiento de Ventas por Empleado</h4>
              <p className="text-sm font-semibold text-slate-500 dark:text-neutral-300 mt-1.5">
                Ranking de facturación acumulada y total de pedidos entregados por cada vendedor.
              </p>
            </div>
            {sellerPerformanceList.length === 0 ? (
              <p className="text-sm font-semibold text-slate-955 dark:text-white py-4">No hay estadísticas de vendedores.</p>
            ) : (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                {sellerPerformanceList.map(({ seller, ordersDelivered, totalRevenue }) => (
                  <div key={seller.id} className="space-y-2.5 px-1">
                    <div className="flex items-center justify-between text-base font-semibold text-slate-955 dark:text-white">
                      <span>
                        {seller ? (
                          `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || seller.email || 'Vendedor'
                        ) : 'Empleado'}
                      </span>
                      <span className="font-bold text-slate-955 dark:text-white">
                        {formatCurrency(Number(totalRevenue))} <span className="text-sm font-normal text-slate-900 dark:text-neutral-300">({ordersDelivered} {ordersDelivered === 1 ? 'pedido' : 'pedidos'})</span>
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 dark:bg-neutral-900/60 overflow-hidden shadow-inner">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${(Number(totalRevenue) / maxSellerRevenue) * 100}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm shadow-slate-200/70 dark:bg-neutral-950 dark:shadow-none dark:border dark:border-neutral-800">
      {/* Centered and well distributed horizontal navigation bar - Glued to the top */}
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

      {/* Control bar (Filtros) - Only rendered when tab uses them */}
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
                      : 'text-slate-900 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
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
                      : 'text-slate-900 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {t === 'linea' ? 'Línea' : 'Barras'}
                </button>
              ))}
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
            {activeTab === 'performance' && renderPerformanceTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
