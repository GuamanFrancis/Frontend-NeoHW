import { BrowserRouter, Navigate, Routes, Route } from 'react-router';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { HomePage } from '../pages/home/HomePage';
import  {ClienteDashboard} from '../pages/cliente/ClienteDashboard';
import  {VendedorDashboard} from '../pages/vendedor/VendedorDashboard';
import { AdminDashboard } from '../pages/administrador/AdminDashboard';
import  {SimulatorPage} from '../pages/simulator/SimulatorPage';
import { ClienteHomePage } from '../pages/cliente/ClienteHomePage';
import { ClienteCuentaPage } from '../pages/cliente/ClienteCuentaPage';
import { VendedorHomePage } from '../pages/vendedor/VendedorHomePage';
import { VendedorPedidosPage } from '../pages/vendedor/VendedorPedidosPage';
import { VendedorAtenderPedidosPage } from '../pages/vendedor/VendedorAtenderPedidosPage';
import { AdminHomePage } from '../pages/administrador/AdminHomePage';
import { AdminUsuariosPage } from '../pages/administrador/AdminUsuariosPage';
import { AdminCatalogoPage } from '../pages/administrador/AdminCatalogoPage';
import { AdminPedidosPage } from '../pages/administrador/AdminPedidosPage';


export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/cliente" element={<ClienteDashboard />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<ClienteHomePage />} />
          <Route path="cuenta" element={<ClienteCuentaPage />} />
        </Route>

        <Route path="/vendedor" element={<VendedorDashboard />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<VendedorHomePage />} />
          <Route path="pedidos" element={<VendedorPedidosPage />} />
          <Route path="atender-pedidos" element={<VendedorAtenderPedidosPage />} />
        </Route>

        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<AdminHomePage />} />
          <Route path="usuarios" element={<AdminUsuariosPage />} />
          <Route path="catalogo" element={<AdminCatalogoPage />} />
          <Route path="pedidos" element={<AdminPedidosPage />} />
        </Route>

        <Route path="/simulador" element={<SimulatorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
