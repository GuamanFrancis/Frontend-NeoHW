import { useState } from 'react';
import { Save, UserCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { PageCard } from '../../components/ui/PageCard';
import { normalizeBackendUser } from '../../services/authService';
import { getStoredSession, updateStoredSession } from '../../services/session';
import { updateUser } from '../../services/usersService';

export const MiCuentaPage = () => {
  const session = getStoredSession();
  const [firstName, setFirstName] = useState(session?.user.firstName ?? '');
  const [lastName, setLastName] = useState(session?.user.lastName ?? '');
  const [phone, setPhone] = useState(session?.user.phone ?? '');
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <PageCard
      title="Mi cuenta"
      text="Revisa y actualiza tu informacion personal."
      icon={<UserCircle className="h-6 w-6" />}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <FormInput
          label="Nombre"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="Francisco"
        />
        <FormInput
          label="Apellido"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          placeholder="Perez"
        />
        <FormInput
          label="Telefono"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="0999999999"
        />
        <FormInput
          label="Correo electronico"
          value={session?.user.email ?? ''}
          disabled
          placeholder="usuario@correo.com"
        />
      </div>

      {(formMessage || formError) && (
        <div className={`mt-5 rounded-lg border px-4 py-3 text-sm font-medium ${
          formError
            ? 'border-red-400/40 bg-red-400/10 text-red-600 dark:text-red-200'
            : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200'
        }`}
        >
          {formError || formMessage}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button type="button" onClick={() => void saveProfile()} disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </PageCard>
  );
};
