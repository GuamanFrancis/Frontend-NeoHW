import axios from 'axios';
import { api } from './api';
import type {
  CatalogComponent,
  CatalogListResponse,
  CatalogQueryParams,
  CatalogSavePayload,
  CatalogStockStatus,
} from '../types/catalog';

type UnknownRecord = Record<string, unknown>;

const catalogPathCandidates = [
  '/componentes',
  '/components',
  '/admin/componentes',
  '/admin/components',
  '/catalogo/componentes',
  '/catalog/components',
  '/catalogo/admin/componentes',
  '/catalog/admin/components',
  '/catalogo',
  '/catalog',
  '/productos',
  '/products',
  '/api/componentes',
  '/api/components',
  '/api/admin/componentes',
  '/api/admin/components',
  '/api/catalogo/componentes',
  '/api/catalog/components',
  '/api/productos',
  '/api/products',
  '/v1/componentes',
  '/v1/components',
  '/v1/catalogo/componentes',
  '/v1/catalog/components',
  '/v1/productos',
  '/v1/products',
  '/v1/admin/componentes',
  '/v1/admin/components',
] as const;

let cachedCatalogPath: string | null = null;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const pickString = (source: UnknownRecord, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const pickNumber = (source: UnknownRecord, keys: string[], fallback = 0) => {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
};

const normalizeStatus = (rawStatus: unknown, stock: number): CatalogStockStatus => {
  if (typeof rawStatus === 'string') {
    const normalized = rawStatus.trim().toLowerCase();

    if (
      normalized.includes('agot') ||
      normalized.includes('out') ||
      normalized.includes('sold') ||
      normalized.includes('sin stock')
    ) {
      return 'agotado';
    }

    if (normalized.includes('bajo') || normalized.includes('low')) {
      return 'stock-bajo';
    }

    if (normalized.includes('dispon') || normalized.includes('avail') || normalized.includes('in_stock')) {
      return 'disponible';
    }
  }

  if (stock <= 0) return 'agotado';
  if (stock <= 10) return 'stock-bajo';
  return 'disponible';
};

const normalizeItem = (rawItem: unknown): CatalogComponent | null => {
  if (!isRecord(rawItem)) return null;

  const id = pickString(rawItem, ['id', '_id', 'uuid']);
  const name = pickString(rawItem, ['name', 'title', 'nombre', 'productName']);
  const description = pickString(rawItem, ['description', 'descripcion', 'model', 'details']);
  const category = pickString(rawItem, ['category', 'categoria', 'type']) || 'Sin categoria';
  const brand = pickString(rawItem, ['brand', 'marca', 'manufacturer']) || 'Sin marca';
  const price = pickNumber(rawItem, ['price', 'precio', 'unitPrice']);
  const stock = Math.max(0, Math.trunc(pickNumber(rawItem, ['stock', 'cantidad', 'quantity', 'inventory'], 0)));
  const imageUrl = pickString(rawItem, ['imageUrl', 'image', 'thumbnail', 'photo']) || null;
  const status = normalizeStatus(rawItem.status, stock);

  if (!id || !name) return null;

  return {
    id,
    name,
    description: description || 'Sin descripcion',
    category,
    brand,
    price,
    stock,
    status,
    imageUrl,
  };
};

const getItemsFromData = (data: unknown): CatalogComponent[] => {
  if (Array.isArray(data)) {
    return data
      .map((item) => normalizeItem(item))
      .filter((item): item is CatalogComponent => Boolean(item));
  }

  if (!isRecord(data)) return [];

  const containerKeys = ['components', 'componentes', 'items', 'products', 'productos', 'catalog', 'data', 'results'];
  const arrayContainer = containerKeys.find((key) => Array.isArray(data[key]));
  const list = arrayContainer ? (data[arrayContainer] as unknown[]) : [];

  const normalizedList = list
    .map((item) => normalizeItem(item))
    .filter((item): item is CatalogComponent => Boolean(item));

  if (normalizedList.length > 0) {
    return normalizedList;
  }

  for (const value of Object.values(data)) {
    if (!isRecord(value)) continue;

    const nested = getItemsFromData(value);
    if (nested.length > 0) {
      return nested;
    }
  }

  return [];
};

const getTotalFromData = (data: unknown, currentItemsCount: number) => {
  if (!isRecord(data)) return currentItemsCount;

  const total = pickNumber(data, ['total', 'count', 'totalItems', 'totalCount'], currentItemsCount);
  return Math.max(currentItemsCount, Math.trunc(total));
};

const getCatalogList = async (path: string, query: CatalogQueryParams): Promise<CatalogListResponse> => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 100;
  const category = query.category && query.category !== 'todos' ? query.category : undefined;
  const status = query.status && query.status !== 'todos' ? query.status : undefined;

  const { data } = await api.get(path, {
    params: {
      page,
      limit,
      search: query.search || undefined,
      q: query.search || undefined,
      category,
      categoria: category,
      status,
    },
  });

  const items = getItemsFromData(data);

  return {
    items,
    total: getTotalFromData(data, items.length),
    page,
    limit,
  };
};

const ensureCatalogPath = async (): Promise<string> => {
  if (cachedCatalogPath) return cachedCatalogPath;

  const unavailableStatuses = new Set([404, 405]);
  const errors: string[] = [];

  for (const path of catalogPathCandidates) {
    try {
      await getCatalogList(path, { page: 1, limit: 200 });
      cachedCatalogPath = path;
      return path;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) throw error;
        if (status && unavailableStatuses.has(status)) {
          errors.push(`${path} -> ${status}`);
          continue;
        }
      }

      errors.push(`${path} -> error`);
    }
  }

  throw new Error(`No se encontro un endpoint de catalogo disponible (${errors.join(', ')})`);
};

const toBackendPayload = (payload: CatalogSavePayload) => ({
  name: payload.name.trim(),
  description: payload.description.trim() || undefined,
  category: payload.category.trim(),
  brand: payload.brand.trim(),
  price: payload.price,
  stock: payload.stock,
  status: payload.status,
  imageUrl: payload.imageUrl?.trim() || undefined,
});

const parseSingleCatalogItem = (data: unknown) => {
  if (isRecord(data)) {
    const wrapped = ['component', 'item', 'product', 'data', 'catalogItem', 'componente'];
    for (const key of wrapped) {
      const normalized = normalizeItem(data[key]);
      if (normalized) return normalized;
    }
  }

  return normalizeItem(data);
};

export const getCatalogComponents = async (query: CatalogQueryParams = {}): Promise<CatalogListResponse> => {
  const catalogPath = await ensureCatalogPath();
  return getCatalogList(catalogPath, query);
};

export const createCatalogComponent = async (payload: CatalogSavePayload): Promise<CatalogComponent> => {
  const catalogPath = await ensureCatalogPath();

  const { data } = await api.post(catalogPath, toBackendPayload(payload));
  const item = parseSingleCatalogItem(data);
  if (!item) throw new Error('El backend no devolvio el componente creado en un formato valido.');

  return item;
};

export const updateCatalogComponent = async (id: string, payload: CatalogSavePayload): Promise<CatalogComponent> => {
  const catalogPath = await ensureCatalogPath();

  const resourcePath = `${catalogPath}/${id}`;

  try {
    const { data } = await api.patch(resourcePath, toBackendPayload(payload));
    const item = parseSingleCatalogItem(data);
    if (!item) throw new Error('El backend no devolvio el componente actualizado en un formato valido.');
    return item;
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 405) {
      throw error;
    }

    const { data } = await api.put(resourcePath, toBackendPayload(payload));
    const item = parseSingleCatalogItem(data);
    if (!item) throw new Error('El backend no devolvio el componente actualizado en un formato valido.');
    return item;
  }
};

export const deleteCatalogComponent = async (id: string) => {
  const catalogPath = await ensureCatalogPath();

  const resourcePath = `${catalogPath}/${id}`;
  await api.delete(resourcePath);
};
