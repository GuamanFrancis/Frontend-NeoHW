import { DashboardLayout } from '../../components/layout/DashboardLayout';

const clienteMenu = [
  { label: 'Explorar catálogo', path: '/cliente/catalogo' },
  { label: 'Simulador IA', path: '/cliente/simulador' },
  { label: 'Carrito de compras', path: '/cliente/carrito' },
  { label: 'Mis proyectos', path: '/cliente/proyectos' },
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
