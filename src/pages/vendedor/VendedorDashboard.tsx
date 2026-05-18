import { DashboardLayout } from '../../components/layout/DashboardLayout';

const vendedorMenu = [
  { label: 'Pedidos de clientes', path: '/vendedor/pedidos' },
  { label: 'Estadisticas de ventas', path: '/vendedor/estadisticas' },
  { label: 'Inventario', path: '/vendedor/inventario' },
  { label: 'Mi cuenta', path: '/vendedor/cuenta' },
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
