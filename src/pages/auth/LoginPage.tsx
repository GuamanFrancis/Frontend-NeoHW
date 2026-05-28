import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { loginUser, roleHomeRoutes, saveSession } from '../../services/authService';
import {
  initGoogleSdk,
  initFacebookSdk,
  handleGoogleLogin,
  handleFacebookLogin,
  triggerFacebookAuth,
} from '../../services/socialAuth';
import type { LoginFormValues } from '../../types/auth';
import { AuthLayout } from './AuthLayout';

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      remember: true,
    },
  });

  useEffect(() => {
    let active = true;

    const loadSdk = async () => {
      try {
        await initGoogleSdk();
        if (!active) return;

        if (window.google?.accounts?.id) {
          const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
          window.google.accounts.id.initialize({
            client_id: clientId || '',
            callback: async (response: any) => {
              try {
                setFormError('');
                setIsGoogleLoading(true);
                const session = await handleGoogleLogin(response.credential);
                saveSession(session);
                const redirect = searchParams.get('redirect');
                navigate(redirect || roleHomeRoutes[session.user.role]);
              } catch (err: any) {
                console.error('Error al iniciar sesión con Google:', err);
                setFormError(
                  err.response?.data?.message || 'No se pudo iniciar sesion con Google.'
                );
              } finally {
                setIsGoogleLoading(false);
              }
            },
          });

          // Render the overlay button
          const overlayDiv = document.getElementById('google-signin-btn-overlay');
          if (overlayDiv) {
            window.google.accounts.id.renderButton(overlayDiv, {
              theme: 'outline',
              size: 'large',
              width: 220,
            });
          }
        }
      } catch (err) {
        console.error('Error al inicializar Google SDK:', err);
      }

      try {
        await initFacebookSdk();
      } catch (err) {
        console.error('Error al inicializar Facebook SDK:', err);
      }
    };

    loadSdk();

    return () => {
      active = false;
    };
  }, [navigate, searchParams]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setFormError('');
      const session = await loginUser(values);
      saveSession(session, values.remember);
      const redirect = searchParams.get('redirect');
      navigate(redirect || roleHomeRoutes[session.user.role]);
    } catch {
      setFormError('No se pudo iniciar sesion. Revisa tus credenciales o el rol asignado en el sistema.');
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setFormError('');
      setIsFacebookLoading(true);
      const token = await triggerFacebookAuth();
      const session = await handleFacebookLogin(token);
      saveSession(session);
      const redirect = searchParams.get('redirect');
      navigate(redirect || roleHomeRoutes[session.user.role]);
    } catch (err: any) {
      console.error('Error en login con Facebook:', err);
      setFormError(
        err.message || err.response?.data?.message || 'No se pudo iniciar sesion con Facebook.'
      );
    } finally {
      setIsFacebookLoading(false);
    }
  };

  return (
    <AuthLayout cardClassName="py-8 lg:py-7 !max-w-[480px]">
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

        <Button type="submit" fullWidth disabled={isSubmitting || isGoogleLoading || isFacebookLoading} className="xl:h-14 xl:text-lg">
          {isSubmitting ? 'Ingresando...' : 'Iniciar sesion'}
          <ArrowRight className="h-7 w-7" />
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-neutral-700" />
        </div>
        <div className="relative flex justify-center text-sm font-medium">
          <span className="bg-white px-4 text-slate-500 dark:bg-neutral-900 dark:text-neutral-400">
            O continuar con
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="relative h-12">
          <Button
            type="button"
            variant="outline"
            className="w-full h-full border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-white/5"
            disabled={isGoogleLoading || isFacebookLoading}
          >
            <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            <span>{isGoogleLoading ? 'Cargando...' : 'Google'}</span>
          </Button>
          <div
            id="google-signin-btn-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.01,
              zIndex: 10,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleFacebookSignIn}
          className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-white/5"
          disabled={isGoogleLoading || isFacebookLoading}
        >
          <svg className="h-5 w-5 mr-1 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>{isFacebookLoading ? 'Cargando...' : 'Facebook'}</span>
        </Button>
      </div>

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

