import { BrowserRouter, Navigate, Routes, Route } from 'react-router';
import type { ReactNode } from 'react';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { HomePage } from '../pages/home/HomePage';
import  {ClienteDashboard} from '../pages/cliente/ClienteDashboard';
import { ClienteCatalogoPage } from '../pages/cliente/ClienteCatalogoPage';
import { ClienteCarritoPage } from '../pages/cliente/ClienteCarritoPage';
import { ClienteProyectosPage } from '../pages/cliente/ClienteProyectosPage';
import  {VendedorDashboard} from '../pages/vendedor/VendedorDashboard';
import { AdminDashboard } from '../pages/administrador/AdminDashboard';
import  {SimulatorPage} from '../pages/simulator/SimulatorPage';
import { MiCuentaPage } from '../pages/shared/MiCuentaPage';
import { VendedorPedidosPage } from '../pages/vendedor/VendedorPedidosPage';
import { VendedorEstadisticasPage } from '../pages/vendedor/VendedorEstadisticasPage';
import { VendedorInventarioPage } from '../pages/vendedor/VendedorInventarioPage';
import { AdminUsuariosPage } from '../pages/administrador/AdminUsuariosPage';
import { AdminCatalogoPage } from '../pages/administrador/AdminCatalogoPage';
import { roleHomeRoutes } from '../services/authService';
import { getStoredSession } from '../services/session';
import type { UserRole } from '../types/auth';
type RequireAuthProps = {
  allowedRoles: UserRole[];
  children: ReactNode;
};
const RequireAuth = ({ allowedRoles, children }: RequireAuthProps) => {
  const session = getStoredSession();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(session.user.role)) {
    return <Navigate to={roleHomeRoutes[session.user.role]} replace />;
  }
  return children;
};

const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const session = getStoredSession();
  if (session) {
    return <Navigate to={roleHomeRoutes[session.user.role]} replace />;
  }
  return children;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/registro" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/cliente" element={<RequireAuth allowedRoles={['cliente']}><ClienteDashboard /></RequireAuth>}>
          <Route index element={<Navigate to="catalogo" replace />} />
          <Route path="catalogo" element={<ClienteCatalogoPage />} />
          <Route path="carrito" element={<ClienteCarritoPage />} />
          <Route path="simulador" element={<SimulatorPage />} />
          <Route path="proyectos" element={<ClienteProyectosPage />} />
          <Route path="cuenta" element={<MiCuentaPage />} />
        </Route>
        <Route path="/vendedor" element={<RequireAuth allowedRoles={['vendedor']}><VendedorDashboard /></RequireAuth>}>
          <Route index element={<Navigate to="pedidos" replace />} />
          <Route path="pedidos" element={<VendedorPedidosPage />} />
          <Route path="estadisticas" element={<VendedorEstadisticasPage />} />
          <Route path="inventario" element={<VendedorInventarioPage />} />
          <Route path="cuenta" element={<MiCuentaPage />} />
        </Route>
        <Route path="/admin" element={<RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>}>
          <Route index element={<Navigate to="usuarios" replace />} />
          <Route path="usuarios" element={<AdminUsuariosPage />} />
          <Route path="catalogo" element={<AdminCatalogoPage />} />
          <Route path="pedidos" element={<VendedorPedidosPage />} />
          <Route path="cuenta" element={<MiCuentaPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
