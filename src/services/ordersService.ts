import { api } from './api';

export type CreateOrderPayload = {
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};

export type CreateOrderResponse = {
  message: string;
  orderId: string;
  totalAmount: number;
};

export type OrderItemBackend = {
  id: string;
  productId: string;
  quantity: number;
  priceAtTime: number | string;
  product: {
    name: string;
    sku: string | null;
    imageUrl?: string | null;
  };
};

export type OrderBackend = {
  id: string;
  userId: string;
  status: 'PENDING_PAYMENT' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number | string;
  shippingAddress: string | Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemBackend[];
  documents?: {
    id: string;
    documentType: 'SHIPPING_PROOF' | 'DELIVERY_PHOTO' | 'CUSTOMER_SIGNATURE';
    fileUrl: string;
    createdAt: string;
  }[];
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

export type OrdersMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type OrdersResponse = {
  data: OrderBackend[];
  meta: OrdersMeta;
};

export const createOrder = async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
  const { data } = await api.post<CreateOrderResponse>('/orders', payload);
  return data;
};

export type CreateOrderFromCartPayload = {
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};

export const createOrderFromCart = async (
  payload: CreateOrderFromCartPayload
): Promise<CreateOrderResponse> => {
  const { data } = await api.post<CreateOrderResponse>('/orders/from-cart', payload);
  return data;
};

export const getOrders = async (
  status?: string,
  page?: number,
  limit?: number
): Promise<OrdersResponse> => {
  const { data } = await api.get<OrdersResponse>('/orders', {
    params: { status, page, limit },
  });
  return data;
};

export const updateOrderStatus = async (
  id: string,
  status: string
): Promise<{ message: string; order: OrderBackend }> => {
  const { data } = await api.patch<{ message: string; order: OrderBackend }>(
    `/orders/${id}/status`,
    { status }
  );
  return data;
};

export const uploadOrderDocument = async (
  id: string,
  file: File,
  documentType: 'SHIPPING_PROOF' | 'DELIVERY_PHOTO' | 'CUSTOMER_SIGNATURE'
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  const { data } = await api.post(`/orders/${id}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const updateLocalOrder = (
  orderId: string,
  status: string,
  doc?: { documentType: string; fileUrl: string }
) => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('client_orders_')) {
      try {
        const orders = JSON.parse(localStorage.getItem(key) || '[]');
        let updated = false;
        const newOrders = orders.map((o: any) => {
          if (o.id === orderId) {
            updated = true;
            const updatedOrder = { ...o, status };
            if (doc) {
              const docs = o.documents || [];
              if (!docs.some((d: any) => d.documentType === doc.documentType)) {
                docs.push({
                  id: Math.random().toString(),
                  documentType: doc.documentType,
                  fileUrl: doc.fileUrl,
                  createdAt: new Date().toISOString()
                });
              }
              updatedOrder.documents = docs;
            }
            return updatedOrder;
          }
          return o;
        });
        if (updated) {
          localStorage.setItem(key, JSON.stringify(newOrders));
          break;
        }
      } catch (e) {
        console.error(e);
      }
    }
  }
};


