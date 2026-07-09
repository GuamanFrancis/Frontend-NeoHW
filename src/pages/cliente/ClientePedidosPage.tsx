import { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin,
  Copy,
  Info,
  Eye,
  Trash2
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { getStoredSession } from '../../services/session';
import { createStripeSession } from '../../services/paymentsService';
import { getMyOrders, updateOrderStatus } from '../../services/ordersService';
import { ComponenteDetalleDrawer } from './ComponenteDetalleDrawer';
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

interface OrderDocumentLocal {
  id: string;
  documentType: 'SHIPPING_PROOF' | 'DELIVERY_PHOTO' | 'CUSTOMER_SIGNATURE';
  fileUrl: string;
  createdAt: string;
}

interface OrderLocal {
  id: string;
  trackingCode?: string | null;
  subtotal?: number;
  taxAmount?: number;
  totalAmount: number;
  status: 'PENDING_PAYMENT' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  items: OrderItemLocal[];
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  documents?: OrderDocumentLocal[];
}

export const ClientePedidosPage = () => {
  const session = getStoredSession();
  const userId = session?.user.id;

  const [allOrders, setAllOrders] = useState<OrderLocal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const [selectedOrder, setSelectedOrder] = useState<OrderLocal | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogComponent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [orderIdToCancel, setOrderIdToCancel] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const res = await getMyOrders();
      const apiOrders: OrderLocal[] = res.data.map((order) => {
        let addressParsed = undefined;
        if (order.shippingAddress) {
          if (typeof order.shippingAddress === 'string') {
            try {
              addressParsed = JSON.parse(order.shippingAddress);
            } catch {}
          } else {
            addressParsed = order.shippingAddress;
          }
        }
        return {
          id: order.id,
          trackingCode: order.trackingCode,
          subtotal: order.subtotal ? (typeof order.subtotal === 'string' ? parseFloat(order.subtotal) : order.subtotal) : undefined,
          taxAmount: order.taxAmount ? (typeof order.taxAmount === 'string' ? parseFloat(order.taxAmount) : order.taxAmount) : undefined,
          totalAmount: typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            product: {
              id: item.productId,
              name: item.product.name,
              imageUrl: item.product.imageUrl || undefined,
            },
            quantity: item.quantity,
            priceAtTime: typeof item.priceAtTime === 'string' ? parseFloat(item.priceAtTime) : item.priceAtTime,
          })),
          shippingAddress: addressParsed ? {
            street: addressParsed.street || '',
            city: addressParsed.city || '',
            state: addressParsed.state || '',
            postalCode: addressParsed.postalCode || '',
            country: addressParsed.country || '',
            fullName: addressParsed.fullName || (order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : undefined),
            email: addressParsed.email || order.user?.email || undefined,
            phone: addressParsed.phone || order.user?.phone || undefined,
          } : undefined,
          documents: order.documents,
        };
      });
      setAllOrders(apiOrders);
    } catch (e) {
      console.error(e);
      setAllOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [userId]);

  const filteredOrders = useMemo(() => {
    let result = [...allOrders];
    if (statusFilter !== 'ALL') {
      result = result.filter(o => o.status === statusFilter);
    }
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(o => new Date(o.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.createdAt) <= end);
    }
    return result;
  }, [allOrders, statusFilter, startDate, endDate]);

  const displayedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePayOrder = async (orderId: string) => {
    setPayingOrderId(orderId);
    try {
      const sessionData = await createStripeSession(orderId);
      if (sessionData.url) {
        window.location.replace(sessionData.url);
      } else {
        alert('No se pudo iniciar el pago con Stripe. Reintente más tarde.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al iniciar el pago con Stripe.');
    } finally {
      setPayingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, 'CANCELLED');
      alert('Pedido cancelado exitosamente.');
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      console.error(err);
      alert('Para procesar la cancelación de tu pedido, por favor comunícate con un asesor de ventas o el soporte técnico de NeoHW.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleOpenProductDetail = (product: { id?: string; name: string; imageUrl?: string; priceAtTime?: number }) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return (
          <span className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-xs">
            Pendiente de Pago
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider text-xs">
            Pendiente de Envío
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider text-xs">
            En Camino
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-xs">
            Entregado
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-xs">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="text-slate-955 dark:text-white font-bold uppercase tracking-wider text-xs">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };  return (
    <div className="w-full pb-16 text-slate-900 dark:text-neutral-100 pt-2">
      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Left Column: Filters (Sidebar style) */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-900 dark:bg-neutral-950/20">
            <div className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-wider text-slate-955 dark:text-white">
              <Filter className="h-4 w-4 text-teal-500" />
              <span>Filtros de búsqueda</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-955 dark:text-white mb-1.5 uppercase">
                  Estado del pedido
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-neutral-850 dark:bg-neutral-900 text-sm font-semibold text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="PENDING_PAYMENT">Pendiente de Pago</option>
                  <option value="PROCESSING">Procesando</option>
                  <option value="SHIPPED">Enviado</option>
                  <option value="DELIVERED">Entregado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-955 dark:text-white mb-1.5 uppercase">
                  Desde (Fecha inicio)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-neutral-850 dark:bg-neutral-900 text-sm font-semibold text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-955 dark:text-white mb-1.5 uppercase">
                  Hasta (Fecha fin)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-neutral-850 dark:bg-neutral-900 text-sm font-semibold text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-lg border border-slate-955 dark:border-neutral-700 bg-transparent text-slate-955 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 font-bold px-4 py-2 transition shadow-sm text-sm cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Orders list or state view */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-slate-200 rounded-xl bg-white dark:border-neutral-900 dark:bg-neutral-950/20 animate-pulse">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent mb-4" />
              <h3 className="text-sm font-bold text-slate-955 dark:text-white">Cargando tu historial de pedidos...</h3>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 rounded-xl bg-white dark:border-neutral-900 dark:bg-neutral-950/20">
              <ShoppingBag className="h-16 w-16 text-teal-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-955 dark:text-white">No se encontraron pedidos</h3>
              <p className="text-base text-slate-955 dark:text-white mt-2 max-w-sm leading-relaxed">
                Intenta cambiar los filtros seleccionados o realiza una compra en el catálogo para generar tu primera orden.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-neutral-900 dark:bg-neutral-950">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-sm font-bold text-slate-900 uppercase tracking-wider dark:border-neutral-900 dark:text-white">
                      <th className="py-3 px-4">ID Pedido</th>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Componentes</th>
                      <th className="py-3 px-4 text-right">Total a pagar</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
                    {displayedOrders.map((order) => {
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap dark:text-white text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-900 dark:text-white select-all font-bold">
                                {order.trackingCode ? order.trackingCode : `#${order.id.slice(0, 8)}...`}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyId(order.trackingCode || order.id)}
                                className="text-slate-900 hover:text-teal-500 transition dark:text-white dark:hover:text-teal-400"
                                title={order.trackingCode ? "Copiar código de rastreo" : "Copiar ID de pedido"}
                              >
                                {copiedId === (order.trackingCode || order.id) ? (
                                  <span className="text-[10px] text-teal-500 font-bold">¡Copiado!</span>
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-900 font-semibold dark:text-white whitespace-nowrap text-sm">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-slate-900 font-semibold dark:text-white min-w-[250px]">
                            <div className="flex flex-col gap-1.5 py-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="text-sm font-semibold leading-relaxed text-slate-900 dark:text-white">
                                  • {item.product.name} <span className="text-slate-900 dark:text-white font-medium ml-1"> - Cantidad: {item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap dark:text-white text-sm">
                            ${order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-3">
                              {order.status === 'PENDING_PAYMENT' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={payingOrderId === order.id}
                                    onClick={() => handlePayOrder(order.id)}
                                    className="h-9 px-4 rounded-lg border border-slate-955 dark:border-neutral-700 bg-transparent text-slate-955 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 font-bold text-xs uppercase transition shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
                                  >
                                    {payingOrderId === order.id ? 'Cargando...' : 'Pagar'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={cancellingOrderId === order.id}
                                    onClick={() => setOrderIdToCancel(order.id)}
                                    className="h-9 px-3 rounded-lg border border-slate-955 dark:border-neutral-700 bg-transparent text-slate-955 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 font-bold text-xs uppercase flex items-center gap-1 transition shadow-sm cursor-pointer disabled:opacity-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Cancelar
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="h-9 px-3 rounded-lg border border-slate-955 dark:border-neutral-700 bg-transparent text-slate-955 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 font-bold text-xs flex items-center gap-1 transition shadow-sm cursor-pointer whitespace-nowrap"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Detalle
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination block */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-sm text-slate-955 dark:text-white font-semibold">
                    Mostrando página {currentPage} de {totalPages} ({filteredOrders.length} pedidos en total)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-9 px-3 rounded-lg border border-slate-955 dark:border-neutral-700 bg-transparent text-slate-955 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 font-bold text-xs flex items-center gap-1 transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-9 px-3 rounded-lg border border-slate-955 dark:border-neutral-700 bg-transparent text-slate-955 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 font-bold text-xs flex items-center gap-1 transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Order Detail Modal */}
      <Modal
        open={!!selectedOrder}
        title="Detalles del Pedido"
        onClose={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            <div className="border-b border-slate-100 dark:border-neutral-900 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  {selectedOrder.trackingCode ? (
                    <div>
                      <span className="text-[10px] font-bold text-slate-955 dark:text-white uppercase tracking-wider block">
                        Código de Rastreo
                      </span>
                      <span className="font-mono text-base font-extrabold text-teal-600 dark:text-teal-400 select-all">
                        {selectedOrder.trackingCode}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] font-bold text-slate-955 dark:text-white uppercase tracking-wider block">
                        Código de Pedido
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-955 dark:text-white select-all">
                        {selectedOrder.id}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-955 dark:text-white font-semibold">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-slate-955 dark:text-white" />
                  {formatDate(selectedOrder.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4 text-slate-955 dark:text-white" />
                  Método: <span className="text-slate-955 dark:text-white">Stripe (Tarjeta de Crédito)</span>
                </span>
              </div>
            </div>

            {selectedOrder.shippingAddress && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-neutral-900/40 dark:bg-neutral-900/10">
                  <div className="flex items-center gap-2 mb-2 text-sm font-bold uppercase tracking-wider text-slate-955 dark:text-white">
                    <MapPin className="h-4 w-4 text-teal-500" />
                    <span>Dirección de envío</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-955 dark:text-white space-y-1">
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                    <p>C.P. {selectedOrder.shippingAddress.postalCode} • {selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-neutral-900/40 dark:bg-neutral-900/10">
                  <div className="flex items-center gap-2 mb-2 text-sm font-bold uppercase tracking-wider text-slate-955 dark:text-white">
                    <Info className="h-4 w-4 text-teal-500" />
                    <span>Información de Contacto</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-955 dark:text-white space-y-1">
                    <p><span className="font-bold text-slate-955 dark:text-white">Nombre: </span>{selectedOrder.shippingAddress.fullName || `${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`.trim() || 'No especificado'}</p>
                    <p><span className="font-bold text-slate-955 dark:text-white">Correo: </span>{selectedOrder.shippingAddress.email || session?.user?.email || 'No especificado'}</p>
                    <p><span className="font-bold text-slate-955 dark:text-white">Teléfono: </span>{selectedOrder.shippingAddress.phone || session?.user?.phone || 'No especificado'}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-955 dark:text-white mb-3">
                Componentes adquiridos
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-neutral-900 rounded-xl border border-slate-200 bg-white dark:border-neutral-900 dark:bg-neutral-950/20 px-4 py-2">
                {selectedOrder.items.map((item, idx) => {
                  const unitPrice = item.priceAtTime;
                  const subTotal = unitPrice * item.quantity;
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4">
                      <div
                        className="flex items-center gap-3 min-w-0 cursor-pointer group"
                        onClick={() => handleOpenProductDetail({ ...item.product, priceAtTime: item.priceAtTime })}
                        title="Ver ficha técnica"
                      >
                        <div className="h-14 w-14 shrink-0 flex items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                          <img
                            src={item.product.imageUrl || '/favicon.jpg'}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/favicon.jpg';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-955 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:underline">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-slate-955 dark:text-white mt-0.5 font-medium">
                            Precio unitario: ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-slate-955 dark:text-white block">
                          ${subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-slate-955 dark:text-white font-semibold block mt-0.5">
                          Cantidad: x{item.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedOrder.documents && selectedOrder.documents.length > 0 && (
              <div className="border-t border-slate-100 dark:border-neutral-900 pt-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-955 dark:text-white mb-3">
                  Documentos y Soportes del Envío
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedOrder.documents.map((doc) => {
                    const docNames = {
                      SHIPPING_PROOF: 'Prueba de Envío (Guía)',
                      DELIVERY_PHOTO: 'Foto de Entrega',
                      CUSTOMER_SIGNATURE: 'Firma de Recibido',
                    };
                    return (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-teal-500/30 transition text-sm font-bold text-slate-955 dark:border-neutral-850 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-850"
                      >
                        <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                        <span>{docNames[doc.documentType] || doc.documentType}</span>
                        <span className="text-xs text-slate-955 dark:text-white ml-auto font-semibold">Ver archivo ↗</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 dark:bg-neutral-900 dark:border-neutral-850 space-y-2">
              {selectedOrder.subtotal !== undefined && selectedOrder.taxAmount !== undefined && (
                <>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-neutral-300">
                    <span>Subtotal</span>
                    <span>${selectedOrder.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-neutral-300 pb-2 border-b border-slate-200 dark:border-neutral-850">
                    <span>IVA (15%)</span>
                    <span>${selectedOrder.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between pt-1">
                <div className="text-sm font-bold text-slate-955 dark:text-white uppercase tracking-wider">
                  Total del pedido
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 block leading-none">
                    ${selectedOrder.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-bold text-slate-955 dark:text-white mt-1 inline-block">
                    USD
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-neutral-900 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border border-slate-250 dark:border-neutral-800 px-4 py-2 text-xs font-bold text-slate-955 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 transition cursor-pointer"
              >
                Cerrar
              </button>
              {selectedOrder.status === 'PENDING_PAYMENT' && (
                <>
                  <button
                    type="button"
                    disabled={cancellingOrderId === selectedOrder.id}
                    onClick={() => setOrderIdToCancel(selectedOrder.id)}
                    className="rounded-lg border border-slate-955 dark:border-neutral-700 bg-transparent text-slate-955 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 font-bold px-4 py-2 transition text-xs shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {cancellingOrderId === selectedOrder.id ? 'Cancelando...' : 'Cancelar Pedido'}
                  </button>
                  <button
                    type="button"
                    disabled={payingOrderId === selectedOrder.id}
                    onClick={() => handlePayOrder(selectedOrder.id)}
                    className="rounded-lg border border-slate-955 dark:border-neutral-700 bg-transparent text-slate-955 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 font-bold px-4 py-2 transition text-xs shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    Pagar ahora con Stripe
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cancellation Confirmation Modal */}
      <Modal
        open={!!orderIdToCancel}
        title="Cancelar Pedido"
        onClose={() => setOrderIdToCancel(null)}
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-rose-500/10 text-rose-500 dark:bg-rose-500/20">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-955 dark:text-white">
                ¿Está seguro de que desea cancelar este pedido?
              </p>
              <p className="text-sm text-slate-955 dark:text-white mt-1 leading-relaxed">
                Esta acción no se puede deshacer y cancelará el pedido permanentemente.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOrderIdToCancel(null)}
              className="rounded-lg border border-slate-200 dark:border-neutral-800 px-4 py-2 text-xs font-bold text-slate-955 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                if (orderIdToCancel) {
                  const id = orderIdToCancel;
                  setOrderIdToCancel(null);
                  await handleCancelOrder(id);
                }
              }}
              className="rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2 transition text-xs shadow-sm cursor-pointer"
            >
              Aceptar
            </button>
          </div>
        </div>
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
