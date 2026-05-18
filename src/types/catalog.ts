export type CatalogStockStatus = 'disponible' | 'stock-bajo' | 'agotado';

export type CatalogComponent = {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  status: CatalogStockStatus;
  imageUrl: string | null;
};

export type CatalogQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: CatalogStockStatus | 'todos';
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
  category: string;
  brand: string;
  price: number;
  stock: number;
  imageUrl?: string;
  status?: CatalogStockStatus;
};
