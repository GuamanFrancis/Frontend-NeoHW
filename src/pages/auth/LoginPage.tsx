import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { loginUser, roleHomeRoutes, saveSession } from '../../services/authService';
import type { LoginFormValues } from '../../types/auth';
import { AuthLayout } from './AuthLayout';

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      remember: true,
    },
  });


  const onSubmit = async (values: LoginFormValues) => {
    try {
      setFormError('');
      const session = await loginUser(values);
      saveSession(session, values.remember);
      const redirect = searchParams.get('redirect');
      navigate(redirect || roleHomeRoutes[session.user.role]);
    } catch (err: any) {
      const msg = err.response?.data?.message || '';
      if (err.response?.status === 403 && (msg.includes('verificada') || msg.includes('OTP'))) {
        navigate('/verificar-cuenta', { state: { email: values.email } });
        return;
      }
      let errorMsg = '';
      if (err.response) {
        if (err.response.data && typeof err.response.data === 'object' && err.response.data.message) {
          errorMsg = Array.isArray(err.response.data.message) 
            ? err.response.data.message.join(' ') 
            : String(err.response.data.message);
        } else if (typeof err.response.data === 'string') {
          if (err.response.data.includes('Cannot POST') || err.response.status === 404) {
            errorMsg = 'El servicio de autenticación no está disponible en este momento.';
          } else {
            errorMsg = err.response.data;
          }
        } else {
          errorMsg = 'Error de servidor. Revisa tus credenciales o el rol asignado.';
        }
      } else if (err.request) {
        errorMsg = 'No se pudo establecer conexión con el servidor. Por favor, inténtalo más tarde.';
      } else {
        errorMsg = err.message || 'Error al iniciar sesión.';
      }
      setFormError(errorMsg);
    }
  };


  return (
    <AuthLayout cardClassName="py-2">
      <div className="mb-6 text-left">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 hover:shadow dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 text-teal-600 dark:text-teal-400" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-extrabold leading-tight text-slate-950 dark:text-white xl:text-4xl">
          Iniciar sesión
        </h2>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-neutral-400">
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
              value: 8,
              message: 'La contrasena debe tener al menos 8 caracteres.',
            },
          })}
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

        <Button type="submit" variant="outlineHoverSolid" fullWidth disabled={isSubmitting} className="xl:h-14 xl:text-lg">
          {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
          <ArrowRight className="h-7 w-7" />
        </Button>
      </form>



      <div className="mt-7 border-t border-slate-200 pt-5 text-center text-base font-medium text-slate-600 dark:border-neutral-700 dark:text-neutral-300">
        No tienes cuenta?{' '}
        <Link
          to={searchParams.get('redirect') ? `/registro?redirect=${encodeURIComponent(searchParams.get('redirect') || '')}` : "/registro"}
          className="font-semibold text-teal-700 transition hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200"
        >
          Crear cuenta
        </Link>
      </div>
    </AuthLayout>
  );
};

