import { DashboardLayout } from '../../components/layout/DashboardLayout';

const adminMenu = [
  { label: 'Gestionar usuarios', path: '/admin/usuarios' },
  { label: 'Gestionar catalogo', path: '/admin/catalogo' },
  { label: 'Gestionar pedidos', path: '/admin/pedidos' },
  { label: 'Mi cuenta', path: '/admin/cuenta' },
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
