import { api } from './api';
import type {
  BackendProduct,
  CatalogComponent,
  CatalogListResponse,
  CatalogQueryParams,
  CatalogSavePayload,
  CatalogStockStatus,
} from '../types/catalog';

type ProductsListResponse = {
  data: BackendProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
type SingleProductResponse = {
  product: BackendProduct;
  message?: string;
};

const stockToStatus = (stock: number): CatalogStockStatus => {
  if (stock <= 0) return 'agotado';
  if (stock <= 10) return 'stock-bajo';
  return 'disponible';
};
const normalizeProduct = (product: BackendProduct): CatalogComponent => ({
  id: product.id,
  name: product.name,
  description: product.description || 'Sin descripcion',
  category: product.category?.name ?? 'Sin categoria',
  categorySlug: product.category?.slug ?? 'sin-categoria',
  categoryId: product.categoryId,
  brand: product.brand || 'Sin marca',
  price: product.price,
  stock: product.stock,
  status: stockToStatus(product.stock),
  imageUrl: product.imageUrl,
  model: product.model || null,
  sku: product.sku || null,
  attributes: product.attributes || [],
  sellerId: product.sellerId,
});

export const getCatalogComponents = async (
  query: CatalogQueryParams = {},
): Promise<CatalogListResponse> => {
  const { data } = await api.get<ProductsListResponse>('/products', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 100,
      search: query.search || undefined,
      category: query.category || undefined,
      brand: query.brand || undefined,
      minPrice: query.minPrice ?? undefined,
      maxPrice: query.maxPrice ?? undefined,
      sort: query.sort || undefined,
      order: query.order || undefined,
      sellerId: query.sellerId || undefined,
    },
  });
  return {
    items: data.data.map(normalizeProduct),
    total: data.meta.total,
    page: data.meta.page,
    limit: data.meta.limit,
  };
};
export const createCatalogComponent = async (
  payload: CatalogSavePayload,
): Promise<CatalogComponent> => {
  const { data } = await api.post<SingleProductResponse>('/products', {
    name: payload.name.trim(),
    description: payload.description.trim() || undefined,
    categoryId: payload.categoryId,
    brand: payload.brand.trim() || undefined,
    price: payload.price,
    stock: payload.stock,
    imageUrl: payload.imageUrl?.trim() || undefined,
    model: payload.model?.trim() || undefined,
    sku: payload.sku?.trim() || undefined,
    sellerId: payload.sellerId || undefined,
  });
  return normalizeProduct(data.product);
};
export const updateCatalogComponent = async (
  id: string,
  payload: Partial<CatalogSavePayload>,
): Promise<CatalogComponent> => {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name.trim();
  if (payload.description !== undefined) body.description = payload.description.trim() || undefined;
  if (payload.categoryId !== undefined) body.categoryId = payload.categoryId;
  if (payload.brand !== undefined) body.brand = payload.brand.trim() || undefined;
  if (payload.price !== undefined) body.price = payload.price;
  if (payload.stock !== undefined) body.stock = payload.stock;
  if (payload.imageUrl !== undefined) body.imageUrl = payload.imageUrl.trim() || undefined;
  if (payload.model !== undefined) body.model = payload.model.trim() || undefined;
  if (payload.sku !== undefined) body.sku = payload.sku.trim() || undefined;
  if (payload.sellerId !== undefined) body.sellerId = payload.sellerId;
  const { data } = await api.patch<SingleProductResponse>(`/products/${id}`, body);
  return normalizeProduct(data.product);
};
export const deleteCatalogComponent = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};

export const getCatalogComponentById = async (id: string): Promise<CatalogComponent> => {
  const { data } = await api.get<SingleProductResponse>(`/products/${id}`);
  return normalizeProduct(data.product);
};

