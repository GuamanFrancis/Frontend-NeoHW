import {
  Eye,
  Filter,
  Pencil,
  Power,
  Search,
  UsersRound,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { Modal } from '../../components/ui/Modal';
import { PageCard } from '../../components/ui/PageCard';
import { useAdminUsers, roleOptions, statusOptions } from './hooks/useAdminUsers';
import type { UserRole, UserStatus } from './hooks/useAdminUsers';

const roleStyles: Record<UserRole, string> = {
  'Super administrador': 'bg-cyan-50 text-cyan-700 ring-cyan-500/20 dark:bg-cyan-400/10 dark:text-cyan-200 dark:ring-cyan-300/25',
  Administrador: 'bg-teal-50 text-teal-700 ring-teal-500/20 dark:bg-teal-400/10 dark:text-teal-200 dark:ring-teal-300/25',
  Vendedor: 'bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/25',
  Cliente: 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
};

const statusStyles: Record<UserStatus, string> = {
  Activo: 'bg-emerald-500',
  Inactivo: 'bg-rose-500',
};

const fieldClass =
  'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:border-teal-400 dark:disabled:bg-neutral-900';

const actionButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-teal-500/60 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 dark:hover:text-teal-200';

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();

export const AdminUsuariosPage = () => {
  const {
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
    setCurrentPage,
    setPageSize,
    setFormValues,
  } = useAdminUsers();

  return (
    <PageCard
      title="Gestion de usuarios"
      text="Administra los usuarios del sistema, roles y permisos de acceso."
      icon={<UsersRound className="h-6 w-6" />}
    >
      <div className="space-y-4">
        {pageError && (
          <div className="rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {pageError}
          </div>
        )}

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
                          onClick={() => void openViewModal(user)}
                          aria-label="Ver usuario"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={() => openEditModal(user)}
                          disabled={user.status === 'Inactivo'}
                          title={user.status === 'Inactivo' ? 'No se puede editar un usuario inactivo' : 'Editar usuario'}
                          aria-label="Editar usuario"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={() => requestDeactivateUser(user)}
                          disabled={user.status === 'Inactivo'}
                          title={user.status === 'Inactivo' ? 'El usuario ya se encuentra inactivo' : 'Desactivar usuario'}
                          aria-label="Desactivar usuario"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
                      Cargando usuarios...
                    </td>
                  </tr>
                )}

                {!isLoading && pageUsers.length === 0 && (
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
        open={modalMode === 'edit'}
        title="Editar usuario"
        text="Completa los datos principales para mantener el acceso del usuario."
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveUser()} disabled={!canSaveUser}>
              {isSaving ? 'Guardando...' : 'Guardar'}
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
            disabled
          />
          <FormInput
            label="Telefono"
            value={formValues.phone}
            onChange={(event) => setFormValues({ ...formValues, phone: event.target.value })}
            placeholder="Ej: +593 99 999 9999"
            disabled
          />
          <div className="sm:col-span-2">
            <FormInput
              label="Correo electronico"
              type="email"
              value={formValues.email}
              disabled
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
            disabled
          />

          {modalError && (
            <div className="sm:col-span-2 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
              {modalError}
            </div>
          )}
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

      <Modal
        open={Boolean(userToDeactivate)}
        title="Confirmar desactivación"
        text="¿Estás seguro de que deseas desactivar a este usuario? Esta acción suspenderá su acceso al sistema de forma inmediata."
        onClose={cancelDeactivateUser}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={cancelDeactivateUser}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-red-500 hover:bg-red-400 text-white font-extrabold border-0 px-5"
              onClick={() => void confirmDeactivateUser()}
            >
              Desactivar cuenta
            </Button>
          </>
        }
      >
        {userToDeactivate && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-650 dark:text-red-200">
            <p className="font-bold mb-2">Información de la cuenta a suspender:</p>
            <div className="space-y-1">
              <p className="font-mono text-xs">
                <span className="font-sans font-bold">Usuario:</span> {userToDeactivate.name}
              </p>
              <p className="font-mono text-xs">
                <span className="font-sans font-bold">Correo:</span> {userToDeactivate.email}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </PageCard>
  );
};
