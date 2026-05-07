import type { ReactNode } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Eye,
  IdCard,
  LockKeyhole,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { Link } from 'react-router';
import { AuthLayout } from './AuthLayout';

const inputClassName =
  'h-full w-full border-0 bg-transparent px-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500';

type FieldIconProps = {
  children: ReactNode;
};

const FieldIcon = ({ children }: FieldIconProps) => (
  <span className="mt-1.5 flex h-11 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-slate-500 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
    {children}
  </span>
);

export const RegisterPage = () => {
  return (
    <AuthLayout cardClassName="py-6 lg:py-5">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold leading-tight text-slate-950">
          Crear cuenta
        </h2>
        <p className="mt-2 text-base font-medium text-slate-500">
          Completa tus datos para registrarte
        </p>
      </div>

      <form className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-950">Nombre</span>
            <FieldIcon>
              <User className="h-5 w-5 flex-none text-slate-500" />
              <input type="text" placeholder="Tu nombre" className={inputClassName} />
            </FieldIcon>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-950">Apellido</span>
            <FieldIcon>
              <User className="h-5 w-5 flex-none text-slate-500" />
              <input type="text" placeholder="Tu apellido" className={inputClassName} />
            </FieldIcon>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-950">Cedula de identidad</span>
            <FieldIcon>
              <IdCard className="h-5 w-5 flex-none text-slate-500" />
              <input type="text" placeholder="Ej: 1234567890" className={inputClassName} />
            </FieldIcon>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-950">Genero</span>
            <FieldIcon>
              <select
                defaultValue=""
                className="h-full w-full appearance-none border-0 bg-transparent text-sm font-medium text-slate-500 outline-none"
              >
                <option value="" disabled>Selecciona tu genero</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
                <option value="otro">Otro</option>
              </select>
              <ChevronDown className="h-5 w-5 flex-none text-slate-500" />
            </FieldIcon>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-slate-950">Correo electronico</span>
          <FieldIcon>
            <Mail className="h-5 w-5 flex-none text-slate-500" />
            <input type="email" placeholder="ejemplo@correo.com" className={inputClassName} />
          </FieldIcon>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-950">Numero celular</span>
          <FieldIcon>
            <Phone className="h-5 w-5 flex-none text-slate-500" />
            <input type="tel" placeholder="Ej: 0991234567" className={inputClassName} />
          </FieldIcon>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-950">Contrasena</span>
            <FieldIcon>
              <LockKeyhole className="h-5 w-5 flex-none text-slate-500" />
              <input type="password" placeholder="Crea una contrasena" className={inputClassName} />
              <button type="button" className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100" aria-label="Mostrar contrasena">
                <Eye className="h-5 w-5" />
              </button>
            </FieldIcon>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-950">Confirmar contrasena</span>
            <FieldIcon>
              <LockKeyhole className="h-5 w-5 flex-none text-slate-500" />
              <input type="password" placeholder="Confirma tu contrasena" className={inputClassName} />
              <button type="button" className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100" aria-label="Mostrar confirmacion de contrasena">
                <Eye className="h-5 w-5" />
              </button>
            </FieldIcon>
          </label>
        </div>

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-6 text-base font-bold text-white shadow-lg transition hover:bg-blue-700"
        >
          Crear cuenta
          <ArrowRight className="h-7 w-7" />
        </button>
      </form>

      <div className="mt-4 text-center text-sm font-medium text-slate-500 sm:text-base">
        Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-blue-600 transition hover:text-blue-700">
          Iniciar sesion
        </Link>
      </div>
    </AuthLayout>
  );
};
