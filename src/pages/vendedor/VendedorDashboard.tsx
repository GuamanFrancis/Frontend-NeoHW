import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getStoredSession } from '../../services/session';

const vendedorMenu = [
  { label: 'Pedidos de clientes', path: '/vendedor/pedidos' },
  { label: 'Estadisticas de ventas', path: '/vendedor/estadisticas' },
  { label: 'Inventario', path: '/vendedor/inventario' },
  { label: 'Mi cuenta', path: '/vendedor/cuenta' },
];

export const VendedorDashboard = () => {
  const session = getStoredSession();
  const userName = session?.user?.firstName
    ? `${session.user.firstName} ${session.user.lastName || ''}`.trim()
    : 'Vendedor';

  return (
    <DashboardLayout
      roleName="Vendedor"
      userName={userName}
      menuItems={vendedorMenu}
    />
  );
};
