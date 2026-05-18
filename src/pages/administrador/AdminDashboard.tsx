import { DashboardLayout } from '../../components/layout/DashboardLayout';

const adminMenu = [
  { label: 'Gestionar usuarios', path: '/admin/usuarios' },
  { label: 'Gestionar catalogo', path: '/admin/catalogo' },
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
