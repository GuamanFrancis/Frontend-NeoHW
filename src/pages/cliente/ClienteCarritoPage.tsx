import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Trash2,
  Lock,
  ShoppingCart,
  Plus,
  Minus,
  AlertTriangle
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { createOrderFromCart } from '../../services/ordersService';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
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
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    taxes,
    total,
    itemCount,
  } = useCart();

  const [wishlistedIds, setWishlistedIds] = useState<Record<string, boolean>>({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Ecuador');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

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

  const toggleWishlist = (id: string) => {
    setWishlistedIds((prev) => ({ ...prev, [id]: !prev[id] }));
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
    if (!street.trim() || !city.trim() || !stateName.trim() || !postalCode.trim() || !fullName.trim() || !email.trim() || !phone.trim()) {
      setCheckoutError('Por favor complete todos los campos obligatorios del formulario.');
      return;
    }
    setLoadingCheckout(true);
    setCheckoutError(null);
    try {
      const payload = {
        shippingAddress: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          street: street.trim(),
          city: city.trim(),
          state: stateName.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
        },
      };
      const response = await createOrderFromCart(payload);

      const session = getStoredSession();
      const userId = session?.user.id;
      if (userId) {
        localStorage.setItem(`shipping_address_${userId}`, JSON.stringify(payload.shippingAddress));
        try {
          const ordersKey = `client_orders_${userId}`;
          const storedOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
          const newOrder = {
            id: response.orderId,
            totalAmount: response.totalAmount,
            status: 'PENDING_PAYMENT',
            createdAt: new Date().toISOString(),
            items: cartItems.map((item) => ({
              product: {
                id: item.product.id,
                name: item.product.name,
                imageUrl: item.product.imageUrl || undefined,
              },
              quantity: item.quantity,
              priceAtTime: item.product.price,
            })),
            shippingAddress: {
              street: payload.shippingAddress.street,
              city: payload.shippingAddress.city,
              state: payload.shippingAddress.state,
              postalCode: payload.shippingAddress.postalCode,
              country: payload.shippingAddress.country,
              fullName: payload.shippingAddress.fullName,
              email: payload.shippingAddress.email,
              phone: payload.shippingAddress.phone,
            },
            documents: [],
          };
          storedOrders.unshift(newOrder);
          localStorage.setItem(ordersKey, JSON.stringify(storedOrders));
        } catch (e) {
          console.error(e);
        }
      }

      const stripeRes = await createStripeSession(response.orderId);
      await clearCart(true);
      if (stripeRes && stripeRes.url) {
        window.location.href = stripeRes.url;
      } else {
        setCheckoutError('Error al iniciar la pasarela de Stripe.');
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
      <div className="mx-auto max-w-7xl pb-16 text-slate-900 dark:text-neutral-100">
        <div className="mb-8 border-b border-slate-100 dark:border-neutral-900 pb-6">
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white leading-none">
            Gestionar carrito de compras
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2 font-medium">
            Revisa los productos que agregaste, actualiza cantidades y continúa para finalizar tu compra.
          </p>
        </div>
        <div className="flex h-96 flex-col items-center justify-between rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-white/50 p-8 text-center dark:bg-neutral-900/10 max-w-2xl mx-auto py-16">
          <ShoppingCart className="h-16 w-16 text-slate-300 dark:text-neutral-700" />
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">Tu carrito está vacío</h3>
            <p className="text-sm text-slate-400 dark:text-neutral-500 mt-2 max-w-md">
              Aún no has agregado ningún componente a tu carrito. Explora nuestro catálogo de hardware para comenzar a armar tu PC.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/cliente/catalogo')}
            className="flex items-center justify-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold px-6 py-3 transition shadow-sm mt-6 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Explorar catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl pb-16 text-slate-900 dark:text-neutral-100">
      <div className="mb-6 border-b border-slate-100 dark:border-neutral-900 pb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white leading-none">
          Gestionar carrito de compras
        </h1>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2 font-medium">
          Revisa los productos que agregaste, actualiza cantidades y continúa para finalizar tu compra.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white dark:border-neutral-900 dark:bg-neutral-950/20 shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-900 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                  <th className="py-4 px-4">Producto</th>
                  <th className="py-4 px-4 text-right">Precio unitario</th>
                  <th className="py-4 px-4 text-center">Cantidad</th>
                  <th className="py-4 px-4 text-center">Disponibilidad</th>
                  <th className="py-4 px-4 text-right">Subtotal</th>
                  <th className="py-4 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-neutral-900">
                {cartItems.map(({ product, quantity }) => {
                  const itemSubtotal = product.price * quantity;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-16 w-16 shrink-0 flex items-center justify-center rounded-lg border border-slate-100 bg-slate-50 dark:border-neutral-900 dark:bg-neutral-900/50 p-1.5 cursor-pointer hover:opacity-80 transition"
                            onClick={() => handleOpenDetail(product)}
                            title="Ver detalles"
                          >
                            <img
                              src={product.imageUrl || ''}
                              alt={product.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4
                              className="font-extrabold text-slate-900 dark:text-white truncate max-w-[200px] cursor-pointer hover:text-teal-500 hover:underline transition"
                              title={product.name}
                              onClick={() => handleOpenDetail(product)}
                            >
                              {product.name}
                            </h4>
                            <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-bold mt-0.5 uppercase tracking-wider">
                              {product.category} • {product.brand}
                            </div>
                            {product.sku && (
                              <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium mt-1">
                                SKU: {product.sku}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-slate-800 dark:text-neutral-200 whitespace-nowrap">
                        <div>${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-[9px] text-slate-400 dark:text-neutral-500 font-medium mt-0.5">USD</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center">
                          <div className="flex items-center rounded-lg border border-slate-200 dark:border-neutral-850 overflow-hidden bg-slate-50 dark:bg-neutral-900 h-9 p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              disabled={quantity <= 1}
                              className="flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-9 text-center font-extrabold text-xs text-slate-800 dark:text-neutral-100">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              disabled={quantity >= product.stock}
                              className="flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className={`h-1.5 w-1.5 rounded-full fill-current bg-current ${statusColors[product.status]}`} />
                            <span className={statusColors[product.status]}>{statusLabels[product.status]}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">
                            Stock: {product.stock}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                        <div>${itemSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-[9px] text-slate-400 dark:text-neutral-500 font-medium mt-0.5">USD</div>
                      </td>
                      <td className="py-4 px-4 min-w-[80px]">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggleWishlist(product.id)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${
                              wishlistedIds[product.id]
                                ? 'text-rose-500'
                                : 'text-slate-400 hover:text-slate-600 dark:text-neutral-500'
                            }`}
                            aria-label="Añadir a deseos"
                          >
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 dark:text-neutral-500 dark:hover:bg-rose-950/20 transition"
                            aria-label="Quitar del carrito"
                          >
                            <Trash2 className="h-4 w-4" />
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
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-neutral-850 px-5 py-2.5 text-xs font-bold hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-900 dark:text-neutral-200 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Seguir comprando
            </button>
            <button
              type="button"
              onClick={() => clearCart()}
              className="flex items-center justify-center gap-2 rounded-lg border border-rose-500/30 text-rose-500 dark:border-rose-500/20 dark:hover:bg-rose-950/10 px-5 py-2.5 text-xs font-bold hover:bg-rose-50 transition"
            >
              <Trash2 className="h-4 w-4" />
              Vaciar carrito
            </button>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-neutral-900 dark:bg-neutral-950/20">
            <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider border-b border-slate-100 dark:border-neutral-900 pb-3">
              Resumen antes de confirmar compra
            </h3>
            <div className="mt-4 space-y-3">
              {cartItems.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between gap-3 text-xs">
                  <div
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:text-teal-500 transition group"
                    onClick={() => handleOpenDetail(product)}
                    title="Ver detalles"
                  >
                    <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded border border-slate-100 bg-slate-50 dark:border-neutral-900 p-0.5 group-hover:opacity-85 transition">
                      <img
                        src={product.imageUrl || ''}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-neutral-300 truncate max-w-[180px] group-hover:underline">
                      {product.name}
                    </span>
                  </div>
                  <span className="font-extrabold text-slate-400 dark:text-neutral-500 shrink-0">
                    x{quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-neutral-900 dark:bg-neutral-950/20">
            <h3 className="flex items-center justify-between font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-neutral-900 pb-4">
              <span>Resumen del pedido</span>
              <span className="text-xs font-bold text-slate-400 dark:text-neutral-500">
                {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
              </span>
            </h3>
            <div className="space-y-3.5 py-4 border-b border-slate-100 dark:border-neutral-900 text-xs font-semibold text-slate-500 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})</span>
                <span className="text-slate-900 dark:text-neutral-200">
                  ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Envío estándar</span>
                <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                  $0.00
                  <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded text-[10px] uppercase font-black">
                    Gratis
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>Impuestos (IVA 15%)</span>
                <span className="text-slate-900 dark:text-neutral-200">
                  ${taxes.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="py-4 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-800 dark:text-neutral-300">Total</span>
              <div className="text-right">
                <span className="text-2xl font-black text-teal-500 dark:text-teal-400 block leading-none">
                  ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 mt-1 inline-block">
                  USD
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenCheckout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-extrabold px-6 py-3.5 shadow transition mt-2 text-sm"
            >
              <Lock className="h-4 w-4" />
              Completar Datos de Envío y Pagar
              <span className="font-light ml-1">→</span>
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-neutral-500 font-bold mt-4">
              <Lock className="h-3 w-3" />
              <span>Pago 100% seguro y cifrado</span>
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={isCheckoutOpen}
        title="Datos de Envío y Pago"
        onClose={() => setIsCheckoutOpen(false)}
      >
        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Ingresa la dirección de envío para completar tu pedido y proceder a la pasarela de pago seguro con Stripe.
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
                placeholder="Ej: Francis Guaman"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loadingCheckout}
                required
              />
            </div>
            <div>
              <FormInput
                label="Correo de Contacto"
                placeholder="Ej: correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loadingCheckout}
                required
              />
            </div>
            <div>
              <FormInput
                label="Teléfono de Contacto"
                placeholder="Ej: 0998877665"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loadingCheckout}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <FormInput
                label="Calle y Número"
                placeholder="Ej: Av. Amazonas N32-12 y Mariana de Jesús, Piso 3"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                disabled={loadingCheckout}
                required
              />
            </div>
            <div>
              <label className="block">
                <span className="text-sm font-semibold text-slate-950 dark:text-white">
                  Estado / Provincia
                </span>
                <span className="mt-1.5 flex h-12 items-center rounded-lg border bg-white px-3.5 text-slate-500 transition focus-within:ring-2 dark:bg-neutral-950/50 dark:text-neutral-300 border-slate-300 focus-within:border-teal-500 focus-within:ring-teal-400/20 dark:border-neutral-700 dark:focus-within:border-teal-400">
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
                <span className="text-sm font-semibold text-slate-950 dark:text-white">
                  Ciudad
                </span>
                <span className="mt-1.5 flex h-12 items-center rounded-lg border bg-white px-3.5 text-slate-500 transition focus-within:ring-2 dark:bg-neutral-950/50 dark:text-neutral-300 border-slate-300 focus-within:border-teal-500 focus-within:ring-teal-400/20 dark:border-neutral-700 dark:focus-within:border-teal-400">
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
                onChange={(e) => setPostalCode(e.target.value)}
                disabled={loadingCheckout}
                required
              />
            </div>
            <div>
              <label className="block">
                <span className="text-sm font-semibold text-slate-950 dark:text-white">
                  País
                </span>
                <span className="mt-1.5 flex h-12 items-center rounded-lg border bg-white px-3.5 text-slate-500 dark:bg-neutral-950/50 dark:text-neutral-300 border-slate-300 dark:border-neutral-700">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled
                    className="h-full w-full border-0 bg-transparent px-4 text-sm font-medium text-slate-900 outline-none dark:text-white dark:bg-neutral-950"
                  >
                    <option value="Ecuador" className="dark:bg-neutral-950 dark:text-white">Ecuador</option>
                  </select>
                </span>
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-neutral-900">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCheckoutOpen(false)}
              disabled={loadingCheckout}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loadingCheckout}
              className="bg-teal-500 hover:bg-teal-600 text-white min-w-[140px]"
            >
              {loadingCheckout ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Proceder al Pago con Stripe"
              )}
            </Button>
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
  );
};