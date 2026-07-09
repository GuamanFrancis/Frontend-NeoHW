import { useEffect, useMemo, useState } from 'react';
import { getOrders, type OrderBackend } from '../../../services/ordersService';
import { getGlobalStats, type GlobalStats } from '../../../services/statisticsService';
import { getCatalogComponents } from '../../../services/catalogService';
import { getUsers } from '../../../services/usersService';

export const useAdminStats = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'orders' | 'performance'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<OrderBackend[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [period, setPeriod] = useState<'diario' | 'semanal' | 'mensual'>('mensual');
  const [chartType, setChartType] = useState<'linea' | 'barras'>('linea');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [stockStats, setStockStats] = useState<{ available: number; lowStock: number; outOfStock: number } | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setIsLoading(true);

      // 1. Fetch all orders (limit 1000)
      try {
        const ordersRes = await getOrders(undefined, 1, 1000);
        if (active && ordersRes && Array.isArray(ordersRes.data)) {
          setOrders(ordersRes.data);
        }
      } catch (err) {
        console.error('Error fetching admin orders:', err);
      }

      // 2. Fetch global stats
      try {
        const globalRes = await getGlobalStats();
        if (active && globalRes?.stats) {
          setGlobalStats(globalRes.stats);
        }
      } catch (err) {
        console.error('Error fetching global stats:', err);
      }

      // 3. Fetch catalog for stock breakdown
      try {
        let allItems: any[] = [];
        const limit = 100;
        const page1 = await getCatalogComponents({ page: 1, limit });
        if (active && page1 && Array.isArray(page1.items)) {
          allItems = [...page1.items];
          const total = page1.total || 0;
          if (total > limit) {
            const pagesNeeded = Math.ceil(total / limit);
            const promises = [];
            for (let p = 2; p <= pagesNeeded; p++) {
              promises.push(getCatalogComponents({ page: p, limit }));
            }
            const results = await Promise.all(promises);
            results.forEach((res) => {
              if (res && Array.isArray(res.items)) {
                allItems = [...allItems, ...res.items];
              }
            });
          }

          let available = 0;
          let lowStock = 0;
          let outOfStock = 0;
          for (const prod of allItems) {
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

      // 4. Fetch all users for seller lookup
      try {
        const usersRes = await getUsers(1, 250);
        if (active && usersRes && Array.isArray(usersRes.users)) {
          setUsers(usersRes.users);
        }
      } catch (err) {
        console.error('Error fetching users for seller lookup:', err);
      }

      if (active) setIsLoading(false);
    };

    void fetchData();

    return () => {
      active = false;
    };
  }, []);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter((order) => {
      const orderIdMatch = order.id.toLowerCase().includes(query);
      const userEmailMatch = order.user?.email?.toLowerCase().includes(query);
      const userNameMatch = (
        (order.user?.firstName || '') + ' ' + (order.user?.lastName || '')
      ).toLowerCase().includes(query);
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

  // Chart coordinate calculations
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

  // Construct a robust mapping of seller ID -> full name or email
  const sellerMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((u) => {
      if (u.role === 'vendedor') {
        const fn = u.firstName || '';
        const ln = u.lastName || '';
        const name = [fn, ln].filter(Boolean).join(' ') || u.email;
        map[u.id] = name;
      }
    });
    if (globalStats?.sellerPerformance) {
      globalStats.sellerPerformance.forEach((sp) => {
        if (sp.seller) {
          const fn = sp.seller.firstName || '';
          const ln = sp.seller.lastName || '';
          const name = [fn, ln].filter(Boolean).join(' ') || sp.seller.email;
          map[sp.seller.id] = name;
        }
      });
    }
    return map;
  }, [users, globalStats]);

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    orders,
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
    sellerMap,
  };
};
