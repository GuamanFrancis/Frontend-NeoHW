import { api } from './api';
import { normalizeProduct } from './catalogService';
import type { CatalogComponent } from '../types/catalog';

export type BackendCartItem = {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: any;
};

export type BackendCart = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: BackendCartItem[];
};

export type CartItemMapped = {
  id: string;
  product: CatalogComponent;
  quantity: number;
};

export const getCart = async (): Promise<CartItemMapped[]> => {
  const { data } = await api.get<BackendCart>('/carts');
  if (data && Array.isArray(data.items)) {
    return data.items.map((item) => ({
      id: item.id,
      product: normalizeProduct(item.product),
      quantity: Number(item.quantity) || 1,
    }));
  }
  return [];
};

export const addToCart = async (productId: string, quantity: number): Promise<void> => {
  await api.post('/carts/items', { productId, quantity });
};

export const updateCartItem = async (cartItemId: string, quantity: number): Promise<void> => {
  await api.patch(`/carts/items/${cartItemId}`, { quantity });
};

export const removeCartItem = async (cartItemId: string): Promise<void> => {
  await api.delete(`/carts/items/${cartItemId}`);
};
