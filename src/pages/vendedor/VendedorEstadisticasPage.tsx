import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Clock3,
  Package,
  ShoppingCart,
  ArrowUpRight,
  Sliders,
  FileText,
  TrendingUp,
  Search,
  UsersRound,
  XCircle,
  Truck
} from 'lucide-react';
import { getOrders, type OrderBackend } from '../../services/ordersService';
import { getSellerStats, getGlobalStats, type SellerStats, type GlobalStats } from '../../services/statisticsService';
import { getCatalogComponents } from '../../services/catalogService';
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



export const VendedorEstadisticasPage = () => {
  const session = getStoredSession();
  const rawRole = session?.user?.backendRole || session?.user?.role || 'SELLER';
  const role = rawRole.toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'general' | 'orders' | 'performance'>('general');
  const [searchQuery, setSearchQuery] = useState('');

  const [orders, setOrders] = useState<OrderBackend[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const [period, setPeriod] = useState<'diario' | 'semanal' | 'mensual'>('mensual');
  const [chartType, setChartType] = useState<'linea' | 'barras'>('linea');
  const [ordersLimit, setOrdersLimit] = useState<number>(50);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [stockStats, setStockStats] = useState<{ available: number; lowStock: number; outOfStock: number } | null>(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setIsLoading(true);

      // Fetch orders (independent)
      try {
        const ordersRes = await getOrders(undefined, 1, ordersLimit);
        if (active && ordersRes && Array.isArray(ordersRes.data)) {
          setOrders(ordersRes.data);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      }

      if (isAdmin) {
        // Fetch global stats (independent)
        try {
          const globalRes = await getGlobalStats();
          if (active && globalRes?.stats) {
            setGlobalStats(globalRes.stats);
          }
        } catch (err) {
          console.error('Error fetching global stats:', err);
        }

        // Fetch catalog (independent)
        try {
          const catalogRes = await getCatalogComponents({ page: 1, limit: 100 });
          if (active && catalogRes && Array.isArray(catalogRes.items)) {
            let available = 0;
            let lowStock = 0;
            let outOfStock = 0;
            for (const prod of catalogRes.items) {
              if (prod.stock <= 0) {
                outOfStock++;
              } else if (prod.stock <= 10) {
                lowStock++;
              } else {
                available++;
              }
            }
            setStockStats({ available, lowStock, outOfStock });
          }
        } catch (err) {
          console.error('Error fetching catalog components:', err);
        }
      } else {
        // Fetch seller stats (independent)
        try {
          const sellerRes = await getSellerStats();
          if (active && sellerRes?.stats) {
            setSellerStats(sellerRes.stats);
          }
        } catch (err) {
          console.error('Error fetching seller stats:', err);
        }
      }

      if (active) setIsLoading(false);
    };
    void fetchData();
    return () => {
      active = false;
    };
  }, [isAdmin, ordersLimit, activeTab]);

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

  // Local fallbacks calculated from the orders array
  const localStats = useMemo(() => {
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
    const localTotalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const localTotalOrders = orders.length;
    const localTotalUsers = Array.from(new Set(orders.map(o => o.userId))).length;
    
    // Top products calculation
    const localTopProductsMap = new Map<string, { product: any, totalSold: number }>();
    for (const order of orders) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.product) {
            const prodId = item.productId;
            const existing = localTopProductsMap.get(prodId);
            if (existing) {
              existing.totalSold += item.quantity;
            } else {
              localTopProductsMap.set(prodId, {
                product: {
                  id: prodId,
                  name: item.product.name,
                  sku: item.product.sku,
                  imageUrl: item.product.imageUrl || '/favicon.jpg',
                  price: Number(item.priceAtTime)
                },
                totalSold: item.quantity
              });
            }
          }
        }
      }
    }
    const localTopProducts = Array.from(localTopProductsMap.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    // Seller performance calculation
    const localSellerMap = new Map<string, { seller: any, ordersDelivered: number, totalRevenue: number }>();
    for (const order of orders) {
      const orderAny = order as any;
      if (orderAny.status === 'DELIVERED' && orderAny.assignedSellerId) {
        const sellerId = orderAny.assignedSellerId;
        const existing = localSellerMap.get(sellerId);
        const revenue = Number(orderAny.totalAmount || 0);
        if (existing) {
          existing.ordersDelivered++;
          existing.totalRevenue += revenue;
        } else {
          // Extract name from assigned seller if present
          const sellerObj = orderAny.assignedSeller;
          const sellerName = sellerObj ? `${sellerObj.firstName || ''} ${sellerObj.lastName || ''}`.trim() : '';
          localSellerMap.set(sellerId, {
            seller: {
              id: sellerId,
              firstName: sellerName || 'Empleado',
              lastName: ''
            },
            ordersDelivered: 1,
            totalRevenue: revenue
          });
        }
      }
    }
    const localSellerPerformance = Array.from(localSellerMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      totalRevenue: localTotalRevenue,
      totalOrders: localTotalOrders,
      totalUsers: localTotalUsers,
      topProducts: localTopProducts,
      sellerPerformance: localSellerPerformance
    };
  }, [orders]);

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
        if (found && order.status === 'DELIVERED') {
          found.ordersCount++;
          found.revenue += Number(order.totalAmount || 0);
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
        if (found && order.status === 'DELIVERED') {
          found.ordersCount++;
          found.revenue += Number(order.totalAmount || 0);
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
        if (found && order.status === 'DELIVERED') {
          found.ordersCount++;
          found.revenue += Number(order.totalAmount || 0);
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


  const maxSellerRevenue = useMemo(() => {
    if (!globalStats?.sellerPerformance) return 1;
    const vals = globalStats.sellerPerformance.map(s => Number(s.totalRevenue));
    return Math.max(...vals, 1);
  }, [globalStats]);

  const totalItemsSold = useMemo(() => {
    return orders.reduce((acc, order) => {
      if (order.status !== 'SHIPPED' && order.status !== 'DELIVERED') return acc;
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
      if ((order.status === 'SHIPPED' || order.status === 'DELIVERED') && Array.isArray(order.items)) {
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
    const overviewObj = (globalStats?.overview || globalStats) as any;

    const finalTotalRevenue = (overviewObj?.totalRevenue && Number(overviewObj.totalRevenue) > 0)
      ? Number(overviewObj.totalRevenue)
      : localStats.totalRevenue;

    const finalTotalOrders = (overviewObj?.totalOrders && Number(overviewObj.totalOrders) > 0)
      ? Number(overviewObj.totalOrders)
      : localStats.totalOrders;

    const finalTotalProducts = (overviewObj?.totalProducts && Number(overviewObj.totalProducts) > 0)
      ? Number(overviewObj.totalProducts)
      : (stockStats ? (stockStats.available + stockStats.lowStock + stockStats.outOfStock) : 0);

    const finalTotalUsers = (overviewObj?.totalUsers && Number(overviewObj.totalUsers) > 0)
      ? Number(overviewObj.totalUsers)
      : localStats.totalUsers;

    const revenueVal = isAdmin && globalStats ? finalTotalRevenue : (activeSellerStats?.totalRevenue ?? 0);
    const ordersVal = isAdmin && globalStats ? finalTotalOrders : (activeSellerStats?.totalOrdersAssigned ?? 0);
    const pendingVal = isAdmin ? (donutData.find(d => d.key === 'PROCESSING')?.count || 0) : (activeSellerStats?.pendingOrders ?? 0);
    const cancelledCount = isAdmin && globalStats
      ? (donutData.find((d) => d.key === 'CANCELLED')?.count || 0)
      : (activeSellerStats?.ordersByStatus?.['CANCELLED'] ?? 0);

    const shippedCount = isAdmin && globalStats
      ? (donutData.find((d) => d.key === 'SHIPPED')?.count || 0)
      : (activeSellerStats?.ordersByStatus?.['SHIPPED'] ?? 0);

    return (
      <div className="space-y-6">
        {/* KPI Grid with custom colored gradient stripes */}
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Card 1: Earnings */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-black dark:border dark:border-white/10">
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
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-black dark:border dark:border-white/10">
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
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-black dark:border dark:border-white/10">
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

          {/* Card 4: Cancelados */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-black dark:border dark:border-white/10">
            <div className="h-2.5 bg-gradient-to-r from-rose-500 to-red-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-wider text-slate-900 dark:text-white">CANCELADOS</span>
                <span className="h-6 w-6 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 text-sm">
                  <XCircle className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{cancelledCount}</p>
                <p className="text-xs text-slate-900 dark:text-white font-normal mt-1">Total de pedidos cancelados</p>
              </div>
            </div>
          </div>

          {/* Card 5: Enviados */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-black dark:border dark:border-white/10">
            <div className="h-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-wider text-slate-900 dark:text-white">ENVIADOS</span>
                <span className="h-6 w-6 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-500 text-sm">
                  <Truck className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{shippedCount}</p>
                <p className="text-xs text-slate-900 dark:text-white font-normal mt-1">Total de pedidos en tránsito</p>
              </div>
            </div>
          </div>
        </div>

      {/* Second Row: System Parameters & Stock Breakdown (Admin only) */}
      {isAdmin && globalStats && (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-3 mt-5">
          {/* Card 1: Clientes */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-black dark:border dark:border-white/10">
            <div className="h-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-wider text-slate-900 dark:text-white">CLIENTES REGISTRADOS</span>
                <span className="h-6 w-6 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-500 text-sm">
                  <UsersRound className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{isAdmin && globalStats ? finalTotalUsers : 0}</p>
                <p className="text-xs text-slate-900 dark:text-white font-normal mt-1">Usuarios con rol de cliente</p>
              </div>
            </div>
          </div>

          {/* Card 2: Productos */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-black dark:border dark:border-white/10">
            <div className="h-2.5 bg-gradient-to-r from-amber-500 to-orange-500 w-full" />
            <div className="p-5 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-wider text-slate-900 dark:text-white">PRODUCTOS ACTIVOS</span>
                <span className="h-6 w-6 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 text-sm">
                  <Package className="h-4.5 w-4.5" />
                </span>
              </div>
              <div>
                <p className="text-4xl font-normal text-slate-900 dark:text-white tracking-tight">{isAdmin && globalStats ? finalTotalProducts : 0}</p>
                  <p className="text-xs text-slate-900 dark:text-white font-normal mt-1">Componentes en catálogo</p>
                </div>
              </div>
            </div>

            {/* Card 3: Estado del Inventario */}
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-black dark:border dark:border-white/10">
              <div className="h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />
              <div className="p-5 flex flex-col justify-between h-32">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium uppercase tracking-wider text-slate-900 dark:text-white">ESTADO DEL INVENTARIO</span>
                  <span className="h-6 w-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 text-sm">
                    <Sliders className="h-4.5 w-4.5" />
                  </span>
                </div>
                {stockStats ? (
                  <div className="flex items-center justify-between gap-4 mt-2">
                    <div className="text-center flex-1">
                      <span className="text-lg font-bold text-emerald-500 block leading-tight">{stockStats.available}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-955 dark:text-white">Disponibles</span>
                    </div>
                    <div className="text-center flex-1 border-x border-slate-100 dark:border-neutral-800">
                      <span className="text-lg font-bold text-amber-500 block leading-tight">{stockStats.lowStock}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-955 dark:text-white">Stock bajo</span>
                    </div>
                    <div className="text-center flex-1">
                      <span className="text-lg font-bold text-rose-500 block leading-tight">{stockStats.outOfStock}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-955 dark:text-white">Agotados</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 font-semibold animate-pulse py-2">Calculando inventario...</div>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="w-full">
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-black dark:border dark:border-white/10 flex flex-col justify-between min-h-[290px]">
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

        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-black dark:border dark:border-white/10">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-4">
            <div>
              <h3 className="text-xl font-bold tracking-wide text-slate-900 dark:text-white uppercase border-l-4 border-blue-600 pl-3">
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
                    <td className="py-3.5 px-3.5 font-normal">{item.fullLabel}</td>
                    <td className="py-3.5 px-3.5 text-right font-normal text-slate-900 dark:text-white">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-normal">{item.ordersCount}</td>
                    <td className="py-3.5 px-3.5 text-right font-normal text-emerald-600 dark:text-emerald-400 font-semibold">
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

        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center dark:bg-black dark:border dark:border-white/10">
            <p className="text-sm font-normal text-slate-900 dark:text-white">No se encontraron pedidos con el criterio de búsqueda</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-black dark:border dark:border-white/10">
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
                      <tr key={order.id} className="text-slate-955 dark:text-white hover:bg-slate-50/30 dark:hover:bg-neutral-900/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-normal text-slate-900 dark:text-white">
                          {order.trackingCode ? order.trackingCode : `#${order.id.slice(-8).toUpperCase()}`}
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



  const renderPerformanceTab = () => {
    const topProductsList = (globalStats?.topProducts && globalStats.topProducts.length > 0)
      ? globalStats.topProducts
      : localStats.topProducts;

    const sellerPerformanceList = (globalStats?.sellerPerformance && globalStats.sellerPerformance.length > 0)
      ? globalStats.sellerPerformance
      : localStats.sellerPerformance;

    return (
      <div className="space-y-6">

        {isAdmin ? (
          globalStats ? (
            <div className="grid gap-8 sm:grid-cols-2">
              {/* Top Products */}
              <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm dark:bg-black dark:border dark:border-white/10">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3 mb-4">
                  <h4 className="text-base font-bold text-slate-955 dark:text-white uppercase tracking-wider">Productos más vendidos</h4>
                  <ArrowUpRight className="h-5 w-5 text-slate-955 dark:text-white" />
                </div>
                {topProductsList.length === 0 ? (
                  <p className="text-sm font-normal text-slate-955 dark:text-white py-4">No hay ventas en la base de datos.</p>
                ) : (
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                    {topProductsList.map(({ product, totalSold }) => (
                      <div key={product.id} className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 dark:hover:bg-neutral-900/30 rounded-xl transition-colors">
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
                            <span className="text-xs font-normal text-slate-955 dark:text-white/80 block mt-1">
                              {formatCurrency(Number(product.price))}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base md:text-lg font-bold text-cyan-600 dark:text-cyan-400">{totalSold} unds</p>
                          <p className="text-xs font-medium text-slate-955 dark:text-white uppercase tracking-wider block mt-0.5">vendidos</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seller performance ranking */}
              <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm dark:bg-black dark:border dark:border-white/10">
                <div className="border-b border-slate-100 dark:border-neutral-900 pb-3 mb-4">
                  <h4 className="text-base font-bold text-slate-955 dark:text-white uppercase tracking-wider">Rendimiento por Vendedor</h4>
                </div>
                {sellerPerformanceList.length === 0 ? (
                  <p className="text-sm font-normal text-slate-955 dark:text-white py-4">No hay estadísticas de vendedores.</p>
                ) : (
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                    {sellerPerformanceList.map(({ seller, ordersDelivered, totalRevenue }) => (
                      <div key={seller.id} className="space-y-2.5 px-1">
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-955 dark:text-white">
                          <span>
                            {seller ? (
                              `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || seller.email || 'Vendedor'
                            ) : 'Empleado'}
                          </span>
                          <span className="font-bold text-slate-955 dark:text-white">
                            {formatCurrency(totalRevenue)} <span className="text-xs font-normal text-slate-955 dark:text-white">({ordersDelivered} {ordersDelivered === 1 ? 'pedido' : 'pedidos'})</span>
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100 dark:bg-neutral-900/60 overflow-hidden shadow-inner">
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
          ) : isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 bg-white dark:bg-black dark:border dark:border-white/10 rounded-2xl shadow-sm">
              <div className="h-9 w-9 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
              <span className="text-sm font-semibold text-slate-955 dark:text-white">Cargando métricas globales...</span>
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center gap-3 bg-white dark:bg-black dark:border dark:border-white/10 rounded-2xl shadow-sm">
              <span className="text-sm font-semibold text-red-500">Error al cargar las métricas. Intente recargar la página.</span>
            </div>
          )
        ) : (
          /* Seller-specific Dispatch summary with extra sections */
          (() => {
            const dispatchedOrders = orders.filter((o) => o.status === 'SHIPPED' || o.status === 'DELIVERED');
            const dispatchedCount = dispatchedOrders.length;
            const dispatchedRevenue = dispatchedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
            const ordersVal = activeSellerStats?.totalOrdersAssigned ?? orders.length;

            return (
              <div className="space-y-8">
                {/* Efficiency card */}
                <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm dark:bg-black dark:border dark:border-white/10">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                      <Package className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="text-lg md:text-xl font-medium text-slate-955 dark:text-white uppercase tracking-wider">Eficiencia de Envío</h4>
                      <p className="text-base md:text-lg lg:text-xl font-normal text-slate-955 dark:text-white leading-relaxed mt-2.5">
                        Se han enviado de forma exitosa <span className="font-medium text-slate-955 dark:text-white">{dispatchedCount}</span> de los <span className="font-medium text-slate-955 dark:text-white">{ordersVal}</span> pedidos asignados. Esto equivale a un total de <span className="font-medium text-emerald-600 dark:text-emerald-400">{totalItemsSold}</span> componentes físicos de hardware enviados por el vendedor.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                  {/* Card 1: Monto Promedio */}
                  <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm dark:bg-black dark:border dark:border-white/10">
                    <span className="text-sm md:text-base font-normal text-slate-955 dark:text-white uppercase tracking-widest block">Monto Promedio por Pedido</span>
                    <p className="text-4xl md:text-5xl font-normal text-slate-900 dark:text-white mt-3">
                      {formatCurrency(dispatchedCount > 0 ? dispatchedRevenue / dispatchedCount : 0)}
                    </p>
                    <p className="text-sm md:text-base text-slate-500 dark:text-white/60 font-normal mt-2.5">Suma media facturada para los envíos y entregas</p>
                  </div>

                  {/* Card 2: Volumen de Envío */}
                  <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm dark:bg-black dark:border dark:border-white/10">
                    <span className="text-sm md:text-base font-normal text-slate-955 dark:text-white uppercase tracking-widest block">Volumen de Envío</span>
                    <p className="text-4xl md:text-5xl font-normal text-slate-900 dark:text-white mt-3">
                      {dispatchedCount} <span className="text-base font-normal text-slate-500 dark:text-white/60">pedidos</span>
                    </p>
                    <p className="text-sm md:text-base text-slate-500 dark:text-white/60 font-normal mt-2.5">Total de transacciones enviadas o entregadas</p>
                  </div>
                </div>

                {/* Dynamic Seller Top Components List */}
                <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm dark:bg-black dark:border dark:border-white/10">
                  <h4 className="text-lg md:text-xl font-medium text-slate-955 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-neutral-800 pb-3">Componentes Despachados por el Vendedor</h4>
                  {sellerProducts.length === 0 ? (
                    <p className="text-base md:text-lg font-medium text-slate-955 dark:text-white">No se han registrado envíos para cuantificar componentes despachados.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-neutral-900">
                      {sellerProducts.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center py-4">
                          <div>
                            <span className="text-lg md:text-xl font-normal text-slate-955 dark:text-white block leading-tight">
                              {p.name} <span className="text-sm md:text-base font-normal text-slate-500 dark:text-white/60 ml-2">({formatCurrency(p.price)})</span>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg md:text-xl font-normal text-cyan-600 dark:text-cyan-400 block">{p.quantity} unds</span>
                            <span className="text-xs font-normal text-slate-500 dark:text-white/60 uppercase tracking-wider block">despachadas</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm shadow-slate-200/70 dark:bg-black dark:shadow-none dark:border dark:border-white/10">
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
        </div>
      </div>

      {/* Control bar (Filtros) - Only rendered when tab uses them */}
      {(activeTab === 'general' || activeTab === 'orders') && (
        <div className="mb-4 rounded-2xl bg-white/70 dark:bg-black dark:border dark:border-white/10 p-4 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-end gap-3 w-full">
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
