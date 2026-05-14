import type { AuthResponse, LoginFormValues, RegisterFormValues, UserRole } from '../types/auth';

const SESSION_KEY = 'neohw_session';

export const roleHomeRoutes: Record<UserRole, string> = {
  cliente: '/cliente/inicio',
  vendedor: '/vendedor/inicio',
  admin: '/admin/inicio',
};

export const loginUser = async (values: LoginFormValues): Promise<AuthResponse> => {
  return {
    token: 'token-temporal-neohw',
    user: {
      id: '1',
      nickname: 'Francis Guaman',
      email: values.email,
      role: values.role,
    },
  };
};

export const registerUser = async (values: RegisterFormValues): Promise<AuthResponse> => {
  return {
    token: 'token-temporal-neohw',
    user: {
      id: '1',
      nickname: values.nickname,
      email: values.email,
      role: 'cliente',
    },
  };
};

export const saveSession = (session: AuthResponse, remember = true) => {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const logoutUser = () => {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
};
