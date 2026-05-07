import { DashboardLayout } from '../../components/layout/DashboardLayout';

const adminMenu = [
  { label: 'Inicio', path: '/admin/inicio' },
  { label: 'Gestionar usuarios', path: '/admin/usuarios' },
  { label: 'Gestionar catalogo', path: '/admin/catalogo' },
  { label: 'Atender pedidos', path: '/admin/pedidos' },
];

export const AdminDashboard = () => {
  return (
    <DashboardLayout
      roleName="Administrador"
      userName="Francis Guaman"
      menuItems={adminMenu}
    />
  );
};
