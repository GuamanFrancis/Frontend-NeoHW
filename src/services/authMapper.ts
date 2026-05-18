import type { AuthResponse, BackendAuthResponse, BackendRole, BackendUser, UserRole } from '../types/auth';

export const roleHomeRoutes: Record<UserRole, string> = {
  cliente: '/cliente/cuenta',
  vendedor: '/vendedor/pedidos',
  admin: '/admin/usuarios',
};

export const backendRoleToUserRole = (role: BackendRole): UserRole => {
  if (role === 'SELLER') return 'vendedor';
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return 'admin';
  return 'cliente';
};

export const userRoleToBackendRole = (role: UserRole): BackendRole => {
  if (role === 'vendedor') return 'SELLER';
  if (role === 'admin') return 'ADMIN';
  return 'USER';
};

export const getUserDisplayName = (user: BackendUser) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.email;
};

export const normalizeBackendUser = (user: BackendUser) => ({
  id: user.id,
  nickname: getUserDisplayName(user),
  email: user.email,
  role: backendRoleToUserRole(user.role),
  backendRole: user.role,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  isActive: user.isActive,
});

export const normalizeAuthResponse = (response: BackendAuthResponse): AuthResponse => ({
  accessToken: response.accessToken,
  user: normalizeBackendUser(response.user),
});
