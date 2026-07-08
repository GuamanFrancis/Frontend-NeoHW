import { api, getProductImageUrl } from './api';

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
  const { data } = await api.get<any>('/statistics/seller');
  const statsObj = data?.stats || data;
  return { stats: statsObj };
};

export const getGlobalStats = async (): Promise<{ stats: GlobalStats }> => {
  const { data } = await api.get<any>('/statistics/global');
  const statsObj = data?.stats || data;
  
  if (statsObj) {
    if (statsObj.topProducts && Array.isArray(statsObj.topProducts)) {
      statsObj.topProducts = statsObj.topProducts
        .filter((item: any) => item && item.product != null)
        .map((item: any) => ({
          ...item,
          product: {
            ...item.product!,
            imageUrl: getProductImageUrl(item.product!.imageUrl),
          },
        }));
    }
    if (statsObj.sellerPerformance && Array.isArray(statsObj.sellerPerformance)) {
      statsObj.sellerPerformance = statsObj.sellerPerformance.filter((item: any) => item && item.seller != null);
    }
  }
  
  return { stats: statsObj };
};
