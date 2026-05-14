export type UserRole = 'cliente' | 'vendedor' | 'admin';

export type LoginFormValues = {
  email: string;
  password: string;
  role: UserRole;
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
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};
