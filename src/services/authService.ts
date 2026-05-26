import { api } from './api';
import { normalizeAuthResponse, normalizeBackendUser } from './authMapper';
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

  const session = normalizeAuthResponse(data);

  if (values.nickname.trim() || values.phone?.trim()) {
    const { data: profileData } = await api.patch<{ user: BackendUser }>('/users/me', {
      firstName: values.nickname.trim() || undefined,
      phone: values.phone?.trim() || undefined,
    });

    return {
      accessToken: session.accessToken,
      user: normalizeBackendUser(profileData.user),
    };
  }

  return session;
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
