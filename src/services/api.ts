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

const errorTranslations: Record<string, string> = {
  'invalid credentials': 'Credenciales incorrectas.',
  'user is disabled': 'Tu usuario está deshabilitado. Contacta al administrador.',
  'user not found': 'Usuario no encontrado.',
  'password is incorrect': 'La contraseña es incorrecta.',
  'email already exists': 'El correo electrónico ya está registrado.',
  'invalid or expired token': 'El código es inválido o ha expirado.',
  'otp code invalid or expired': 'Código de verificación inválido o expirado.',
  'invalid otp code': 'Código de verificación inválido.',
  'unauthorized': 'No autorizado.',
  'forbidden': 'Acceso prohibido.',
  'forbidden resource': 'Acceso denegado.',
};

const translateMessage = (msg: unknown): any => {
  if (typeof msg === 'string') {
    const trimmed = msg.trim().toLowerCase();
    if (errorTranslations[trimmed]) {
      return errorTranslations[trimmed];
    }
    for (const key of Object.keys(errorTranslations)) {
      if (trimmed.includes(key)) {
        return errorTranslations[key];
      }
    }
    return msg;
  }
  if (Array.isArray(msg)) {
    return msg.map(translateMessage);
  }
  return msg;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as { message?: unknown };
      if (data.message) {
        data.message = translateMessage(data.message);
      }
    }

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
