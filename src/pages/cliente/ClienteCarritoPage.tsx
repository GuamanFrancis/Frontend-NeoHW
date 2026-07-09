import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  ArrowLeft,
  Trash2,
  ShoppingCart,
  Plus,
  Minus,
  AlertTriangle,
  Check,
  X,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { createOrderFromCart } from '../../services/ordersService';
import { Modal } from '../../components/ui/Modal';
import { FormInput } from '../../components/ui/FormInput';
import { getStoredSession } from '../../services/session';
import type { CatalogComponent } from '../../types/catalog';
import { ComponenteDetalleDrawer } from './ComponenteDetalleDrawer';
import { createStripeSession } from '../../services/paymentsService';

const ECUADOR_PROVINCES: Record<string, string[]> = {
  Pichincha: ['Quito', 'Sangolquí', 'Cayambe', 'Machachi', 'Tabacundo'],
  Guayas: ['Guayaquil', 'Samborondón', 'Durán', 'Milagro', 'Daule'],
  Azuay: ['Cuenca', 'Gualaceo', 'Chordeleg', 'Paute', 'Santa Isabel'],
  Manabí: ['Portoviejo', 'Manta', 'Chone', 'Montecristi', 'Bahía de Caráquez', 'Jipijapa'],
  Tungurahua: ['Ambato', 'Baños', 'Pelileo', 'Píllaro'],
  Imbabura: ['Ibarra', 'Otavalo', 'Cotacachi', 'Atuntaqui'],
  Loja: ['Loja', 'Catamayo', 'Cariamanga', 'Macará'],
  'El Oro': ['Machala', 'Pasaje', 'Santa Rosa', 'Huaquillas'],
  'Santa Elena': ['Santa Elena', 'Salinas', 'La Libertad'],
  'Santo Domingo': ['Santo Domingo'],
  Esmeraldas: ['Esmeraldas', 'Atacames', 'Quinindé'],
  Carchi: ['Tulcán', 'San Gabriel'],
  Cotopaxi: ['Latacunga', 'Salcedo', 'Pujilí'],
  Chimborazo: ['Riobamba', 'Guano', 'Alausí'],
  Bolívar: ['Guaranda', 'San Miguel'],
  Cañar: ['Azogues', 'La Troncal'],
  Napo: ['Tena'],
  Pastaza: ['Puyo'],
  Morona: ['Macas'],
  Zamora: ['Zamora'],
  Galápagos: ['Puerto Ayora', 'Puerto Baquerizo Moreno'],
  Orellana: ['El Coca'],
  Sucumbíos: ['Nueva Loja'],
};

export const ClienteCarritoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getToastHeader = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes('guardado')) return '¡PROYECTO GUARDADO!';
    if (m.includes('carrito') || m.includes('añadidos') || m.includes('agregado')) return '¡CARRITO ACTUALIZADO!';
    return '¡ÉXITO!';
  };

  useEffect(() => {
    if (location.state?.message) {
      setToastMessage(location.state.message);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    taxes,
    total,
    itemCount,
    syncCart,
  } = useCart();

  useEffect(() => {
    if (syncCart) {
      void syncCart();
    }
  }, [syncCart]);

  const handleRemoveItem = async (productId: string, productName: string) => {
    try {
      await removeFromCart(productId);
      setToastMessage(`¡Producto "${productName}" eliminado del carrito!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      setToastMessage("¡El carrito de compras ha sido vaciado!");
    } catch (err) {
      console.error(err);
    }
  };

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Ecuador');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
    postalCode: '',
    street: '',
  });

  const validateField = (name: string, value: string) => {
    let errMsg = '';
    const trimmed = value.trim();

    if (!value) {
      errMsg = 'Este campo es obligatorio.';
    } else {
      if (name === 'fullName') {
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,60}$/;
        if (!nameRegex.test(trimmed)) {
          errMsg = 'Solo debe contener letras y tener al menos 3 caracteres.';
        }
      }
      if (name === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          errMsg = 'Formato de correo electrónico inválido (ej: correo@ejemplo.com).';
        }
      }
      if (name === 'phone') {
        const phoneRegex = /^0\d{8,9}$/;
        if (!phoneRegex.test(trimmed)) {
          errMsg = 'Debe tener entre 9 y 10 dígitos numéricos y comenzar con 0.';
        }
      }
      if (name === 'postalCode') {
        const postalRegex = /^\d{6}$/;
        if (!postalRegex.test(trimmed)) {
          errMsg = 'Debe ser un número de exactamente 6 dígitos (ej: 170504).';
        }
      }
      if (name === 'street') {
        if (trimmed.length < 5) {
          errMsg = 'La dirección debe tener al menos 5 caracteres.';
        }
      }
    }

    setErrors((prev) => ({ ...prev, [name]: errMsg }));
    return errMsg === '';
  };

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogComponent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleProvinceChange = (newProvince: string) => {
    setStateName(newProvince);
    const cities = ECUADOR_PROVINCES[newProvince] || [];
    if (cities.length > 0) {
      setCity(cities[0]);
    } else {
      setCity('');
    }
  };

  const handleOpenDetail = (product: CatalogComponent) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleOpenCheckout = () => {
    setCheckoutError(null);
    const session = getStoredSession();
    const userId = session?.user.id;
    if (session?.user) {
      setFullName(`${session.user.firstName || ''} ${session.user.lastName || ''}`.trim());
      setEmail(session.user.email || '');
      setPhone(session.user.phone || '');
    }
    let loadedState = 'Pichincha';
    let loadedCity = 'Quito';
    if (userId) {
      try {
        const savedAddress = JSON.parse(localStorage.getItem(`shipping_address_${userId}`) || '{}');
        if (savedAddress && typeof savedAddress === 'object') {
          if (savedAddress.fullName) setFullName(savedAddress.fullName);
          if (savedAddress.email) setEmail(savedAddress.email);
          if (savedAddress.phone) setPhone(savedAddress.phone);
          if (savedAddress.street) setStreet(savedAddress.street);
          if (savedAddress.postalCode) setPostalCode(savedAddress.postalCode);
          if (savedAddress.country) setCountry(savedAddress.country);
          if (savedAddress.state && ECUADOR_PROVINCES[savedAddress.state]) {
            loadedState = savedAddress.state;
            if (savedAddress.city && ECUADOR_PROVINCES[loadedState].includes(savedAddress.city)) {
              loadedCity = savedAddress.city;
            } else {
              loadedCity = ECUADOR_PROVINCES[loadedState][0];
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    setStateName(loadedState);
    setCity(loadedCity);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanStreet = street.trim();
    const cleanCity = city.trim();
    const cleanState = stateName.trim();
    const cleanPostal = postalCode.trim();
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    const isNameValid = validateField('fullName', fullName);
    const isEmailValid = validateField('email', email);
    const isPhoneValid = validateField('phone', phone);
    const isPostalValid = validateField('postalCode', postalCode);
    const isStreetValid = validateField('street', street);

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isPostalValid || !isStreetValid || !cleanCity || !cleanState) {
      setCheckoutError('Por favor corrige los errores del formulario antes de continuar.');
      return;
    }

    setLoadingCheckout(true);
    setCheckoutError(null);
    try {
      const payload = {
        shippingAddress: {
          fullName: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          street: cleanStreet,
          city: cleanCity,
          state: cleanState,
          postalCode: cleanPostal,
          country: country.trim(),
        },
      };
      const response = await createOrderFromCart(payload);

      const session = getStoredSession();
      const userId = session?.user.id;
      if (userId) {
        localStorage.setItem(`shipping_address_${userId}`, JSON.stringify(payload.shippingAddress));
      }

      const stripeRes = await createStripeSession(response.orderId);
      await clearCart(true);
      if (stripeRes && stripeRes.url) {
        window.location.replace(stripeRes.url);
      } else {
        setCheckoutError('Error al iniciar el método de pago con Stripe.');
      }
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { response?: { data?: { message?: string | string[] } } };
      const errMsg = errorResponse.response?.data?.message || 'Error al procesar el pedido. Intente nuevamente.';
      setCheckoutError(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
    } finally {
      setLoadingCheckout(false);
    }
  };

  const statusColors = {
    disponible: 'text-emerald-500',
    'stock-bajo': 'text-amber-500',
    agotado: 'text-rose-500',
  };

  const statusLabels = {
    disponible: 'Disponible',
    'stock-bajo': 'Stock bajo',
    agotado: 'Agotado',
  };

  if (cartItems.length === 0) {
    return (
      <>
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, x: 20, scale: 0.95, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="fixed top-6 right-6 z-[100] flex items-start gap-4 rounded-xl border border-emerald-250 bg-emerald-50/95 p-5 pr-12 shadow-lg backdrop-blur-sm dark:border-emerald-800/40 dark:bg-emerald-950/90 max-w-md w-full"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                <Check className="h-5.5 w-5.5 stroke-[2.5]" />
              </div>

              <div className="flex-1 text-left min-w-0">
                <h4 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">
                  {getToastHeader(toastMessage)}
                </h4>
                <p className="mt-0.5 text-sm font-semibold leading-relaxed text-slate-900 dark:text-slate-200">
                  {toastMessage}
                </p>
              </div>

              <button
                onClick={() => setToastMessage(null)}
                className="absolute top-4.5 right-3.5 p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4 stroke-[2]" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="w-full pt-4 pb-16 text-slate-800 dark:text-neutral-200">
          <div className="flex h-96 flex-col items-center justify-between rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-white/50 p-8 text-center dark:bg-neutral-900/10 max-w-2xl mx-auto py-16">
            <ShoppingCart className="h-16 w-16 text-slate-800 dark:text-neutral-200 opacity-40" />
            <div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-neutral-200 mt-4">Tu carrito está vacío</h3>
              <p className="text-sm font-normal text-slate-600 dark:text-neutral-400 mt-2 max-w-md">
                Aún no has agregado ningún componente a tu carrito. Explora nuestro catálogo de hardware para comenzar a armar tu PC.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/cliente/catalogo')}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-neutral-800 bg-transparent text-slate-700 dark:text-neutral-300 font-medium px-6 py-2.5 transition mt-6 text-sm hover:bg-slate-50 dark:hover:bg-neutral-900/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Explorar catálogo
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, x: 20, scale: 0.95, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed top-6 right-6 z-[100] flex items-start gap-4 rounded-xl border border-emerald-250 bg-emerald-50/95 p-5 pr-12 shadow-lg backdrop-blur-sm dark:border-emerald-800/40 dark:bg-emerald-950/90 max-w-md w-full"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
              <Check className="h-5.5 w-5.5 stroke-[2.5]" />
            </div>

            <div className="flex-1 text-left min-w-0">
              <h4 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">
                {getToastHeader(toastMessage)}
              </h4>
              <p className="mt-0.5 text-sm font-semibold leading-relaxed text-slate-900 dark:text-slate-200">
                {toastMessage}
              </p>
            </div>

            <button
              onClick={() => setToastMessage(null)}
              className="absolute top-4.5 right-3.5 p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 stroke-[2]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="w-full pt-4 pb-16 text-slate-800 dark:text-neutral-200">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white dark:border-neutral-900 dark:bg-neutral-950/20 shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-250 dark:border-neutral-800 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  <th className="py-4 px-4">Producto</th>
                  <th className="py-4 px-4 text-right">Precio unitario</th>
                  <th className="py-4 px-4 text-center">Cantidad</th>
                  <th className="py-4 px-4 text-center">Disponibilidad</th>
                  <th className="py-4 px-4 text-right">Subtotal</th>
                  <th className="py-4 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
                {cartItems.map(({ product, quantity }) => {
                  const itemSubtotal = product.price * quantity;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-4 min-w-[200px]">
                        <div className="flex items-center gap-4">
                          <div
                            className="h-20 w-20 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-neutral-800 p-0 overflow-hidden cursor-pointer hover:opacity-80 transition"
                            onClick={() => handleOpenDetail(product)}
                            title="Ver detalles"
                          >
                            <img
                              src={product.imageUrl || '/favicon.jpg'}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/favicon.jpg';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <h4
                              className="font-bold text-base text-slate-900 dark:text-white cursor-pointer hover:underline transition"
                              title={product.name}
                              onClick={() => handleOpenDetail(product)}
                            >
                              {product.name}
                            </h4>
                            {product.category && product.category !== 'Sin categoria' && product.category !== 'Sin categoría' && (
                              <div className="text-xs text-slate-900 dark:text-white font-bold uppercase tracking-wider mt-0.5">
                                {product.category}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                        <div>${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-[10px] text-slate-900 dark:text-white font-medium mt-0.5">USD</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center">
                          <div className="flex items-center rounded-lg border border-slate-200 dark:border-neutral-800 overflow-hidden bg-slate-50 dark:bg-neutral-900 h-9 p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              disabled={quantity <= 1}
                              className="flex h-8 w-8 items-center justify-center text-slate-600 dark:text-neutral-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-9 text-center font-bold text-sm text-slate-900 dark:text-white">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              disabled={quantity >= product.stock}
                              className="flex h-8 w-8 items-center justify-center text-slate-600 dark:text-neutral-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <div className="flex items-center gap-1.5 font-semibold text-sm">
                            <span className={`h-1.5 w-1.5 rounded-full fill-current bg-current ${statusColors[product.status]}`} />
                            <span className={statusColors[product.status]}>{statusLabels[product.status]}</span>
                          </div>
                          <div className="text-sm text-slate-900 dark:text-white font-semibold">
                            Stock: {product.stock}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                        <div>${itemSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-[10px] text-slate-900 dark:text-white font-medium mt-0.5">USD</div>
                      </td>
                      <td className="py-4 px-4 min-w-[50px]">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(product.id, product.name)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500 text-red-500 bg-transparent hover:bg-red-500 hover:text-white transition cursor-pointer"
                            aria-label="Quitar del carrito"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => navigate('/cliente/catalogo')}
              className="flex items-center justify-center gap-2 rounded-lg border border-teal-500 text-teal-600 bg-transparent hover:bg-teal-500 hover:text-white dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-400 dark:hover:text-neutral-950 transition px-5 py-2 text-sm font-semibold cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Seguir comprando
            </button>
            <button
              type="button"
              onClick={handleClearCart}
              className="flex items-center justify-center gap-2 rounded-lg border border-red-500 text-red-500 bg-transparent hover:bg-red-500 hover:text-white transition px-5 py-2 text-sm font-semibold cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Vaciar carrito
            </button>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-neutral-900 dark:bg-neutral-950/20">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wider border-b border-slate-200 dark:border-neutral-900 pb-3">
              Resumen antes de confirmar compra
            </h3>
            <div className="mt-4 space-y-4">
              {cartItems.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between gap-3 text-sm">
                  <div
                    className="flex items-center gap-3 min-w-0 cursor-pointer hover:underline transition group"
                    onClick={() => handleOpenDetail(product)}
                    title="Ver detalles"
                  >
                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-800 p-0 overflow-hidden group-hover:opacity-85 transition">
                      <img
                        src={product.imageUrl || '/favicon.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/favicon.jpg';
                        }}
                      />
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-neutral-200">
                      {product.name}
                    </span>
                  </div>
                  <span className="font-medium text-slate-700 dark:text-neutral-300 shrink-0">
                    x{quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-neutral-900 dark:bg-neutral-950/20">
            <h3 className="flex items-center justify-between font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-neutral-900 pb-4">
              <span>Resumen del pedido</span>
              <span className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
              </span>
            </h3>
            <div className="space-y-3.5 py-4 border-b border-slate-200 dark:border-neutral-900 text-sm font-medium text-slate-700 dark:text-neutral-300">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})</span>
                <span className="text-slate-800 dark:text-neutral-200 font-medium">
                  ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>IVA (15%)</span>
                <span className="text-slate-800 dark:text-neutral-200 font-medium">
                  ${taxes.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Envío estándar</span>
                <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold">
                  $0.00
                  <span className="bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold">
                    Gratis
                  </span>
                </span>
              </div>
            </div>
            <div className="py-4 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Total</span>
              <div className="text-right">
                <span className="text-sm font-semibold text-teal-600 dark:text-teal-400 block leading-none">
                  ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-neutral-400 mt-0.5 inline-block">
                  USD
                </span>
              </div>
            </div>
            <button
               type="button"
               onClick={handleOpenCheckout}
               className="flex w-full items-center justify-center gap-2 rounded-lg border border-teal-500 text-teal-600 bg-transparent hover:bg-teal-500 hover:text-white dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-400 dark:hover:text-neutral-955 font-bold px-6 py-3 transition mt-2 text-sm cursor-pointer"
             >
               <CreditCard className="h-4.5 w-4.5" />
               Completar Datos de Envío y Pagar
             </button>
          </div>
        </div>
      </div>
      <Modal
        open={isCheckoutOpen}
        title="Datos de Envío y Pago"
        onClose={() => setIsCheckoutOpen(false)}
      >
        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          <p className="text-sm font-medium text-slate-700 dark:text-neutral-300">
            Ingresa la dirección de envío para completar tu pedido y proceder al método de pago seguro con Stripe.
          </p>
          {checkoutError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-red-500 text-xs font-semibold">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
              <span>{checkoutError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormInput
                label="Nombre Completo del Destinatario"
                placeholder="Ej: Juan Pérez"
                value={fullName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFullName(val);
                  validateField('fullName', val);
                }}
                error={errors.fullName}
                disabled={loadingCheckout}
                required
              />
            </div>
            <div>
              <FormInput
                label="Correo de Contacto"
                placeholder="Ej: correo@ejemplo.com"
                value={email}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  validateField('email', val);
                }}
                error={errors.email}
                disabled={loadingCheckout}
                required
              />
            </div>
            <div>
              <FormInput
                label="Teléfono de Contacto"
                placeholder="Ej: 0998877665"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value;
                  setPhone(val);
                  validateField('phone', val);
                }}
                error={errors.phone}
                disabled={loadingCheckout}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <FormInput
                label="Calle y Número"
                placeholder="Ej: Av. Amazonas N32-12 y Mariana de Jesús, Piso 3"
                value={street}
                onChange={(e) => {
                  const val = e.target.value;
                  setStreet(val);
                  validateField('street', val);
                }}
                error={errors.street}
                disabled={loadingCheckout}
                required
              />
            </div>
            <div>
              <label className="block">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Estado / Provincia
                </span>
                <span className="mt-1.5 flex h-12 items-center rounded-lg border bg-white px-3.5 text-slate-700 transition focus-within:ring-2 dark:bg-neutral-950/50 dark:text-white border-slate-300 focus-within:border-teal-500 focus-within:ring-teal-400/20 dark:border-neutral-700 dark:focus-within:border-teal-400">
                  <select
                    value={stateName}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    disabled={loadingCheckout}
                    className="h-full w-full border-0 bg-transparent px-4 text-sm font-medium text-slate-900 outline-none dark:text-white dark:bg-neutral-950"
                  >
                    {Object.keys(ECUADOR_PROVINCES).map((prov) => (
                      <option key={prov} value={prov} className="dark:bg-neutral-950 dark:text-white">
                        {prov}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </div>
            <div>
              <label className="block">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Ciudad
                </span>
                <span className="mt-1.5 flex h-12 items-center rounded-lg border bg-white px-3.5 text-slate-700 transition focus-within:ring-2 dark:bg-neutral-950/50 dark:text-white border-slate-300 focus-within:border-teal-500 focus-within:ring-teal-400/20 dark:border-neutral-700 dark:focus-within:border-teal-400">
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={loadingCheckout}
                    className="h-full w-full border-0 bg-transparent px-4 text-sm font-medium text-slate-900 outline-none dark:text-white dark:bg-neutral-950"
                  >
                    {(ECUADOR_PROVINCES[stateName] || []).map((c) => (
                      <option key={c} value={c} className="dark:bg-neutral-950 dark:text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </div>
            <div>
              <FormInput
                label="Código Postal"
                placeholder="Ej: 170504"
                value={postalCode}
                onChange={(e) => {
                  const val = e.target.value;
                  setPostalCode(val);
                  validateField('postalCode', val);
                }}
                error={errors.postalCode}
                disabled={loadingCheckout}
                required
              />
            </div>
            <div>
              <label className="block">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  País
                </span>
                <div className="mt-1.5 flex h-12 items-center rounded-lg border bg-slate-50 dark:bg-neutral-900/40 px-3.5 text-slate-500 dark:text-neutral-400 border-slate-300 dark:border-neutral-700 text-sm font-medium select-none cursor-not-allowed">
                  Ecuador
                </div>
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              disabled={loadingCheckout}
              className="border border-slate-300 hover:bg-slate-150 hover:text-slate-900 dark:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white font-semibold text-sm h-10 px-4 rounded-lg flex items-center justify-center transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loadingCheckout}
              className="border border-teal-500 text-teal-600 bg-transparent hover:bg-teal-500 hover:text-white dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-400 dark:hover:text-neutral-955 min-w-[140px] font-bold text-sm h-10 px-4 rounded-lg flex items-center justify-center transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingCheckout ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
              ) : (
                "Proceder al Pago con Stripe"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ComponenteDetalleDrawer
        componente={selectedProduct}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        showAddToCart={false}
      />
    </div>
    </>
  );
};