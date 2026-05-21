export type CatalogStockStatus = 'disponible' | 'stock-bajo' | 'agotado';



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



export type BackendProductAttribute = {
  name: string;
  value: string;
  unit: string | null;
};



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



export type CatalogComponent = {
  id: string;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  categoryId: string;
  brand: string;
  price: number;
  stock: number;
  status: CatalogStockStatus;
  imageUrl: string | null;
  model: string | null;
  sku: string | null;
  attributes: BackendProductAttribute[];
};



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



export type CatalogListResponse = {
  items: CatalogComponent[];
  total: number;
  page: number;
  limit: number;
};



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
