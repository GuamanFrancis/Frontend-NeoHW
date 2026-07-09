import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, User, Phone } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { registerUser } from '../../services/authService';
import type { RegisterFormValues } from '../../types/auth';
import { AuthLayout } from './AuthLayout';

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
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
  });


  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setFormError('');
      await registerUser(values);
      navigate('/verificar-cuenta', {
        state: {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
        },
      });
    } catch (err: any) {
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
          errorMsg = 'No se pudo crear la cuenta. Revisa que el correo no exista y que la contraseña cumpla los requisitos.';
        }
      } else if (err.request) {
        errorMsg = 'No se pudo establecer conexión con el servidor. Por favor, inténtalo más tarde.';
      } else {
        errorMsg = err.message || 'Error al crear la cuenta.';
      }
      setFormError(errorMsg);
    }
  };


  return (
    <AuthLayout cardClassName="py-2">
      <div className="mb-4 text-left">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 hover:shadow dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 text-teal-600 dark:text-teal-400" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-extrabold leading-tight text-slate-955 dark:text-white">
          Crear cuenta
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-neutral-400">
          Completa tus datos para registrarte
        </p>
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Nombre"
            placeholder="Juan"
            icon={<User className="h-5 w-5 flex-none text-slate-500 dark:text-neutral-300" />}
            error={errors.firstName?.message}
            {...register('firstName', {
              required: 'El nombre es obligatorio.',
            })}
          />

          <FormInput
            label="Apellido"
            placeholder="Perez"
            icon={<User className="h-5 w-5 flex-none text-slate-500 dark:text-neutral-300" />}
            error={errors.lastName?.message}
            {...register('lastName', {
              required: 'El apellido es obligatorio.',
            })}
          />
        </div>

        <FormInput
          label="Numero celular"
          placeholder="0999999999"
          icon={<Phone className="h-5 w-5 flex-none text-slate-500 dark:text-neutral-300" />}
          error={errors.phone?.message}
          {...register('phone', {
            required: 'El numero celular es obligatorio.',
            pattern: {
              value: /^[0-9]{10}$/,
              message: 'El celular debe tener 10 digitos.',
            },
          })}
        />

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

        {formError && (
          <div className="rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {formError}
          </div>
        )}

        <Button type="submit" variant="outlineHoverSolid" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          <ArrowRight className="h-7 w-7" />
        </Button>
      </form>



      <div className="mt-4 text-center text-sm font-medium text-slate-600 dark:text-neutral-300 sm:text-base">
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
