import AppRoutes from './routes/AppRoutes';
import { CartProvider } from './context/CartContext';
export default function App() {
  return (
    <CartProvider>
      <AppRoutes />
    </CartProvider>
  );
}