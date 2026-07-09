import { useState, useCallback } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

  const changeTheme = useCallback((newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('neohw_theme', newTheme);
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutUser();
    navigate('/login');
  }, [navigate]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-neutral-950 dark:text-white overflow-x-hidden">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm sm:px-10 lg:px-14 xl:px-20 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleMenu}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-teal-400/25 dark:text-neutral-200 dark:hover:bg-white/10 lg:hidden"
              aria-label="Abrir o cerrar menu"
            >
              {showMenu ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </button>
            <Link to="/" className="flex items-center gap-3 hover:opacity-95 transition shrink-0">
              <img src="/favicon.jpg" alt="Logo NeoHW" className="h-11 w-11 object-cover rounded-xl shadow-sm border border-teal-500/15" />
              <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Neo<span className="text-teal-500">HW</span>
              </span>
            </Link>
          </div>

          {/* Navigation Menu in Header: centered and spaced out dynamically using the middle space */}
          <nav className="hidden lg:flex items-center justify-center flex-1 gap-3 xl:gap-5 px-6 max-w-4xl mx-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3.5 py-2 text-base font-normal rounded-lg border border-transparent transition whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-500 dark:bg-teal-400/10 dark:text-teal-400'
                      : 'text-slate-900 hover:bg-slate-100 hover:text-slate-955 dark:text-white dark:hover:bg-white/5 dark:hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-3 hover:opacity-85 transition cursor-pointer"
              >
                <div className="hidden text-right sm:block">
                  <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">{currentUserName}</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 leading-none">{currentRoleName}</p>
                </div>
                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-teal-500/10 text-teal-650 dark:bg-teal-400/20 dark:text-teal-400 font-bold border border-teal-500/20">
                  <User className="h-6 w-6" />
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95, transition: { duration: 0.1 } }}
                      className="absolute right-0 mt-2 w-[360px] origin-top-right rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-950 z-50 text-left"
                    >
                      <div className="flex items-start gap-4 border-b border-slate-100 dark:border-neutral-900 pb-4 mb-4">
                        <div className="h-20 w-20 shrink-0 flex items-center justify-center rounded-xl bg-teal-500/10 text-teal-650 dark:bg-teal-400/20 dark:text-teal-400 font-bold border border-teal-500/20">
                          <User className="h-10 w-10" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-3">
                          <div>
                            <p className="text-base font-bold text-slate-900 dark:text-white truncate leading-snug">
                              {currentUserName}
                            </p>
                            <p className="text-xs text-slate-900 dark:text-white font-medium truncate mt-0.5 opacity-80">
                              {session?.user?.email ?? 'usuario@neohw.com'}
                            </p>
                            <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-900 dark:bg-neutral-900 dark:text-white px-1.5 py-0.5 rounded">
                              {currentRoleName}
                            </span>
                          </div>

                          <div>
                            <p className="text-[10px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                              Tema
                            </p>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => changeTheme('light')}
                                className={`flex-1 py-1 px-2.5 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                                  theme === 'light'
                                    ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                                    : 'border-slate-200 text-slate-900 hover:bg-slate-50 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-900'
                                }`}
                              >
                                Claro
                              </button>
                              <button
                                type="button"
                                onClick={() => changeTheme('dark')}
                                className={`flex-1 py-1 px-2.5 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                                  theme === 'dark'
                                    ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                                    : 'border-slate-200 text-slate-900 hover:bg-slate-50 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-900'
                                }`}
                              >
                                Oscuro
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate(`/${session?.user?.role || 'cliente'}/cuenta`);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-teal-500 text-teal-650 bg-transparent hover:bg-teal-500 hover:text-white dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-400 dark:hover:text-neutral-955 transition py-2 text-sm font-bold cursor-pointer"
                        >
                          <User className="h-4 w-4" />
                          Ver Perfil
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setIsProfileOpen(false);
                            await handleLogout();
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-500 text-red-500 bg-transparent hover:bg-red-500 hover:text-white transition py-2 text-sm font-bold cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
      <div className="flex min-h-[calc(100vh-64px)]">

        {showMenu && (
          <aside className="fixed inset-0 z-30 bg-black/50 lg:hidden">
            <div className="h-full w-72 bg-white p-4 shadow-xl dark:bg-neutral-950">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-955 dark:text-white">Menu</p>
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
        <section className="flex-1 p-5 sm:p-6 overflow-x-hidden">
          <Outlet />
        </section>
      </div>
    </main>
  );
};