import { useMemo, useState } from 'react';
import {
  Eye,
  Filter,
  Pencil,
  Plus,
  Power,
  Search,
  UsersRound,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { Modal } from '../../components/ui/Modal';
import { PageCard } from '../../components/ui/PageCard';

type UserRole = 'Administrador' | 'Vendedor' | 'Cliente';
type UserStatus = 'Activo' | 'Inactivo';

type AdminUser = {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastAccess: string;
};

type UserFormValues = {
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

const initialUsers: AdminUser[] = [
  {
    id: 1,
    name: 'Daniel Ramirez',
    phone: '+593 98 123 4567',
    email: 'daniel.ramirez@neohw.ec',
    role: 'Administrador',
    status: 'Activo',
    lastAccess: 'Hoy, 10:30',
  },
  {
    id: 2,
    name: 'Maria Gonzalez',
    phone: '+593 99 876 5432',
    email: 'maria.gonzalez@neohw.ec',
    role: 'Vendedor',
    status: 'Activo',
    lastAccess: 'Ayer, 16:45',
  },
  {
    id: 3,
    name: 'Carlos Fernandez',
    phone: '+593 96 234 5678',
    email: 'carlos.fernandez@neohw.ec',
    role: 'Vendedor',
    status: 'Activo',
    lastAccess: 'Hoy, 09:15',
  },
  {
    id: 4,
    name: 'Laura Paredes',
    phone: '+593 97 345 6789',
    email: 'laura.paredes@neohw.ec',
    role: 'Cliente',
    status: 'Inactivo',
    lastAccess: 'Hace 3 dias',
  },
  {
    id: 5,
    name: 'Jose Morales',
    phone: '+593 95 456 7890',
    email: 'jose.morales@neohw.ec',
    role: 'Cliente',
    status: 'Activo',
    lastAccess: 'Hace 1 dia',
  },
  {
    id: 6,
    name: 'Andrea Vera',
    phone: '+593 93 245 1188',
    email: 'andrea.vera@neohw.ec',
    role: 'Cliente',
    status: 'Activo',
    lastAccess: 'Hace 2 dias',
  },
];

const roleOptions = [
  { label: 'Administrador', value: 'Administrador' },
  { label: 'Vendedor', value: 'Vendedor' },
  { label: 'Cliente', value: 'Cliente' },
];

const statusOptions = [
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

const roleStyles: Record<UserRole, string> = {
  Administrador: 'bg-teal-50 text-teal-700 ring-teal-500/20 dark:bg-teal-400/10 dark:text-teal-200 dark:ring-teal-300/25',
  Vendedor: 'bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/25',
  Cliente: 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
};

const statusStyles: Record<UserStatus, string> = {
  Activo: 'bg-emerald-500',
  Inactivo: 'bg-rose-500',
};

const fieldClass =
  'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:border-teal-400';

const actionButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-teal-500/60 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 dark:hover:text-teal-200';

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();

export const AdminUsuariosPage = () => {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [formValues, setFormValues] = useState<UserFormValues>(emptyForm);

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
  const canSaveUser = formValues.name.trim() !== '' && formValues.email.trim() !== '';

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

  const openCreateModal = () => {
    setSelectedUser(null);
    setFormValues(emptyForm);
    setModalMode('create');
  };

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setFormValues({
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setModalMode('edit');
  };

  const openViewModal = (user: AdminUser) => {
    setSelectedUser(user);
    setModalMode('view');
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalMode(null);
  };

  const saveUser = () => {
    if (!formValues.name.trim() || !formValues.email.trim()) return;

    if (modalMode === 'edit' && selectedUser) {
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === selectedUser.id ? { ...user, ...formValues } : user,
        ),
      );
    }

    if (modalMode === 'create') {
      setUsers((currentUsers) => [
        {
          id: Date.now(),
          ...formValues,
          lastAccess: 'Sin acceso',
        },
        ...currentUsers,
      ]);
      setCurrentPage(1);
    }

    closeModal();
  };

  const toggleUserStatus = (userId: number) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId
          ? { ...user, status: user.status === 'Activo' ? 'Inactivo' : 'Activo' }
          : user,
      ),
    );
  };

  return (
    <PageCard
      title="Gestion de usuarios"
      text="Administra los usuarios del sistema, roles y permisos de acceso."
      icon={<UsersRound className="h-6 w-6" />}
      actions={
        <Button type="button" className="h-10 px-4 text-sm" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_170px_170px_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Buscar usuario por nombre, correo o rol..."
              className={`${fieldClass} w-full pl-10`}
            />
          </label>

          <select
            className={fieldClass}
            value={roleFilter}
            onChange={(event) => changeRoleFilter(event.target.value)}
          >
            <option value="todos">Todos los roles</option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className={fieldClass}
            value={statusFilter}
            onChange={(event) => changeStatusFilter(event.target.value)}
          >
            <option value="todos">Estado: Todos</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button type="button" variant="outline" className="h-10 px-4 text-sm" onClick={cleanFilters}>
            <Filter className="h-4 w-4" />
            Limpiar
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.03] dark:text-neutral-400">
                <tr>
                  <th className="px-5 py-4 font-bold">Usuario</th>
                  <th className="px-5 py-4 font-bold">Correo electronico</th>
                  <th className="px-5 py-4 font-bold">Rol</th>
                  <th className="px-5 py-4 font-bold">Estado</th>
                  <th className="px-5 py-4 font-bold">Ultimo acceso</th>
                  <th className="px-5 py-4 text-right font-bold">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm dark:divide-neutral-800">
                {pageUsers.map((user) => (
                  <tr key={user.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-950 dark:text-white">{user.name}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">{user.phone}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-neutral-300">{user.email}</td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${roleStyles[user.role]}`}>
                        {user.role}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-300">
                        <span className={`h-2 w-2 rounded-full ${statusStyles[user.status]}`} />
                        {user.status}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-neutral-300">{user.lastAccess}</td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={() => openViewModal(user)}
                          aria-label="Ver usuario"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={() => openEditModal(user)}
                          aria-label="Editar usuario"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={() => toggleUserStatus(user.id)}
                          aria-label="Cambiar estado del usuario"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {pageUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
                      No se encontraron usuarios con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 dark:border-neutral-800 dark:text-neutral-400 md:flex-row md:items-center md:justify-between">
            <p>
              Mostrando {firstResult} a {lastResult} de {filteredUsers.length} usuarios
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={actionButtonClass}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                aria-label="Pagina anterior"
              >
                {'<'}
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={
                    page === currentPage
                      ? 'h-9 min-w-9 rounded-lg bg-teal-500 px-3 text-sm font-bold text-white'
                      : actionButtonClass
                  }
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className={actionButtonClass}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                aria-label="Pagina siguiente"
              >
                {'>'}
              </button>

              <select
                className={`${fieldClass} h-9`}
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5 por pagina</option>
                <option value={10}>10 por pagina</option>
                <option value={20}>20 por pagina</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={modalMode === 'create' || modalMode === 'edit'}
        title={modalMode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
        text="Completa los datos principales para mantener el acceso del usuario."
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveUser} disabled={!canSaveUser}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Nombre"
            value={formValues.name}
            onChange={(event) => setFormValues({ ...formValues, name: event.target.value })}
            placeholder="Nombre completo"
          />
          <FormInput
            label="Telefono"
            value={formValues.phone}
            onChange={(event) => setFormValues({ ...formValues, phone: event.target.value })}
            placeholder="Ej: +593 99 999 9999"
          />
          <div className="sm:col-span-2">
            <FormInput
              label="Correo electronico"
              type="email"
              value={formValues.email}
              onChange={(event) => setFormValues({ ...formValues, email: event.target.value })}
              placeholder="usuario@correo.com"
            />
          </div>
          <FormSelect
            label="Rol"
            options={roleOptions}
            value={formValues.role}
            onChange={(event) => setFormValues({ ...formValues, role: event.target.value as UserRole })}
          />
          <FormSelect
            label="Estado"
            options={statusOptions}
            value={formValues.status}
            onChange={(event) => setFormValues({ ...formValues, status: event.target.value as UserStatus })}
          />
        </div>
      </Modal>

      <Modal
        open={modalMode === 'view' && Boolean(selectedUser)}
        title="Detalle del usuario"
        text="Informacion basica registrada en el sistema."
        onClose={closeModal}
        footer={
          <Button type="button" onClick={closeModal}>
            Entendido
          </Button>
        }
      >
        {selectedUser && (
          <div className="grid gap-3 text-sm">
            <div className="rounded-lg border border-slate-200 p-4 dark:border-neutral-800">
              <p className="text-slate-500 dark:text-neutral-400">Usuario</p>
              <p className="mt-1 font-bold text-slate-950 dark:text-white">{selectedUser.name}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-neutral-800">
              <p className="text-slate-500 dark:text-neutral-400">Correo electronico</p>
              <p className="mt-1 font-bold text-slate-950 dark:text-white">{selectedUser.email}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-4 dark:border-neutral-800">
                <p className="text-slate-500 dark:text-neutral-400">Rol</p>
                <p className="mt-1 font-bold text-slate-950 dark:text-white">{selectedUser.role}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 dark:border-neutral-800">
                <p className="text-slate-500 dark:text-neutral-400">Estado</p>
                <p className="mt-1 font-bold text-slate-950 dark:text-white">{selectedUser.status}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 dark:border-neutral-800">
                <p className="text-slate-500 dark:text-neutral-400">Ultimo acceso</p>
                <p className="mt-1 font-bold text-slate-950 dark:text-white">{selectedUser.lastAccess}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageCard>
  );
};
