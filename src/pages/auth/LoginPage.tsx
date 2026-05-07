import { ArrowRight, Eye, LockKeyhole, Mail } from 'lucide-react';
import { Link } from 'react-router';
import { AuthLayout } from './AuthLayout';

export const LoginPage = () => {
  return (
    <AuthLayout cardClassName="py-8 lg:py-7">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold leading-tight text-slate-950 xl:text-4xl">
          Iniciar sesion
        </h2>
        <p className="mt-2 text-base font-medium text-slate-500">
          Ingresa tus credenciales para continuar
        </p>
      </div>

      <form className="mt-7 space-y-5">
        <label className="block">
          <span className="text-base font-semibold text-slate-950">
            Correo electronico
          </span>
          <span className="mt-2 flex h-12 items-center rounded-lg border border-slate-300 bg-white px-4 text-slate-500 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 xl:h-14">
            <Mail className="h-6 w-6 flex-none text-slate-500" />
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              className="h-full w-full border-0 bg-transparent px-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-500"
            />
          </span>
        </label>

        <label className="block">
          <span className="text-base font-semibold text-slate-950">
            Contrasena
          </span>
          <span className="mt-2 flex h-12 items-center rounded-lg border border-slate-300 bg-white px-4 text-slate-500 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 xl:h-14">
            <LockKeyhole className="h-6 w-6 flex-none text-slate-500" />
            <input
              type="password"
              placeholder="Ingresa tu contrasena"
              className="h-full w-full border-0 bg-transparent px-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-500"
            />
            <button type="button" className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100" aria-label="Mostrar contrasena">
              <Eye className="h-6 w-6" />
            </button>
          </span>
        </label>

        <div className="flex flex-col gap-4 text-sm font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-slate-300 accent-blue-600"
            />
            Recordar mi sesion
          </label>
          <Link to="/recuperar-contrasena" className="text-blue-600 transition hover:text-blue-700">
            Olvidaste tu contrasena?
          </Link>
        </div>

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-6 text-base font-bold text-white shadow-lg transition hover:bg-blue-700 xl:h-14 xl:text-lg"
        >
          Iniciar sesion
          <ArrowRight className="h-7 w-7" />
        </button>
      </form>

      <div className="mt-7 border-t border-slate-200 pt-5 text-center text-base font-medium text-slate-500">
        No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-blue-600 transition hover:text-blue-700">
          Crear cuenta
        </Link>
      </div>
    </AuthLayout>
  );
};
