import { BrowserRouter, Navigate, Routes, Route } from 'react-router';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { HomePage } from '../pages/home/HomePage';
import  {ClienteDashboard} from '../pages/cliente/ClienteDashboard';
import { ClienteCatalogoPage } from '../pages/cliente/ClienteCatalogoPage';
import { ClienteCarritoPage } from '../pages/cliente/ClienteCarritoPage';
import { ClienteProyectosPage } from '../pages/cliente/ClienteProyectosPage';
import { ClientePedidosPage } from '../pages/cliente/ClientePedidosPage';
import  {VendedorDashboard} from '../pages/vendedor/VendedorDashboard';
import { AdminDashboard } from '../pages/administrador/AdminDashboard';
import  {SimulatorPage} from '../pages/simulator/SimulatorPage';
import { MiCuentaPage } from '../pages/shared/MiCuentaPage';
import { VendedorPedidosPage } from '../pages/vendedor/VendedorPedidosPage';
import { VendedorEstadisticasPage } from '../pages/vendedor/VendedorEstadisticasPage';
import { VendedorInventarioPage } from '../pages/vendedor/VendedorInventarioPage';
import { AdminUsuariosPage } from '../pages/administrador/AdminUsuariosPage';
import { AdminCatalogoPage } from '../pages/administrador/AdminCatalogoPage';
import { AdminCuentaPage } from '../pages/administrador/AdminCuentaPage';
import { AdminInventarioPage } from '../pages/administrador/AdminInventarioPage';
import { AdminEstadisticasPage } from '../pages/administrador/AdminEstadisticasPage';
import { roleHomeRoutes, getMyProfile, normalizeBackendUser } from '../services/authService';
import { getStoredSession, updateStoredSession, clearStoredSession } from '../services/session';
import type { UserRole } from '../types/auth';
import { CheckoutStatusPage } from '../pages/cliente/CheckoutStatus';
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
  const [isChecking, setIsChecking] = useState(() => !!getStoredSession());

  useEffect(() => {
    const checkAuth = async () => {
      const session = getStoredSession();
      if (!session) {
        setIsChecking(false);
        return;
      }
      try {
        const user = await getMyProfile();
        updateStoredSession({
          accessToken: session.accessToken,
          user: normalizeBackendUser(user),
        });
      } catch (err) {
        console.error('Session verification failed:', err);
        clearStoredSession();
      } finally {
        setIsChecking(false);
      }
    };
    void checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicOnlyRoute><HomePage /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/registro" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/simulador" element={<PublicOnlyRoute><SimulatorPage /></PublicOnlyRoute>} />
        <Route path="/success" element={<CheckoutStatusPage type="success" />} />
        <Route path="/cancel" element={<CheckoutStatusPage type="cancel" />} />
        <Route path="/cliente" element={<RequireAuth allowedRoles={['cliente']}><ClienteDashboard /></RequireAuth>}>
          <Route index element={<Navigate to="catalogo" replace />} />
          <Route path="catalogo" element={<ClienteCatalogoPage />} />
          <Route path="simulador" element={<SimulatorPage />} />
          <Route path="carrito" element={<ClienteCarritoPage />} />
          <Route path="proyectos" element={<ClienteProyectosPage />} />
          <Route path="pedidos" element={<ClientePedidosPage />} />
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
          <Route path="cuenta" element={<AdminCuentaPage />} />
          <Route path="usuarios" element={<AdminUsuariosPage />} />
          <Route path="catalogo" element={<AdminCatalogoPage />} />
          <Route path="inventario" element={<AdminInventarioPage />} />
          <Route path="estadisticas" element={<AdminEstadisticasPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
