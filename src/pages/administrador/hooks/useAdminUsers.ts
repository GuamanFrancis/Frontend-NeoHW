import { useEffect, useMemo, useState } from 'react';
import type { BackendRole, BackendUser } from '../../../types/auth';
import { changeUserRole, deactivateUser, getUsers, getUserById, updateUser } from '../../../services/usersService';

export type UserRole = 'Super administrador' | 'Administrador' | 'Vendedor' | 'Cliente';
export type UserStatus = 'Activo' | 'Inactivo';

export type AdminUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  backendRole: BackendRole;
  status: UserStatus;
  lastAccess: string;
};

export type UserFormValues = {
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

export const roleOptions = [
  { label: 'Super administrador', value: 'Super administrador' },
  { label: 'Administrador', value: 'Administrador' },
  { label: 'Vendedor', value: 'Vendedor' },
  { label: 'Cliente', value: 'Cliente' },
];

export const statusOptions = [
  { label: 'Activo', value: 'Activo' },
  { label: 'Inactivo', value: 'Inactivo' },
];

const emptyForm: UserFormValues = {
  name: '',
  phone: '',
  email: '',
  role: 'Cliente',
  status: 'Activo',
};

const roleLabels: Record<BackendRole, UserRole> = {
  SUPER_ADMIN: 'Super administrador',
  ADMIN: 'Administrador',
  SELLER: 'Vendedor',
  USER: 'Cliente',
};

const backendRolesByLabel: Record<UserRole, BackendRole> = {
  'Super administrador': 'SUPER_ADMIN',
  Administrador: 'ADMIN',
  Vendedor: 'SELLER',
  Cliente: 'USER',
};

const getFullName = (user: BackendUser) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.email;
};

const formatRegisterDate = (dateStr?: string) => {
  if (!dateStr) return 'Registrado';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Registrado';
  }
};

const mapBackendUser = (user: BackendUser): AdminUser => ({
  id: user.id,
  name: getFullName(user),
  phone: user.phone ?? 'Sin telefono',
  email: user.email,
  role: roleLabels[user.role],
  backendRole: user.role,
  status: user.isActive ? 'Activo' : 'Inactivo',
  lastAccess: formatRegisterDate(user.createdAt),
});

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalMode, setModalMode] = useState<'edit' | 'view' | null>(null);
  const [formValues, setFormValues] = useState<UserFormValues>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [modalError, setModalError] = useState('');
  const [userToDeactivate, setUserToDeactivate] = useState<AdminUser | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTitle, setToastTitle] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
        setToastTitle(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        const response = await getUsers(1, 100);
        if (!isMounted) return;
        setUsers(response.users.map(mapBackendUser));
      } catch {
        if (!isMounted) return;
        setPageError('No se pudo cargar usuarios. Verifica tu sesion y permisos de administrador.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.role.toLowerCase().includes(normalizedSearch);

      const matchesRole = roleFilter === 'todos' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'todos' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pageUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstResult = filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResult = Math.min(currentPage * pageSize, filteredUsers.length);
  const canSaveUser = formValues.name.trim() !== '' && formValues.email.trim() !== '' && !isSaving;

  const changeSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const changeRoleFilter = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const changeStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const cleanFilters = () => {
    setSearch('');
    setRoleFilter('todos');
    setStatusFilter('todos');
    setCurrentPage(1);
  };

  const openEditModal = (user: AdminUser) => {
    setModalError('');
    setSelectedUser(user);
    setFormValues({
      name: user.name,
      phone: user.phone === 'Sin telefono' ? '' : user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setIsUnlocked(false);
    setModalMode('edit');
  };

  const openViewModal = async (user: AdminUser) => {
    setSelectedUser(user);
    setModalMode('view');
    try {
      const freshUser = await getUserById(user.id);
      setSelectedUser(mapBackendUser(freshUser));
    } catch (e) {
      console.error(e);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalMode(null);
    setModalError('');
    setIsUnlocked(false);
  };

  const saveUser = async () => {
    if (!selectedUser) return;

    try {
      setIsSaving(true);
      setModalError('');

      const requestedRole = backendRolesByLabel[formValues.role];
      let updatedUser = null;

      if (requestedRole !== selectedUser.backendRole) {
        updatedUser = await changeUserRole(selectedUser.id, requestedRole);
      }

      const originalName = selectedUser.name;
      const originalPhone = selectedUser.phone === 'Sin telefono' ? '' : selectedUser.phone;

      if (formValues.name !== originalName || formValues.phone !== originalPhone) {
        const parts = formValues.name.trim().split(/\s+/);
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        const phone = formValues.phone.trim() || undefined;

        const updatedPersonal = await updateUser(selectedUser.id, {
          firstName,
          lastName,
          phone,
        });
        updatedUser = updatedPersonal;
      }

      if (updatedUser) {
        setUsers((currentUsers) =>
          currentUsers.map((user) => (user.id === selectedUser.id ? mapBackendUser(updatedUser) : user)),
        );
      } else if (formValues.name !== originalName || formValues.phone !== originalPhone || requestedRole !== selectedUser.backendRole) {
        const freshUser = await getUserById(selectedUser.id);
        setUsers((currentUsers) =>
          currentUsers.map((user) => (user.id === selectedUser.id ? mapBackendUser(freshUser) : user)),
        );
      }
      
      const changes: string[] = [];
      if (formValues.name !== originalName) changes.push('nombre');
      if (formValues.phone !== originalPhone) changes.push('teléfono');
      if (requestedRole !== selectedUser.backendRole) changes.push('rol');

      const summary = changes.length > 0 ? `Se modificó: ${changes.join(', ')}.` : 'No se detectaron cambios.';
      setToastTitle('¡USUARIO ACTUALIZADO!');
      setToastMessage(`Los datos del usuario ${selectedUser.email} han sido actualizados con éxito. ${summary}`);
      closeModal();
    } catch {
      setModalError('No se pudo guardar el usuario. Revisa permisos y datos ingresados.');
    } finally {
      setIsSaving(false);
    }
  };

  const requestDeactivateUser = (user: AdminUser) => {
    if (user.status === 'Inactivo') return;
    setUserToDeactivate(user);
  };

  const confirmDeactivateUser = async () => {
    if (!userToDeactivate) return;

    try {
      setPageError('');
      const updatedUser = await deactivateUser(userToDeactivate.id);
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === userToDeactivate.id ? mapBackendUser(updatedUser) : currentUser
        )
      );
      setToastTitle('¡USUARIO DESACTIVADO!');
      setToastMessage(`La cuenta del usuario ${userToDeactivate.email} ha sido suspendida de forma inmediata.`);
    } catch {
      setPageError('No se pudo desactivar el usuario seleccionado.');
    } finally {
      setUserToDeactivate(null);
    }
  };

  const cancelDeactivateUser = () => {
    setUserToDeactivate(null);
  };

  return {
    users,
    search,
    roleFilter,
    statusFilter,
    pageSize,
    currentPage,
    selectedUser,
    modalMode,
    formValues,
    isLoading,
    isSaving,
    pageError,
    modalError,
    filteredUsers,
    totalPages,
    pageUsers,
    firstResult,
    lastResult,
    canSaveUser,
    changeSearch,
    changeRoleFilter,
    changeStatusFilter,
    cleanFilters,
    openEditModal,
    openViewModal,
    closeModal,
    saveUser,
    cancelDeactivateUser,
    confirmDeactivateUser,
    requestDeactivateUser,
    userToDeactivate,
    isUnlocked,
    setIsUnlocked,
    setCurrentPage,
    setPageSize,
    setFormValues,
    toastMessage,
    setToastMessage,
    toastTitle,
    setToastTitle,
  };
};
