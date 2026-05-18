import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
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
      navigate(roleHomeRoutes[session.user.role]);
    } catch {
      setFormError('No se pudo crear la cuenta. Revisa que el correo no exista y que la contrasena cumpla los requisitos.');
    }
  };

  return (
    <AuthLayout cardClassName="py-8 lg:py-7">
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

      <div className="mt-5 text-center text-sm font-medium text-slate-600 dark:text-neutral-300 sm:text-base">
        Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-teal-700 transition hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200">
          Iniciar sesion
        </Link>
      </div>
    </AuthLayout>
  );
};
