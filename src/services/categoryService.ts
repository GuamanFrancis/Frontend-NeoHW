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

export const getCategoryById = async (id: string): Promise<BackendCategory> => {
  const { data } = await api.get<{ category: BackendCategory }>(`/categories/${id}`);
  return data.category;
};

export const createCategory = async (payload: {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
}): Promise<BackendCategory> => {
  const { data } = await api.post<{ message: string; category: BackendCategory }>('/categories', payload);
  return data.category;
};

export const updateCategory = async (
  id: string,
  payload: Partial<{
    name: string;
    slug: string;
    description: string;
    parentId: string | null;
    isActive: boolean;
  }>,
): Promise<BackendCategory> => {
  const { data } = await api.patch<{ message: string; category: BackendCategory }>(`/categories/${id}`, payload);
  return data.category;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/categories/${id}`);
};

