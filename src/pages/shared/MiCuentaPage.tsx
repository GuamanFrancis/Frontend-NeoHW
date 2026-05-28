import { useState } from 'react';
import { Save, User, Mail, Phone, ShieldCheck, Lock, MapPin, ShoppingBag, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { normalizeBackendUser } from '../../services/authService';
import { getStoredSession, updateStoredSession } from '../../services/session';
import { updateUser } from '../../services/usersService';
import { ComponenteDetalleDrawer } from '../cliente/ComponenteDetalleDrawer';
import { createStripeSession } from '../../services/paymentsService';
import type { CatalogComponent } from '../../types/catalog';

interface OrderItemLocal {
  product: {
    id?: string;
    name: string;
    imageUrl?: string;
  };
  quantity: number;
  priceAtTime: number;
}

interface OrderLocal {
  id: string;
  totalAmount: number;
  status: 'PENDING_PAYMENT' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  items: OrderItemLocal[];
}

export const MiCuentaPage = () => {
  const session = getStoredSession();
  const userId = session?.user.id;
  const addressKey = userId ? `shipping_address_${userId}` : null;

  const savedAddress = (() => {
    if (!addressKey) return {};
    try {
      return JSON.parse(localStorage.getItem(addressKey) || '{}');
    } catch {
      return {};
    }
  })();

  const [firstName, setFirstName] = useState(session?.user.firstName ?? '');
  const [activeTab] = useState<'profile' | 'orders'>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('tab') as 'profile' | 'orders') || 'profile';
  });
  const [lastName, setLastName] = useState(session?.user.lastName ?? '');
  const [phone, setPhone] = useState(session?.user.phone ?? '');
  const [street, setStreet] = useState<string>(savedAddress.street ?? '');
  const [city, setCity] = useState<string>(savedAddress.city ?? '');
  const [stateName, setStateName] = useState<string>(savedAddress.state ?? '');
  const [postalCode, setPostalCode] = useState<string>(savedAddress.postalCode ?? '');
  const [country, setCountry] = useState<string>(savedAddress.country ?? 'Ecuador');
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const getInitials = (first: string, last: string) => {
    const f = first.trim().charAt(0).toUpperCase();
    const l = last.trim().charAt(0).toUpperCase();
    return `${f}${l}` || 'U';
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'vendedor':
        return 'Vendedor';
      case 'cliente':
      default:
        return 'Cliente';
    }
  };

  const saveProfile = async () => {
    if (!session) {
      setFormError('Debes iniciar sesion para actualizar tu perfil.');
      return;
    }

    try {
      setIsSaving(true);
      setFormError('');
      setFormMessage('');

      const updatedUser = await updateUser('me', {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      updateStoredSession({
        accessToken: session.accessToken,
        user: normalizeBackendUser(updatedUser),
      });

      if (addressKey) {
        localStorage.setItem(addressKey, JSON.stringify({
          street: street.trim(),
          city: city.trim(),
          state: stateName.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
        }));
      }

      setFormMessage('Perfil actualizado correctamente.');
    } catch {
      setFormError('No se pudo actualizar el perfil. Verifica tu sesion e intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-16 text-slate-800 dark:text-neutral-100">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 relative overflow-hidden shadow-xl dark:border-neutral-900 dark:bg-neutral-950">
        <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute right-0 top-0 border-t-2 border-r-2 border-teal-500/30 w-16 h-16 rounded-tr-2xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mi cuenta</h1>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1 font-medium">Revisa y actualiza tu informacion personal.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2.2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-xl min-h-[460px] dark:border-neutral-900 dark:bg-neutral-950">
          <div className="absolute top-0 inset-x-0 h-[120px] bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />
          
          <div className="flex flex-col items-center mt-6">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-3xl font-bold text-slate-800 shadow-lg shadow-black/5 ring-4 ring-teal-500/25 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white dark:shadow-black/40">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500/10 to-transparent pointer-events-none animate-pulse" />
              {getInitials(firstName, lastName)}
            </div>
            
            <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Usuario'}
            </h2>
            
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-teal-500/25 bg-teal-500/10 px-4 py-1.5 text-xs font-bold text-teal-600 dark:text-teal-400">
              <User className="h-3.5 w-3.5" />
              {getRoleLabel(session?.user.role ?? 'cliente')}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 w-full flex items-center justify-center gap-3 text-left dark:border-neutral-900/65">
            <ShieldCheck className="h-5 w-5 text-teal-650 dark:text-teal-400 shrink-0" />
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium leading-relaxed">
              Manten tu informacion actualizada para una mejor experiencia en NeoHW.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xl dark:border-neutral-900 dark:bg-neutral-950">

          {activeTab === 'profile' ? (
            <>
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3 dark:border-neutral-900/60">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Informacion personal</h3>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Tus datos personales visibles en tu perfil.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                      label="Nombre"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Sic"
                    />
                    <FormInput
                      label="Apellido"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Perez"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3 dark:border-neutral-900/60">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Datos de contacto</h3>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Usamos esta informacion para comunicarte sobre tu cuenta y pedidos.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                      label="Telefono"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="0999999999"
                      icon={<Phone className="h-4 w-4 text-teal-650 mr-1 shrink-0 dark:text-teal-500/80" />}
                    />
                    <FormInput
                      label="Correo electronico"
                      value={session?.user.email ?? ''}
                      disabled
                      placeholder="usuario@correo.com"
                      icon={<Mail className="h-4 w-4 text-teal-650 mr-1 shrink-0 dark:text-teal-500/80" />}
                      className="cursor-not-allowed opacity-60"
                    />
                  </div>
                </div>

                {session?.user.role === 'cliente' && (
                  <div>
                    <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3 dark:border-neutral-900/60">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <MapPin className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Dirección de envío predeterminada</h3>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Esta dirección se usará para autocompletar tus compras.</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <FormInput
                          label="Calle y Número"
                          value={street}
                          onChange={(event) => setStreet(event.target.value)}
                          placeholder="Ej: Av. Amazonas N32-15 y La Niña"
                        />
                      </div>
                      <FormInput
                        label="Ciudad"
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        placeholder="Ej: Quito / Guayaquil / Cuenca"
                      />
                      <FormInput
                        label="Estado / Provincia"
                        value={stateName}
                        onChange={(event) => setStateName(event.target.value)}
                        placeholder="Ej: Pichincha / Guayas / Azuay"
                      />
                      <FormInput
                        label="Código Postal"
                        value={postalCode}
                        onChange={(event) => setPostalCode(event.target.value)}
                        placeholder="Ej: 170518"
                      />
                      <FormInput
                        label="País"
                        value={country}
                        onChange={(event) => setCountry(event.target.value)}
                        placeholder="Ej: Ecuador"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4 dark:border-neutral-900/60">
                {(formMessage || formError) && (
                  <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                    formError
                      ? 'border-red-500/20 bg-red-500/10 text-red-400'
                      : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-450 dark:text-emerald-400'
                  }`}
                  >
                    {formError || formMessage}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold dark:text-neutral-400">
                    <Lock className="h-4 w-4 text-teal-600 shrink-0 dark:text-teal-400" />
                    <span>Tu informacion esta segura con nosotros. No compartimos tus datos con terceros.</span>
                  </div>
                  
                  <Button 
                    type="button" 
                    onClick={() => void saveProfile()} 
                    disabled={isSaving}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold border-0 shrink-0 h-11 px-7 shadow-lg shadow-teal-500/20 dark:text-neutral-950"
                  >
                    <Save className="h-4.5 w-4.5 shrink-0" />
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col mt-2">
              <ClientOrdersList />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ClientOrdersList = () => {
  const session = getStoredSession();
  const userId = session?.user.id;
  const ordersKey = userId ? `client_orders_${userId}` : '';

  const [orders] = useState<OrderLocal[]>(() => {
    if (!ordersKey) return [];
    try {
      return JSON.parse(localStorage.getItem(ordersKey) || '[]');
    } catch {
      return [];
    }
  });

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogComponent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const handleOpenDetail = (product: { id?: string; name: string; imageUrl?: string; priceAtTime?: number }) => {
    const catalogComp: CatalogComponent = {
      id: product.id || '',
      name: product.name || '',
      imageUrl: product.imageUrl || '',
      price: product.priceAtTime || 0,
      category: '',
      brand: '',
      status: 'disponible',
      stock: 99,
      description: '',
      attributes: [],
      categorySlug: '',
      categoryId: '',
      model: '',
      sku: '',
      sellerId: ''
    };
    setSelectedProduct(catalogComp);
    setIsDetailOpen(true);
  };

  const handlePayOrder = async (orderId: string) => {
    setPayingOrderId(orderId);
    try {
      const sessionData = await createStripeSession(orderId);
      if (sessionData.url) {
        window.location.href = sessionData.url;
      } else {
        alert('No se pudo iniciar el pago. Reintente más tarde.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de Stripe.');
    } finally {
      setPayingOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return (
          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded text-[10px] uppercase font-black">
            Pendiente de Pago
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="bg-teal-500/10 text-teal-400 border border-teal-500/25 px-2 py-0.5 rounded text-[10px] uppercase font-black">
            Procesando Pago
          </span>
        );
      default:
        return (
          <span className="bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded text-[10px] uppercase font-black">
            {status}
          </span>
        );
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 dark:border-neutral-900 dark:bg-neutral-950/20">
        <ShoppingBag className="h-12 w-12 text-slate-400 dark:text-neutral-700 mb-3" />
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">No tienes pedidos registrados</h4>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-xs leading-relaxed">
          Los pedidos que realices desde el carrito se guardarán automáticamente aquí para que puedas hacer seguimiento y pagar de forma segura.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-neutral-900 dark:bg-neutral-950">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:border-neutral-900 dark:text-neutral-500">
              <th className="py-3 px-4">Pedido ID</th>
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const isPaying = payingOrderId === order.id;
              const dateStr = new Date(order.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <>
                  <tr key={order.id} className="hover:bg-slate-55/40 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-700 select-all dark:text-neutral-300" title={order.id}>
                          #{order.id.slice(0, 8)}...
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(order.id);
                          }}
                          className="text-slate-400 hover:text-slate-600 transition dark:text-neutral-500 dark:hover:text-neutral-300"
                          title="Copiar ID completo"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold dark:text-neutral-400">{dateStr}</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap dark:text-white">
                      ${Number(order.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3.5 px-4 min-w-[120px]">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === 'PENDING_PAYMENT' && (
                          <Button
                            type="button"
                            disabled={isPaying}
                            onClick={() => handlePayOrder(order.id)}
                            className="bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold h-7 px-3 text-[10px] uppercase border-0"
                          >
                            {isPaying ? '...' : 'Pagar'}
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleExpand(order.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition dark:border-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:border-neutral-800"
                          title={isExpanded ? 'Ocultar detalles' : 'Ver productos'}
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${order.id}-details`} className="bg-slate-50/50 dark:bg-neutral-950/40">
                  <td colSpan={5} className="py-3.5 px-6">
                        <div className="space-y-2.5">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 dark:text-neutral-500">
                            Artículos en este pedido:
                          </p>
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div
                                className="flex items-center gap-2 cursor-pointer hover:text-teal-650 transition dark:hover:text-teal-400"
                                onClick={() => handleOpenDetail({ ...item.product, priceAtTime: item.priceAtTime })}
                              >
                                {item.product.imageUrl && (
                                  <div className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 bg-slate-50 p-0.5 dark:border-neutral-850 dark:bg-neutral-900">
                                    <img
                                      src={item.product.imageUrl}
                                      alt={item.product.name}
                                      className="max-h-full max-w-full object-contain"
                                    />
                                  </div>
                                )}
                                <span className="font-semibold text-slate-700 hover:underline dark:text-neutral-300">
                                  {item.product.name}
                                </span>
                              </div>
                              <span className="font-bold text-slate-500 dark:text-neutral-400">
                                x{item.quantity} • ${Number(item.priceAtTime).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <ComponenteDetalleDrawer
        componente={selectedProduct}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        showAddToCart={false}
      />
    </div>
  );
};
