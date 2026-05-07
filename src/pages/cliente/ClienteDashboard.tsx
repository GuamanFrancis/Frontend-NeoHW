import { DashboardLayout } from '../../components/layout/DashboardLayout';

const clienteMenu = [
  { label: 'Inicio', path: '/cliente/inicio' },
  { label: 'Mi cuenta', path: '/cliente/cuenta' },
];

export const ClienteDashboard = () => {
  return (
    <DashboardLayout
      roleName="Cliente"
      userName="Francis Guaman"
      menuItems={clienteMenu}
    />
  );
};
