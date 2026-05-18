import { api } from './api';
import type { BackendCategory } from '../types/catalog';

type CategoriesResponse = {
  data: BackendCategory[];
  total: number;
};

/**
 * Fetches all categories from the backend.
 * Returns the flat list including nested children.
 */
export const getCategories = async (): Promise<BackendCategory[]> => {
  const { data } = await api.get<CategoriesResponse>('/categories');
  return data.data;
};

/**
 * Flattens the category tree into a single-level array.
 * Useful for populating select dropdowns.
 */
export const flattenCategories = (categories: BackendCategory[]): BackendCategory[] => {
  const flat: BackendCategory[] = [];

  const walk = (list: BackendCategory[]) => {
    for (const cat of list) {
      flat.push(cat);
      if (cat.children && cat.children.length > 0) {
        walk(cat.children);
      }
    }
  };

  walk(categories);
  return flat;
};

/**
 * Returns only leaf categories (no children) which are the ones
 * products can be assigned to.
 */
export const getLeafCategories = (categories: BackendCategory[]): BackendCategory[] => {
  const all = flattenCategories(categories);
  return all.filter((cat) => !cat.children || cat.children.length === 0);
};
