import { api } from './api';
import { normalizeAuthResponse } from './authMapper';
import { clearStoredSession, saveStoredSession } from './session';
import type {
  AuthResponse,
  BackendAuthResponse,
  BackendUser,
  LoginFormValues,
  RegisterFormValues,
} from '../types/auth';

export { normalizeAuthResponse, normalizeBackendUser, roleHomeRoutes } from './authMapper';

export const loginUser = async (values: LoginFormValues): Promise<AuthResponse> => {
  const { data } = await api.post<BackendAuthResponse>('/auth/login', {
    email: values.email,
    password: values.password,
  });

  return normalizeAuthResponse(data);
};

export const loginWithGoogle = async (token: string): Promise<AuthResponse> => {
  const { data } = await api.post<BackendAuthResponse>('/auth/social/google', {
    token,
  });

  return normalizeAuthResponse(data);
};

export const loginWithFacebook = async (token: string): Promise<AuthResponse> => {
  const { data } = await api.post<BackendAuthResponse>('/auth/social/facebook', {
    token,
  });

  return normalizeAuthResponse(data);
};

export const registerUser = async (values: RegisterFormValues): Promise<AuthResponse> => {
  const { data } = await api.post<BackendAuthResponse>('/auth/register', {
    email: values.email,
    password: values.password,
  });

  return normalizeAuthResponse(data);
};

export const saveSession = (session: AuthResponse, remember = true) => {
  saveStoredSession(session, remember);
};

export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    
  } finally {
    clearStoredSession();
  }
};

export const getMyProfile = async (): Promise<BackendUser> => {
  const { data } = await api.get<{ user: BackendUser }>('/auth/me');
  return data.user;
};
