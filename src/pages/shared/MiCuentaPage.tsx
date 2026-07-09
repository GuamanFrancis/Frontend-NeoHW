import { useState, useRef, useEffect } from 'react';
import { Save, User, Mail, Phone, Lock, Check, X, AlertTriangle, Trash2 } from 'lucide-react';
import { FormInput } from '../../components/ui/FormInput';
import { Button } from '../../components/ui/Button';
import { normalizeBackendUser } from '../../services/authService';
import { getStoredSession, updateStoredSession, clearStoredSession } from '../../services/session';
import { updateUser, deactivateUser } from '../../services/usersService';
import { getMyOrders } from '../../services/ordersService';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

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
      setDeleteAccountError('');

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
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => {
        setFormMessage('');
        toastTimerRef.current = null;
      }, 3000);
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
      setDeleteAccountError('');
      const res = await getMyOrders();
      const pendingStatuses = ['PENDING_PAYMENT', 'PROCESSING', 'SHIPPED'];
      const hasPending = res?.data?.some((order) => pendingStatuses.includes(order.status));
      if (hasPending) {
        setDeleteAccountError('No puedes eliminar tu cuenta en este momento porque tienes compras en curso. Debes esperar a recibir todos tus productos y liquidar cualquier pago pendiente antes de proceder.');
        return;
      }
      setShowDeleteModal(true);
    } catch (err) {
      console.error(err);
      setDeleteAccountError('Error al verificar el estado de tus pedidos. Intenta nuevamente.');
    } finally {
      setIsCheckingOrders(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl pt-4 pb-16 text-slate-800 dark:text-neutral-100 px-4">
      <AnimatePresence>
        {formMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, x: 20, scale: 0.95, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed top-6 right-6 z-[100] flex items-start gap-4 rounded-xl border border-emerald-250 bg-emerald-50/95 p-5 pr-12 shadow-lg backdrop-blur-sm dark:border-emerald-800/40 dark:bg-emerald-950/90 max-w-md w-full"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
              <Check className="h-5.5 w-5.5 stroke-[2.5]" />
            </div>

            <div className="flex-1 text-left min-w-0">
              <h4 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">
                ¡PERFIL ACTUALIZADO!
              </h4>
              <p className="mt-0.5 text-sm font-semibold leading-relaxed text-slate-900 dark:text-slate-200">
                {formMessage}
              </p>
            </div>

            <button
              onClick={() => setFormMessage('')}
              className="absolute top-4.5 right-3.5 p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 stroke-[2]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mb-8 rounded-2xl border border-slate-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/20 p-8 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute right-0 top-0 border-t-2 border-r-2 border-teal-500/30 w-16 h-16 rounded-tr-2xl pointer-events-none" />
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 dark:border-neutral-800 bg-transparent text-slate-850 dark:text-white shrink-0">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Mi cuenta</h1>
            <p className="text-lg text-slate-600 dark:text-neutral-400 mt-1 font-medium">Revisa y actualiza tu informacion personal.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_3fr]">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/20 p-10 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-sm min-h-[480px]">
            <div className="absolute top-0 inset-x-0 h-[120px] bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />
            
            <div className="flex flex-col items-center mt-6">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-4xl font-bold text-slate-800 shadow-sm ring-4 ring-teal-500/25 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500/10 to-transparent pointer-events-none animate-pulse" />
                {getInitials(firstName, lastName)}
              </div>
              
              <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Usuario'}
              </h2>
              
              <div className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-neutral-800 bg-transparent px-5 py-2 text-sm font-bold text-slate-700 dark:text-neutral-300">
                <User className="h-4 w-4" />
                {getRoleLabel(session?.user.role ?? 'cliente')}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <div className="rounded-2xl border border-slate-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/20 p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4 dark:border-neutral-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 dark:border-neutral-800 bg-transparent text-slate-850 dark:text-white shrink-0">
                    <User className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Informacion personal</h3>
                    <p className="text-base font-medium text-slate-600 dark:text-neutral-400 mt-0.5">Tus datos personales visibles en tu perfil.</p>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
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
                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4 dark:border-neutral-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 dark:border-neutral-800 bg-transparent text-slate-850 dark:text-white shrink-0">
                    <Mail className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Datos de contacto</h3>
                    <p className="text-base font-medium text-slate-600 dark:text-neutral-400 mt-0.5">Esta información se utiliza para gestionar el envío y la entrega de tus productos.</p>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormInput
                    label="Telefono"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0999999999"
                    icon={<Phone className="h-4 w-4 text-slate-850 mr-1 shrink-0 dark:text-white" />}
                  />
                  <FormInput
                    label="Correo electronico"
                    value={session?.user.email ?? ''}
                    disabled
                    placeholder="usuario@correo.com"
                    icon={<Mail className="h-4 w-4 text-slate-850 mr-1 shrink-0 dark:text-white" />}
                    className="cursor-not-allowed opacity-60"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col gap-6 dark:border-neutral-900">
              {formError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-base font-bold text-red-500 text-left">
                  {formError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-2.5 text-slate-900 text-base font-bold dark:text-slate-200">
                  <Lock className="h-5 w-5 text-slate-900 shrink-0 dark:text-white" />
                  <span>Tu informacion esta segura con nosotros.</span>
                </div>
                
                <Button 
                  type="button" 
                  variant="outlineHoverSolid"
                  onClick={() => void saveProfile()} 
                  disabled={isSaving}
                  className="h-12 px-9 text-base font-bold"
                >
                  <Save className="h-5 w-5 shrink-0" />
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          </div>

          {session?.user.role === 'cliente' && (
            <div className="rounded-2xl border border-slate-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/20 p-8 shadow-sm relative overflow-hidden text-left">
              <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full pointer-events-none" />
              
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4 dark:border-neutral-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 dark:border-neutral-800 bg-transparent text-red-500 dark:text-red-400 shrink-0">
                  <AlertTriangle className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Eliminar cuenta</h3>
                  <p className="text-base font-medium text-slate-600 dark:text-neutral-400 mt-0.5">Acción irreversible para dar de baja tu usuario.</p>
                </div>
              </div>

              <p className="mt-5 text-base font-medium text-slate-700 dark:text-neutral-300 leading-relaxed">
                Al eliminar tu cuenta, se borrará toda tu información de nuestra base de datos de forma permanente. No podrás recuperar tus compras, datos personales ni configuraciones. Asegúrate de no tener transacciones activas.
              </p>

              {deleteAccountError && (
                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold leading-relaxed shadow-sm text-slate-900 dark:text-white text-left">
                  {deleteAccountError}
                </div>
              )}

              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  onClick={() => void handleDeleteClick()}
                  disabled={isCheckingOrders}
                  className="border border-red-655 text-red-655 bg-transparent hover:bg-red-655 hover:text-white dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white font-semibold h-12 px-8 rounded-lg transition text-base flex items-center gap-2.5 shadow-sm"
                >
                  <Trash2 className="h-5 w-5 shrink-0" />
                  {isCheckingOrders ? 'Verificando pedidos...' : 'Eliminar mi cuenta'}
                </button>
              </div>
            </div>
          )}
        </div>   </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 p-6 shadow-md">
            <h3 className="text-base font-semibold text-red-500">¿Estás absolutamente seguro?</h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-neutral-300 font-medium leading-relaxed">
              Esta acción es irreversible y se eliminarán todos los datos asociados a tu perfil.
            </p>
            <p className="mt-4 text-sm font-medium text-slate-600 dark:text-neutral-400">
              Para confirmar, por favor escribe <span className="text-red-500 font-semibold">ELIMINAR</span> a continuación:
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
                className="border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 font-semibold px-4 py-2 hover:bg-slate-50 dark:hover:bg-neutral-900/50 transition rounded-lg text-sm shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'ELIMINAR' || isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    setFormError('');
                    await deactivateUser('me');
                    clearStoredSession();
                    window.location.href = '/login';
                  } catch (err) {
                    console.error(err);
                    setFormError('No se pudo eliminar la cuenta. Por favor verifica tu conexión e intenta nuevamente.');
                    setShowDeleteModal(false);
                  } finally {
                    setIsDeleting(false);
                    setDeleteConfirmText('');
                  }
                }}
                className="border border-red-500/30 bg-transparent text-red-500 hover:bg-red-50/50 dark:border-red-500/20 dark:hover:bg-red-950/10 font-semibold px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm shadow-sm"
              >
                {isDeleting ? 'Eliminando...' : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
