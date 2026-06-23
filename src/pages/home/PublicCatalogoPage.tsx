import { PublicHeader } from '../../components/layout/PublicHeader';
import { ClienteCatalogoPage } from '../cliente/ClienteCatalogoPage';
import { Link } from 'react-router';
import { getStoredSession } from '../../services/session';
import { roleHomeRoutes } from '../../services/authService';

export const PublicCatalogoPage = () => {
  const session = getStoredSession();
  const dashboardPath = session ? roleHomeRoutes[session.user.role] : '/login';

  return (
    <main className="min-h-screen bg-[#eef4fa] text-slate-900 dark:bg-neutral-950 dark:text-neutral-50 overflow-x-hidden">
      <PublicHeader />
      <div className="mx-auto max-w-[95rem] p-5 sm:p-6 pb-12">
        <ClienteCatalogoPage />
      </div>
      <footer className="bg-white dark:bg-neutral-950 px-5 py-16 border-t border-slate-200 dark:border-neutral-900">
        <div className="mx-auto grid max-w-[95rem] gap-8 text-base text-slate-955 dark:text-white md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <img src="/favicon.jpg" alt="Logo NeoHW" className="h-8 w-8 object-cover rounded-lg" />
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Neo<span className="text-teal-500">HW</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm leading-6">
              Tienda de hardware para PC con enfoque en compatibilidad, compra guiada y tecnología para decisiones inteligentes.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-955 dark:text-white">Enlaces</h3>
            <div className="mt-3 space-y-2.5">
              <Link to="/catalogo" className="block hover:text-teal-400 transition">Catálogo</Link>
              <Link to="/simulador" className="block hover:text-teal-400 transition">Simulador IA</Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-955 dark:text-white">Cuenta</h3>
            <div className="mt-3 space-y-2.5">
              {session ? (
                <Link to={dashboardPath} className="block hover:text-teal-400 transition">Mi Panel</Link>
              ) : (
                <>
                  <Link to="/login" className="block hover:text-teal-400 transition">Iniciar sesión</Link>
                  <Link to="/registro" className="block hover:text-teal-400 transition">Crear cuenta</Link>
                </>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-955 dark:text-white">Contacto</h3>
            <div className="mt-3 space-y-2.5">
              <p>soporte@neohw.com</p>
              <p>Quito, Ecuador</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};
