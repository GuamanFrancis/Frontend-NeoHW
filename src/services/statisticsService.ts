import { api } from './api';

export type OrdersByStatus = Record<string, number>;

export type SellerStats = {
  sellerId: string;
  totalOrdersAssigned: number;
  ordersByStatus: OrdersByStatus;
  pendingOrders: number;
  totalRevenue: number;
  totalDelivered: number;
};

export type TopProductStat = {
  product: {
    id: string;
    name: string;
    sku: string | null;
    price: number | string;
    imageUrl: string | null;
  };
  totalSold: number;
};

export type SellerPerformanceStat = {
  seller: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  ordersDelivered: number;
  totalRevenue: number;
};

export type GlobalStats = {
  overview: {
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    totalRevenue: number;
    totalDelivered: number;
  };
  ordersByStatus: OrdersByStatus;
  topProducts: TopProductStat[];
  sellerPerformance: SellerPerformanceStat[];
};

export const getSellerStats = async (): Promise<{ stats: SellerStats }> => {
  const { data } = await api.get<{ stats: SellerStats }>('/statistics/seller');
  return data;
};

export const getGlobalStats = async (): Promise<{ stats: GlobalStats }> => {
  const { data } = await api.get<{ stats: GlobalStats }>('/statistics/global');
  return data;
};
