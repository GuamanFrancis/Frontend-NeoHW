import { DashboardLayout } from '../../components/layout/DashboardLayout';

const vendedorMenu = [
  { label: 'Inicio', path: '/vendedor/inicio' },
  { label: 'Pedidos de clientes', path: '/vendedor/pedidos' },
  { label: 'Atender pedidos', path: '/vendedor/atender-pedidos' },
];

export const VendedorDashboard = () => {
  return (
    <DashboardLayout
      roleName="Vendedor"
      userName="Francis Guaman"
      menuItems={vendedorMenu}
    />
  );
};
