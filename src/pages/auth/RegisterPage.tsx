import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, User } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { registerUser, roleHomeRoutes, saveSession } from '../../services/authService';
import type { RegisterFormValues } from '../../types/auth';
import { AuthLayout } from './AuthLayout';

const genderOptions = [
  { label: 'Selecciona tu genero', value: '' },
  { label: 'Femenino', value: 'femenino' },
  { label: 'Masculino', value: 'masculino' },
  { label: 'Otro', value: 'otro' },
];

export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      nickname: '',
      gender: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setFormError('');
      const session = await registerUser(values);
      saveSession(session);
      const redirect = searchParams.get('redirect');
      navigate(redirect || roleHomeRoutes[session.user.role]);
    } catch {
      setFormError('No se pudo crear la cuenta. Revisa que el correo no exista y que la contrasena cumpla los requisitos.');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    alert(`El registro con ${provider} requiere configurar las credenciales OAuth en producción. Endpoint del backend listo: /auth/social/${provider}`);
  };

  return (
    <AuthLayout cardClassName="py-8 lg:py-7 !max-w-[540px]">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold leading-tight text-slate-950 dark:text-white">
          Crear cuenta
        </h2>
        <p className="mt-2 text-base font-medium text-slate-600 dark:text-neutral-300">
          Completa tus datos para registrarte
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormInput
            label="Nickname"
            type="text"
            placeholder="Ej: Francis"
            icon={<User className="h-5 w-5 flex-none text-slate-500 dark:text-neutral-300" />}
            error={errors.nickname?.message}
            {...register('nickname', {
              required: 'El nickname es obligatorio.',
              minLength: {
                value: 3,
                message: 'El nickname debe tener al menos 3 caracteres.',
              },
            })}
          />

          <FormSelect
            label="Genero"
            options={genderOptions}
            error={errors.gender?.message}
            {...register('gender', { required: 'Selecciona un genero.' })}
          />
        </div>

        <FormInput
          label="Correo electronico"
          type="email"
          placeholder="ejemplo@correo.com"
          icon={<Mail className="h-5 w-5 flex-none text-slate-500 dark:text-neutral-300" />}
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
          label="Numero celular"
          type="tel"
          placeholder="Ej: 0991234567"
          optional
          icon={<Phone className="h-5 w-5 flex-none text-slate-500 dark:text-neutral-300" />}
          error={errors.phone?.message}
          {...register('phone', {
            pattern: {
              value: /^$|^[0-9]{10}$/,
              message: 'El numero celular debe tener 10 digitos.',
            },
          })}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <FormInput
            label="Contrasena"
            type={showPassword ? 'text' : 'password'}
            placeholder="Crea una contrasena"
            icon={<LockKeyhole className="h-5 w-5 flex-none text-slate-500 dark:text-neutral-300" />}
            error={errors.password?.message}
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-white/10"
                aria-label="Mostrar contrasena"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            }
            {...register('password', {
              required: 'La contrasena es obligatoria.',
              minLength: {
                value: 8,
                message: 'La contrasena debe tener al menos 8 caracteres.',
              },
              pattern: {
                value: /^(?=.*[A-Z])(?=(.*\d){2})(?=(.*[\W_]){2}).*$/,
                message: 'Debe incluir 1 mayuscula, 2 numeros y 2 caracteres especiales.',
              },
            })}
          />

          <FormInput
            label="Confirmar contrasena"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirma tu contrasena"
            icon={<LockKeyhole className="h-5 w-5 flex-none text-slate-500 dark:text-neutral-300" />}
            error={errors.confirmPassword?.message}
            endIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-white/10"
                aria-label="Mostrar confirmacion de contrasena"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            }
            {...register('confirmPassword', {
              required: 'Confirma tu contrasena.',
              validate: (value) => value === getValues('password') || 'Las contrasenas no coinciden.',
            })}
          />
        </div>

        {formError && (
          <div className="rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {formError}
          </div>
        )}

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          <ArrowRight className="h-7 w-7" />
        </Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-neutral-700" />
        </div>
        <div className="relative flex justify-center text-sm font-medium">
          <span className="bg-white px-4 text-slate-500 dark:bg-neutral-900 dark:text-neutral-400">
            O regístrate con
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin('google')}
          className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-white/5"
        >
          <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span>Google</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin('facebook')}
          className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-white/5"
        >
          <svg className="h-5 w-5 mr-1 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>Facebook</span>
        </Button>
      </div>

      <div className="mt-5 text-center text-sm font-medium text-slate-600 dark:text-neutral-300 sm:text-base">
        Ya tienes cuenta?{' '}
        <Link
          to={searchParams.get('redirect') ? `/login?redirect=${encodeURIComponent(searchParams.get('redirect') || '')}` : "/login"}
          className="font-semibold text-teal-700 transition hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200"
        >
          Iniciar sesion
        </Link>
      </div>
    </AuthLayout>
  );
};
