import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { loginUser, roleHomeRoutes, saveSession } from '../../services/authService';
import type { LoginFormValues } from '../../types/auth';
import { AuthLayout } from './AuthLayout';

const roleOptions = [
  { label: 'Cliente', value: 'cliente' },
  { label: 'Vendedor', value: 'vendedor' },
  { label: 'Administrador', value: 'admin' },
];

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      role: 'cliente',
      remember: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setFormError('');
      const session = await loginUser(values);
      saveSession(session, values.remember);
      navigate(roleHomeRoutes[session.user.role]);
    } catch {
      setFormError('No se pudo iniciar sesion. Revisa tus credenciales.');
    }
  };

  return (
    <AuthLayout cardClassName="py-8 lg:py-7">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold leading-tight text-slate-950 dark:text-white xl:text-4xl">
          Iniciar sesion
        </h2>
        <p className="mt-2 text-base font-medium text-slate-600 dark:text-neutral-300">
          Ingresa tus credenciales para continuar
        </p>
      </div>

      <form className="mt-7 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="Correo electronico"
          type="email"
          placeholder="ejemplo@correo.com"
          icon={<Mail className="h-6 w-6 flex-none text-slate-500 dark:text-neutral-300" />}
          error={errors.email?.message}
          {...register('email', {
            required: 'El correo electronico es obligatorio.',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Ingresa un correo electronico valido.',
            },
          })}
        />

        <FormInput
          label="Contrasena"
          type={showPassword ? 'text' : 'password'}
          placeholder="Ingresa tu contrasena"
          icon={<LockKeyhole className="h-6 w-6 flex-none text-slate-500 dark:text-neutral-300" />}
          error={errors.password?.message}
          endIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-white/10"
              aria-label="Mostrar contrasena"
            >
              {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
            </button>
          }
          {...register('password', {
            required: 'La contrasena es obligatoria.',
            minLength: {
              value: 6,
              message: 'La contrasena debe tener al menos 6 caracteres.',
            },
          })}
        />

        <FormSelect
          label="Ingresar como"
          options={roleOptions}
          error={errors.role?.message}
          {...register('role', { required: 'Selecciona un perfil.' })}
        />

        <div className="flex flex-col gap-4 text-sm font-medium text-slate-600 dark:text-neutral-300 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-slate-500 accent-teal-500"
              {...register('remember')}
            />
            Recordar mi sesion
          </label>
          <Link to="/recuperar-contrasena" className="text-teal-700 transition hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200">
            Olvidaste tu contrasena?
          </Link>
        </div>

        {formError && (
          <div className="rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {formError}
          </div>
        )}

        <Button type="submit" fullWidth disabled={isSubmitting} className="xl:h-14 xl:text-lg">
          {isSubmitting ? 'Ingresando...' : 'Iniciar sesion'}
          <ArrowRight className="h-7 w-7" />
        </Button>
      </form>

      <div className="mt-7 border-t border-slate-200 pt-5 text-center text-base font-medium text-slate-600 dark:border-neutral-700 dark:text-neutral-300">
        No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-teal-700 transition hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200">
          Crear cuenta
        </Link>
      </div>
    </AuthLayout>
  );
};
