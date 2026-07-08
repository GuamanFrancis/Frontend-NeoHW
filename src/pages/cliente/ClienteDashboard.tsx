import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getStoredSession } from '../../services/session';

const clienteMenu = [
  { label: 'Mi perfil', path: '/cliente/cuenta' },
  { label: 'Ver catálogo', path: '/cliente/catalogo' },
  { label: 'Armar mi PC', path: '/cliente/simulador' },
  { label: 'Mis ensambles', path: '/cliente/proyectos' },
  { label: 'Mis compras', path: '/cliente/pedidos' },
  { label: 'Mi carrito', path: '/cliente/carrito' },
];

export const ClienteDashboard = () => {
  const session = getStoredSession();
  const fn = session?.user.firstName || '';
  const ln = session?.user.lastName || '';
  const fullName = [fn, ln].filter(Boolean).join(' ') || session?.user.email || 'Cliente';

  return (
    <DashboardLayout
      roleName="Cliente"
      userName={fullName}
      menuItems={clienteMenu}
    />
  );
};
