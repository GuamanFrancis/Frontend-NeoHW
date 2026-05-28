import { api } from './api';
import type { BackendRole, BackendUser } from '../types/auth';

export type UsersListResponse = {
  users: BackendUser[];
  total: number;
  page: number;
  limit: number;
};

export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export const getUsers = async (page = 1, limit = 100) => {
  const { data } = await api.get<UsersListResponse>('/users', {
    params: { page, limit },
  });

  return data;
};

export const updateUser = async (id: string, payload: UpdateUserPayload) => {
  const { data } = await api.patch<{ message: string; user: BackendUser }>(`/users/${id}`, payload);
  return data.user;
};

export const changeUserRole = async (id: string, role: BackendRole) => {
  const { data } = await api.patch<{ message: string; user: BackendUser }>(`/users/${id}/role`, { role });
  return data.user;
};

export const deactivateUser = async (id: string) => {
  const { data } = await api.delete<{ message: string; user: BackendUser }>(`/users/${id}`);
  return data.user;
};

export const getUserById = async (id: string) => {
  const { data } = await api.get<{ user: BackendUser }>(`/users/${id}`);
  return data.user;
};

