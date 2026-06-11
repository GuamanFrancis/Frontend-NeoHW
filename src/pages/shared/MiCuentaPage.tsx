import { useState } from 'react';
import { Save, User, Mail, Phone, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { normalizeBackendUser } from '../../services/authService';
import { getStoredSession, updateStoredSession } from '../../services/session';
import { updateUser } from '../../services/usersService';
import { getMyOrders } from '../../services/ordersService';

export const MiCuentaPage = () => {
  const session = getStoredSession();

  const [firstName, setFirstName] = useState(session?.user.firstName ?? '');
  const [lastName, setLastName] = useState(session?.user.lastName ?? '');
  const [phone, setPhone] = useState(session?.user.phone ?? '');
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isCheckingOrders, setIsCheckingOrders] = useState(false);

  const getInitials = (first: string, last: string) => {
    const f = first.trim().charAt(0).toUpperCase();
    const l = last.trim().charAt(0).toUpperCase();
    return `${f}${l}` || 'U';
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'vendedor':
        return 'Vendedor';
      case 'cliente':
      default:
        return 'Cliente';
    }
  };

  const saveProfile = async () => {
    if (!session) {
      setFormError('Debes iniciar sesion para actualizar tu perfil.');
      return;
    }

    try {
      setIsSaving(true);
      setFormError('');
      setFormMessage('');

      const updatedUser = await updateUser('me', {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      updateStoredSession({
        accessToken: session.accessToken,
        user: normalizeBackendUser(updatedUser),
      });

      setFormMessage('Perfil actualizado correctamente.');
    } catch {
      setFormError('No se pudo actualizar el perfil. Verifica tu sesion e intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    try {
      setIsCheckingOrders(true);
      setFormError('');
      setFormMessage('');
      const res = await getMyOrders();
      const pendingStatuses = ['PENDING_PAYMENT', 'PROCESSING', 'SHIPPED'];
      const hasPending = res?.data?.some((order) => pendingStatuses.includes(order.status));
      if (hasPending) {
        setFormError('No puedes eliminar tu cuenta porque tienes pedidos pendientes (pagos, envíos o entregas en proceso).');
        return;
      }
      setShowDeleteModal(true);
    } catch (err) {
      console.error(err);
      setFormError('Error al verificar el estado de tus pedidos. Intenta nuevamente.');
    } finally {
      setIsCheckingOrders(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-16 text-slate-800 dark:text-neutral-100">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 relative overflow-hidden shadow-xl dark:border-neutral-900 dark:bg-neutral-950">
        <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute right-0 top-0 border-t-2 border-r-2 border-teal-500/30 w-16 h-16 rounded-tr-2xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mi cuenta</h1>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1 font-medium">Revisa y actualiza tu informacion personal.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2.2fr]">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-xl min-h-[460px] dark:border-neutral-900 dark:bg-neutral-950">
            <div className="absolute top-0 inset-x-0 h-[120px] bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />
            
            <div className="flex flex-col items-center mt-6">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-3xl font-bold text-slate-800 shadow-lg shadow-black/5 ring-4 ring-teal-500/25 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white dark:shadow-black/40">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500/10 to-transparent pointer-events-none animate-pulse" />
                {getInitials(firstName, lastName)}
              </div>
              
              <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Usuario'}
              </h2>
              
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-teal-500/25 bg-teal-500/10 px-4 py-1.5 text-xs font-bold text-teal-600 dark:text-teal-400">
                <User className="h-3.5 w-3.5" />
                {getRoleLabel(session?.user.role ?? 'cliente')}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 w-full flex items-center justify-center gap-3 text-left dark:border-neutral-900/65">
              <ShieldCheck className="h-5 w-5 text-teal-650 dark:text-teal-400 shrink-0" />
              <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium leading-relaxed">
                Manten tu informacion actualizada para una mejor experiencia en NeoHW.
              </p>
            </div>
          </div>

          {session?.user.role === 'cliente' && (
            <Button
              type="button"
              onClick={() => void handleDeleteClick()}
              disabled={isCheckingOrders}
              className="w-full bg-red-600 hover:bg-red-550 text-white font-extrabold border-0 h-11 shadow-lg shadow-red-650/15"
            >
              {isCheckingOrders ? 'Verificando pedidos...' : 'Eliminar cuenta'}
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xl dark:border-neutral-900 dark:bg-neutral-950">
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3 dark:border-neutral-900/60">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Informacion personal</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Tus datos personales visibles en tu perfil.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Nombre"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Sic"
                />
                <FormInput
                  label="Apellido"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Perez"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3 dark:border-neutral-900/60">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Datos de contacto</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Usamos esta informacion para comunicarte sobre tu cuenta.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Telefono"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0999999999"
                  icon={<Phone className="h-4 w-4 text-teal-650 mr-1 shrink-0 dark:text-teal-500/80" />}
                />
                <FormInput
                  label="Correo electronico"
                  value={session?.user.email ?? ''}
                  disabled
                  placeholder="usuario@correo.com"
                  icon={<Mail className="h-4 w-4 text-teal-650 mr-1 shrink-0 dark:text-teal-500/80" />}
                  className="cursor-not-allowed opacity-60"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4 dark:border-neutral-900/60">
            {(formMessage || formError) && (
              <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                formError
                  ? 'border-red-500/20 bg-red-500/10 text-red-400'
                  : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-450 dark:text-emerald-400'
              }`}
              >
                {formError || formMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold dark:text-neutral-400">
                <Lock className="h-4 w-4 text-teal-650 shrink-0 dark:text-teal-400" />
                <span>Tu informacion esta segura con nosotros. No compartimos tus datos con terceros.</span>
              </div>
              
              <Button 
                type="button" 
                onClick={() => void saveProfile()} 
                disabled={isSaving}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold border-0 shrink-0 h-11 px-7 shadow-lg shadow-teal-500/20 dark:text-neutral-950"
              >
                <Save className="h-4.5 w-4.5 shrink-0" />
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-neutral-900 dark:bg-neutral-950">
            <h3 className="text-lg font-bold text-red-650 dark:text-red-400">¿Estás absolutamente seguro?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-neutral-400 font-medium leading-relaxed">
              Esta acción es irreversible y se eliminarán todos los datos asociados a tu perfil.
            </p>
            <p className="mt-4 text-xs font-bold text-slate-700 dark:text-neutral-300">
              Para confirmar, por favor escribe <span className="text-red-500 font-black">ELIMINAR</span> a continuación:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
              placeholder="ELIMINAR"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="rounded-lg px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'ELIMINAR'}
                onClick={() => {
                  alert('Cuenta eliminada exitosamente (Simulado)');
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-550 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
