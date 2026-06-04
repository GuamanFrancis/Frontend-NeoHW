import { api } from './api';

export type BackendProjectItem = {
  id: string;
  projectId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: {
    name: string;
    sku: string | null;
    price: number | string;
    imageUrl: string | null;
  };
};

export type BackendProject = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  items: BackendProjectItem[];
};

export type SaveProjectPayload = {
  name: string;
  description?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
};

export const getProjects = async (): Promise<BackendProject[]> => {
  const { data } = await api.get<{ projects: BackendProject[] }>('/projects');
  return data.projects || [];
};

export const saveProject = async (payload: SaveProjectPayload): Promise<BackendProject> => {
  const { data } = await api.post<{ message: string; project: BackendProject }>('/projects', payload);
  return data.project;
};
