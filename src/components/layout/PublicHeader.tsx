import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import {
  LogOut,
  Search,
  ShoppingCart,
  Sun,
  Moon,
} from 'lucide-react';
import { getStoredSession } from '../../services/session';
import { roleHomeRoutes, logoutUser } from '../../services/authService';
import { useCart } from '../../context/CartContext';

export const PublicHeader = () => {
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const session = getStoredSession();

  const [theme, setTheme] = useState(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('neohw_theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('neohw_theme', 'dark');
      setTheme('dark');
    }
  };

 
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const dashboardPath = session ? roleHomeRoutes[session.user.role] : '/login';
  const isHome = location.pathname === '/';

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (isHome) {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      e.preventDefault();
      sessionStorage.setItem('scroll-to-section', targetId);
      navigate('/');
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white dark:border-neutral-900 dark:bg-neutral-950">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-3">
          <img src="/favicon.jpg" alt="Logo NeoHW" className="h-9 w-9 object-cover rounded-lg" />
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Neo<span className="text-teal-500">HW</span>
          </span>
        </Link>
        <div className="hidden items-center gap-8 text-base font-normal text-slate-955 dark:text-white lg:flex">
          <a
            href="/"
            onClick={(e) => handleScrollTo(e, 'inicio')}
            className="transition hover:text-teal-500 dark:hover:text-teal-400"
          >
            Inicio
          </a>
          <Link to="/catalogo" className="transition hover:text-teal-500 dark:hover:text-teal-400">Catálogo</Link>
          <Link to="/simulador" className="transition hover:text-teal-500 dark:hover:text-teal-400">Simulador IA</Link>

          <a
            href="/"
            onClick={(e) => handleScrollTo(e, 'beneficios')}
            className="transition hover:text-teal-500 dark:hover:text-teal-400"
          >
            Beneficios
          </a>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-955 transition hover:bg-slate-100 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-900"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-teal-400" /> : <Moon className="h-5 w-5 text-slate-955" />}
          </button>
          <Link
            to="/catalogo"
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-955 transition hover:bg-slate-100 dark:text-white dark:hover:bg-neutral-900 md:flex"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            to="/cliente/carrito"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-955 transition hover:bg-slate-100 dark:text-white dark:hover:bg-neutral-900"
            aria-label="Carrito"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white shadow-lg">
                {itemCount}
              </span>
            )}
          </Link>
          {session ? (
            <div className="flex items-center gap-5 ml-2">
              <Link
                to={dashboardPath}
                className="text-base font-normal text-slate-955 dark:text-white transition hover:text-teal-500 dark:hover:text-teal-400"
              >
                Panel de {session.user.role === 'admin' ? 'Admin' : session.user.role === 'vendedor' ? 'Vendedor' : 'Cliente'}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-base font-normal text-slate-955 dark:text-white transition hover:text-teal-500 dark:hover:text-teal-400 cursor-pointer"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-5 ml-2">
              <Link
                to="/login"
                className="hidden text-base font-normal text-slate-955 dark:text-white transition hover:text-teal-500 dark:hover:text-teal-400 sm:flex"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/registro"
                className="flex items-center text-base font-normal text-slate-955 dark:text-white transition hover:text-teal-500 dark:hover:text-teal-400"
              >
                <span>Crear cuenta</span>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
