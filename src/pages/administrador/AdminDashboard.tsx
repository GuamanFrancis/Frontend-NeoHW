import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getStoredSession } from '../../services/session';

const adminMenu = [
  { label: 'Mi cuenta', path: '/admin/cuenta' },
  { label: 'Gestionar usuarios', path: '/admin/usuarios' },
  { label: 'Gestionar catalogo', path: '/admin/catalogo' },
  { label: 'Ver inventario', path: '/admin/inventario' },
  { label: 'Estadisticas de ventas', path: '/admin/estadisticas' },
];

export const AdminDashboard = () => {
  const session = getStoredSession();
  const fn = session?.user.firstName || '';
  const ln = session?.user.lastName || '';
  const fullName = [fn, ln].filter(Boolean).join(' ') || session?.user.email || 'Administrador';

  return (
    <DashboardLayout
      roleName="Administrador"
      userName={fullName}
      menuItems={adminMenu}
    />
  );
};
