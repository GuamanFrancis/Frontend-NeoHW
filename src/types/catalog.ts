export type CatalogStockStatus = 'disponible' | 'stock-bajo' | 'agotado';

/* ── Category (from GET /categories) ── */

export type BackendCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: BackendCategory[];
};

/* ── Product attribute (nested in product response) ── */

export type BackendProductAttribute = {
  name: string;
  value: string;
  unit: string | null;
};

/* ── Product (from GET /products) ── */

export type BackendProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryId: string;
  sellerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  attributes?: BackendProductAttribute[];
};

/* ── Normalized catalog item used in UI ── */

export type CatalogComponent = {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryId: string;
  brand: string;
  price: number;
  stock: number;
  status: CatalogStockStatus;
  imageUrl: string | null;
};

/* ── Query params for listing ── */

export type CatalogQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  order?: 'asc' | 'desc';
};

/* ── Paginated response from GET /products ── */

export type CatalogListResponse = {
  items: CatalogComponent[];
  total: number;
  page: number;
  limit: number;
};

/* ── Payload for create / update ── */

export type CatalogSavePayload = {
  name: string;
  description: string;
  categoryId: string;
  brand: string;
  price: number;
  stock: number;
  imageUrl?: string;
  model?: string;
  sku?: string;
};
