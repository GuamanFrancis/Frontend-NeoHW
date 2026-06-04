import { useState, useCallback } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import {
  Box,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  UserCircle,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { logoutUser } from '../../services/authService';
import { getStoredSession } from '../../services/session';


type MenuItem = {
  label: string;
  path: string;
};

type DashboardLayoutProps = {
  roleName: string;
  userName: string;
  menuItems: MenuItem[];
};

const ROLE_MAP: Record<string, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  cliente: 'Cliente',
};

export const DashboardLayout = ({ roleName, userName, menuItems }: DashboardLayoutProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const session = getStoredSession();

  const currentUserName = session?.user?.nickname ?? userName;
  const currentRoleName = session?.user?.role ? (ROLE_MAP[session.user.role] || roleName) : roleName;

  const [theme, setTheme] = useState(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const toggleMenu = useCallback(() => {
    setShowMenu((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('neohw_theme', newTheme);
      return newTheme;
    });
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutUser();
    navigate('/login');
  }, [navigate]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-neutral-950 dark:text-white">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMenu}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-teal-400/25 dark:text-neutral-200 dark:hover:bg-white/10"
            aria-label="Abrir o cerrar menu"
          >
            {showMenu ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition">
            <Box className="h-8 w-8 text-teal-500" strokeWidth={2.5} />
            <span className="text-2xl font-extrabold">
              Neo<span className="text-teal-500">HW</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-teal-400/25 dark:text-neutral-200 dark:hover:bg-white/10 mr-1"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-teal-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
          </button>
          <Link
            to={`/${session?.user?.role || 'cliente'}/cuenta`}
            className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-950 dark:text-white">{currentUserName}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">{currentRoleName}</p>
            </div>
            <UserCircle className="h-9 w-9 text-slate-500 dark:text-neutral-300" />
          </Link>
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-64px)]">
        {showMenu && (
          <aside className="hidden w-64 border-r border-slate-200 bg-white p-4 lg:block dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-950 dark:text-white">Menu</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400">Opciones del perfil</p>
              </div>
            </div>
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `block rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'border-teal-500/20 bg-teal-500/10 text-teal-500 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-400'
                        : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <Button
              type="button"
              onClick={handleLogout}
              variant="outline"
              fullWidth
              className="mt-6"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </Button>
          </aside>
        )}
        {showMenu && (
          <aside className="fixed inset-0 z-30 bg-black/50 lg:hidden">
            <div className="h-full w-72 bg-white p-4 shadow-xl dark:bg-neutral-950">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-950 dark:text-white">Menu</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Opciones del perfil</p>
                </div>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 dark:border-teal-400/25 dark:text-neutral-300"
                  aria-label="Cerrar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `block rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? 'border-teal-500/20 bg-teal-500/10 text-teal-500 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-400'
                          : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <Button
                type="button"
                onClick={handleLogout}
                variant="outline"
                fullWidth
                className="mt-6"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesion
              </Button>
            </div>
          </aside>
        )}
        <section className="flex-1 p-5 sm:p-6">
          <Outlet />
        </section>
      </div>
    </main>
  );
};