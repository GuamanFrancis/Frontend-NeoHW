import { useEffect, useState } from 'react';
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
  'flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-teal-500/60 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 dark:hover:text-teal-200 cursor-pointer';

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
    isUnlocked,
    setIsUnlocked,
    setCurrentPage,
    setPageSize,
    setFormValues,
  } = useAdminUsers();

  const [showUnlockWarning, setShowUnlockWarning] = useState(false);

  useEffect(() => {
    if (modalMode !== 'edit') {
      setShowUnlockWarning(false);
    }
  }, [modalMode]);

  return (
    <PageCard
      title="Gestion de usuarios"
      text="Administra los usuarios del sistema y sus roles correspondientes."
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
              <thead className="bg-slate-50 text-sm uppercase tracking-wider text-slate-900 dark:bg-white/[0.02] dark:text-white border-b border-slate-200 dark:border-neutral-800">
                <tr>
                  <th className="px-5 py-4 font-bold">Usuario</th>
                  <th className="px-5 py-4 font-bold">Correo electrónico</th>
                  <th className="px-5 py-4 font-bold">Rol</th>
                  <th className="px-5 py-4 font-bold">Estado</th>
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
                          <p className="mt-1 text-xs text-slate-955 dark:text-white">{user.phone}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-955 dark:text-white">{user.email}</td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${roleStyles[user.role]}`}>
                        {user.role}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-955 dark:text-white">
                        <span className={`h-2 w-2 rounded-full ${statusStyles[user.status]}`} />
                        {user.status}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={() => void openViewModal(user)}
                          aria-label="Ver usuario"
                        >
                          <Eye className="h-5.5 w-5.5 text-slate-750 dark:text-slate-200" />
                        </button>
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={() => openEditModal(user)}
                          disabled={user.status === 'Inactivo'}
                          title={user.status === 'Inactivo' ? 'No se puede editar un usuario inactivo' : 'Editar usuario'}
                          aria-label="Editar usuario"
                        >
                          <Pencil className="h-5.5 w-5.5 text-slate-750 dark:text-slate-200" />
                        </button>
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={() => requestDeactivateUser(user)}
                          disabled={user.status === 'Inactivo'}
                          title={user.status === 'Inactivo' ? 'El usuario ya se encuentra inactivo' : 'Desactivar usuario'}
                          aria-label="Desactivar usuario"
                        >
                          <Power className="h-5.5 w-5.5 text-rose-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-955 dark:text-white">
                      Cargando usuarios...
                    </td>
                  </tr>
                )}

                {!isLoading && pageUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-955 dark:text-white">
                      No se encontraron usuarios con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-955 dark:border-neutral-800 dark:text-white md:flex-row md:items-center md:justify-between">
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
        <p className="text-sm font-normal text-slate-955 dark:text-white mb-4">
          Completa los datos principales para mantener el acceso del usuario.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Nombre"
            value={formValues.name}
            onChange={(event) => setFormValues({ ...formValues, name: event.target.value })}
            placeholder="Nombre completo"
            disabled={!isUnlocked}
          />
          <FormInput
            label="Telefono"
            value={formValues.phone}
            onChange={(event) => setFormValues({ ...formValues, phone: event.target.value })}
            placeholder="Ej: +593 99 999 9999"
            disabled={!isUnlocked}
          />

          {!isUnlocked && !showUnlockWarning && (
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowUnlockWarning(true)}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
              >
                Habilitar edición de datos personales
              </button>
            </div>
          )}

          {showUnlockWarning && !isUnlocked && (
            <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/30 text-xs">
              <p className="font-bold text-rose-600 dark:text-rose-400 text-sm">Advertencia de seguridad</p>
              <p className="mt-1.5 text-sm font-normal text-slate-955 dark:text-white">
                Vas a modificar la información personal del usuario (Nombre y/o Teléfono). Asegúrate de que los datos sean correctos.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUnlockWarning(false)}
                  className="rounded-lg px-4 py-2 font-bold text-sm text-slate-955 hover:bg-slate-200/50 dark:text-white dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUnlocked(true);
                    setShowUnlockWarning(false);
                  }}
                  className="rounded-lg bg-teal-500 px-4 py-2 font-bold text-sm text-white hover:bg-teal-600 transition"
                >
                  Entendido, continuar
                </button>
              </div>
            </div>
          )}

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
        title="Detalles del Usuario"
        onClose={closeModal}
      >
        {selectedUser && (
          <div className="space-y-6 text-slate-900 dark:text-white max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
            <div className="flex flex-col gap-4 sm:flex-row items-center sm:items-start gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xl font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-200 border border-teal-500/15">
                {getInitials(selectedUser.name)}
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white text-base">Nombre de Usuario</span>
                    <span className="block font-normal text-slate-955 dark:text-white text-base mt-0.5">{selectedUser.name}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white text-base">Correo Electrónico</span>
                    <span className="block font-normal text-slate-955 dark:text-white text-base mt-0.5">{selectedUser.email}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white text-base">Teléfono</span>
                    <span className="block font-normal text-slate-955 dark:text-white text-base mt-0.5">{selectedUser.phone || 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white text-base">Rol</span>
                    <span className="block mt-1">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${roleStyles[selectedUser.role]}`}>
                        {selectedUser.role}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-150 dark:border-neutral-800" />

            <div className="flex items-center justify-between">
              <div>
                <span className="block font-bold uppercase tracking-wider text-slate-955 dark:text-white text-sm">Estado de la Cuenta</span>
                <div className="flex items-center gap-2 mt-1.5 text-base font-semibold text-slate-900 dark:text-white">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusStyles[selectedUser.status]}`} />
                  {selectedUser.status}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" onClick={closeModal} className="h-11 px-6 font-bold text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all active:scale-95 shadow-sm shadow-teal-500/20 border-0">
                Entendido
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(userToDeactivate)}
        title="¿Desactivar Usuario?"
        onClose={cancelDeactivateUser}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 shrink-0">
              <Power className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                ¿Estás seguro de que deseas desactivar a este usuario?
              </p>
              <p className="text-sm font-normal text-slate-955 dark:text-white mt-1.5 leading-relaxed">
                Esta acción suspenderá su acceso al sistema de forma inmediata. El usuario ya no podrá iniciar sesión.
              </p>
            </div>
          </div>
          {userToDeactivate && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">
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
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
            <Button type="button" variant="outline" onClick={cancelDeactivateUser}>
              Cancelar
            </Button>
            <button
              type="button"
              onClick={() => void confirmDeactivateUser()}
              className="rounded-lg bg-red-500 hover:bg-red-650 text-white font-bold px-4 py-2.5 transition text-sm shadow-sm"
            >
              Desactivar cuenta
            </button>
          </div>
        </div>
      </Modal>
    </PageCard>
  );
};
