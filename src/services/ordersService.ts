import { api, getProductImageUrl } from './api';

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
  trackingCode?: string | null;
  userId: string;
  status: 'PENDING_PAYMENT' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal?: number | string;
  taxAmount?: number | string;
  totalAmount: number | string;
  shippingAddress: string | Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  assignedSellerId?: string | null;
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
  if (data && Array.isArray(data.data)) {
    data.data.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.product) {
            item.product.imageUrl = getProductImageUrl(item.product.imageUrl);
          }
        });
      }
    });
  }
  return data;
};

export const getMyOrders = async (
  page?: number,
  limit?: number
): Promise<OrdersResponse> => {
  const { data } = await api.get<OrdersResponse>('/orders/my-orders', {
    params: { page, limit },
  });
  if (data && Array.isArray(data.data)) {
    data.data.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.product) {
            item.product.imageUrl = getProductImageUrl(item.product.imageUrl);
          }
        });
      }
    });
  }
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
  if (data?.order?.items && Array.isArray(data.order.items)) {
    data.order.items.forEach(item => {
      if (item.product) {
        item.product.imageUrl = getProductImageUrl(item.product.imageUrl);
      }
    });
  }
  return data;
};

export type UploadDocumentResponse = {
  message?: string;
  document?: {
    id: string;
    documentType: string;
    fileUrl: string;
    createdAt: string;
  };
  fileUrl?: string;
};

export const uploadOrderDocument = async (
  id: string,
  file: File,
  documentType: 'SHIPPING_PROOF' | 'DELIVERY_PHOTO' | 'CUSTOMER_SIGNATURE'
): Promise<UploadDocumentResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  const { data } = await api.post<UploadDocumentResponse>(`/orders/${id}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};




