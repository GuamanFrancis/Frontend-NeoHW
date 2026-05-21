import { api } from './api';
import type { BackendCategory } from '../types/catalog';

type CategoriesResponse = {
  data: BackendCategory[];
  total: number;
};


export const getCategories = async (): Promise<BackendCategory[]> => {
  const { data } = await api.get<CategoriesResponse>('/categories');
  return data.data;
};


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


export const getLeafCategories = (categories: BackendCategory[]): BackendCategory[] => {
  const all = flattenCategories(categories);
  return all.filter((cat) => !cat.children || cat.children.length === 0);
};
