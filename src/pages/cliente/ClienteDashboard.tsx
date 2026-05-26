import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getStoredSession } from '../../services/session';

const clienteMenu = [
  { label: 'Mi cuenta', path: '/cliente/cuenta' },
  { label: 'Explorar catálogo', path: '/cliente/catalogo' },
  { label: 'Simulador IA', path: '/cliente/simulador' },
  { label: 'Mis proyectos', path: '/cliente/proyectos' },
  { label: 'Carrito de compras', path: '/cliente/carrito' },
  { label: 'Historial de compras', path: '/cliente/pedidos' },
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
