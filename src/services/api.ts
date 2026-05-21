import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { normalizeAuthResponse } from './authMapper';
import { clearStoredSession, getStoredAccessToken, updateStoredSession } from './session';
import type { BackendAuthResponse } from '../types/auth';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = getStoredAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const requestUrl = originalRequest?.url ?? '';
    const isAuthExchange = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'].some((path) =>
      requestUrl.includes(path),
    );

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthExchange) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { data } = await api.post<BackendAuthResponse>('/auth/refresh');
      const session = normalizeAuthResponse(data);

      updateStoredSession(session);
      originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearStoredSession();
      if (
        window.location.pathname.startsWith('/cliente') ||
        window.location.pathname.startsWith('/vendedor') ||
        window.location.pathname.startsWith('/admin')
      ) {
        window.location.href = '/login';
      } else {
        window.location.reload();
      }
      return Promise.reject(refreshError);
    }
  },
);
