import { useState } from 'react';
import { Save, User, Mail, Phone, ShieldCheck, Lock, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { normalizeBackendUser } from '../../services/authService';
import { getStoredSession, updateStoredSession } from '../../services/session';
import { updateUser } from '../../services/usersService';

export const MiCuentaPage = () => {
  const session = getStoredSession();
  const userId = session?.user.id;
  const addressKey = userId ? `shipping_address_${userId}` : null;

  const savedAddress = (() => {
    if (!addressKey) return {};
    try {
      return JSON.parse(localStorage.getItem(addressKey) || '{}');
    } catch {
      return {};
    }
  })();

  const [firstName, setFirstName] = useState(session?.user.firstName ?? '');
  const [lastName, setLastName] = useState(session?.user.lastName ?? '');
  const [phone, setPhone] = useState(session?.user.phone ?? '');
  const [street, setStreet] = useState<string>(savedAddress.street ?? '');
  const [city, setCity] = useState<string>(savedAddress.city ?? '');
  const [stateName, setStateName] = useState<string>(savedAddress.state ?? '');
  const [postalCode, setPostalCode] = useState<string>(savedAddress.postalCode ?? '');
  const [country, setCountry] = useState<string>(savedAddress.country ?? 'Ecuador');
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

      if (addressKey) {
        localStorage.setItem(addressKey, JSON.stringify({
          street: street.trim(),
          city: city.trim(),
          state: stateName.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
        }));
      }

      setFormMessage('Perfil actualizado correctamente.');
    } catch {
      setFormError('No se pudo actualizar el perfil. Verifica tu sesion e intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-16 text-neutral-100">
      <div className="mb-6 rounded-2xl border border-neutral-900 bg-neutral-950 p-6 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute right-0 top-0 border-t-2 border-r-2 border-teal-500/30 w-16 h-16 rounded-tr-2xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Mi cuenta</h1>
            <p className="text-sm text-neutral-400 mt-1 font-medium">Revisa y actualiza tu informacion personal.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2.2fr]">
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-8 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-xl min-h-[460px]">
          <div className="absolute top-0 inset-x-0 h-[120px] bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />
          
          <div className="flex flex-col items-center mt-6">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-3xl font-bold text-white shadow-lg shadow-black/40 ring-4 ring-teal-500/25">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500/10 to-transparent pointer-events-none animate-pulse" />
              {getInitials(firstName, lastName)}
            </div>
            
            <h2 className="mt-6 text-xl font-bold text-white tracking-tight">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Usuario'}
            </h2>
            
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-teal-500/25 bg-teal-500/10 px-4 py-1.5 text-xs font-bold text-teal-400">
              <User className="h-3.5 w-3.5" />
              {getRoleLabel(session?.user.role ?? 'cliente')}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-900/65 w-full flex items-center justify-center gap-3 text-left">
            <ShieldCheck className="h-5 w-5 text-teal-400 shrink-0" />
            <p className="text-xs text-neutral-400 font-medium leading-relaxed">
              Manten tu informacion actualizada para una mejor experiencia en NeoHW.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-5 border-b border-neutral-900/60 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-400">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Informacion personal</h3>
                  <p className="text-xs text-neutral-400 font-medium">Tus datos personales visibles en tu perfil.</p>
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
              <div className="flex items-center gap-3 mb-5 border-b border-neutral-900/60 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Datos de contacto</h3>
                  <p className="text-xs text-neutral-400 font-medium">Usamos esta informacion para comunicarte sobre tu cuenta y pedidos.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Telefono"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0999999999"
                  icon={<Phone className="h-4 w-4 text-teal-500/80 mr-1 shrink-0" />}
                />
                <FormInput
                  label="Correo electronico"
                  value={session?.user.email ?? ''}
                  disabled
                  placeholder="usuario@correo.com"
                  icon={<Mail className="h-4 w-4 text-teal-500/80 mr-1 shrink-0" />}
                  className="cursor-not-allowed opacity-60"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5 border-b border-neutral-900/60 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-400">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Dirección de envío predeterminada</h3>
                  <p className="text-xs text-neutral-400 font-medium">Esta dirección se usará para autocompletar tus compras.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormInput
                    label="Calle y Número"
                    value={street}
                    onChange={(event) => setStreet(event.target.value)}
                    placeholder="Ej: Av. Amazonas N32-15 y La Niña"
                  />
                </div>
                <FormInput
                  label="Ciudad"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Ej: Quito / Guayaquil / Cuenca"
                />
                <FormInput
                  label="Estado / Provincia"
                  value={stateName}
                  onChange={(event) => setStateName(event.target.value)}
                  placeholder="Ej: Pichincha / Guayas / Azuay"
                />
                <FormInput
                  label="Código Postal"
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value)}
                  placeholder="Ej: 170518"
                />
                <FormInput
                  label="País"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  placeholder="Ej: Ecuador"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-900/60 flex flex-col gap-4">
            {(formMessage || formError) && (
              <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                formError
                  ? 'border-red-500/20 bg-red-500/10 text-red-400'
                  : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
              }`}
              >
                {formError || formMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold">
                <Lock className="h-4 w-4 text-teal-400 shrink-0" />
                <span>Tu informacion esta segura con nosotros. No compartimos tus datos con terceros.</span>
              </div>
              
              <Button 
                type="button" 
                onClick={() => void saveProfile()} 
                disabled={isSaving}
                className="bg-teal-500 hover:bg-teal-400 text-neutral-950 font-extrabold border-0 shrink-0 h-11 px-7 shadow-lg shadow-teal-500/20"
              >
                <Save className="h-4.5 w-4.5 shrink-0" />
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
