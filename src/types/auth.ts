export type UserRole = 'cliente' | 'vendedor' | 'admin';
export type BackendRole = 'USER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';

export type LoginFormValues = {
  email: string;
  password: string;
  remember: boolean;
};

export type RegisterFormValues = {
  nickname: string;
  gender: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
};

export type AuthUser = {
  id: string;
  nickname: string;
  email: string;
  role: UserRole;
  backendRole: BackendRole;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isActive: boolean;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type BackendUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: BackendRole;
  isActive: boolean;
};

export type BackendAuthResponse = {
  accessToken: string;
  user: BackendUser;
};
