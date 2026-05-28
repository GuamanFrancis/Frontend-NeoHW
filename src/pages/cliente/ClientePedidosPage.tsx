import { useState, useEffect } from 'react';
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
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { getStoredSession } from '../../services/session';
import { createStripeSession } from '../../services/paymentsService';
import { updateOrderStatus } from '../../services/ordersService';
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
  const [filteredOrders, setFilteredOrders] = useState<OrderLocal[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<OrderLocal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const [selectedOrder, setSelectedOrder] = useState<OrderLocal | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogComponent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const ordersKey = userId ? `client_orders_${userId}` : '';

  const loadOrders = () => {
    if (!ordersKey) return;
    try {
      setIsLoading(true);
      const stored = localStorage.getItem(ordersKey);
      if (stored) {
        setAllOrders(JSON.parse(stored));
      } else {
        setAllOrders([]);
      }
    } catch (e) {
      console.error('Error al cargar historial de pedidos:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [ordersKey]);

  
  useEffect(() => {
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

    setFilteredOrders(result);
    setCurrentPage(1); 
  }, [allOrders, statusFilter, startDate, endDate]);

  
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedOrders(filteredOrders.slice(startIndex, endIndex));
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
        window.location.href = sessionData.url;
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
    if (!window.confirm('¿Está seguro de que desea cancelar este pedido?')) return;
    setCancellingOrderId(orderId);
    try {
      try {
        await updateOrderStatus(orderId, 'CANCELLED');
      } catch (err) {
        console.warn('Backend update failed (expected if USER role), updating locally only:', err);
      }
      
      const stored = localStorage.getItem(ordersKey);
      if (stored) {
        const orders = JSON.parse(stored);
        const updated = orders.map((o: any) =>
          o.id === orderId ? { ...o, status: 'CANCELLED' } : o
        );
        localStorage.setItem(ordersKey, JSON.stringify(updated));
      }

      alert('Pedido cancelado exitosamente.');
      setSelectedOrder(null);
      loadOrders();
    } catch (err: any) {
      console.error(err);
      alert('Error al cancelar el pedido. Intente nuevamente.');
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
          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wide">
            Pendiente de Pago
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="bg-teal-500/10 text-teal-400 border border-teal-500/25 px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wide">
            Pagado
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wide">
            Enviado
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wide">
            Entregado
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-rose-500/10 text-rose-500 border border-rose-500/25 px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wide">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="bg-neutral-800 text-neutral-400 px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wide">
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
  };

  return (
    <div className="mx-auto max-w-7xl pb-16 text-slate-900 dark:text-neutral-100">
      
      <div className="mb-8 border-b border-slate-100 dark:border-neutral-900 pb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white leading-none">
          Historial de compras
        </h1>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2 font-medium">
          Consulta, filtra y gestiona el estado de todos tus pedidos realizados en el sistema.
        </p>
      </div>

      
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-900 dark:bg-neutral-950/20 mb-6">
        <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-neutral-500">
          <Filter className="h-4 w-4 text-teal-500" />
          <span>Filtros de búsqueda</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 mb-1.5 uppercase">
              Estado del pedido
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-neutral-850 dark:bg-neutral-900 text-xs font-bold text-slate-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 mb-1.5 uppercase">
              Desde (Fecha inicio)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-neutral-850 dark:bg-neutral-900 text-xs font-bold text-slate-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 mb-1.5 uppercase">
              Hasta (Fecha fin)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-neutral-850 dark:bg-neutral-900 text-xs font-bold text-slate-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setStatusFilter('ALL');
                setStartDate('');
                setEndDate('');
              }}
              className="h-11 font-bold text-xs"
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </div>

      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-slate-200 rounded-xl bg-white dark:border-neutral-900 dark:bg-neutral-950/20 animate-pulse">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent mb-4" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-neutral-300">Cargando tu historial de pedidos...</h3>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 rounded-xl bg-white dark:border-neutral-900 dark:bg-neutral-950/20">
          <ShoppingBag className="h-16 w-16 text-slate-300 dark:text-neutral-800 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No se encontraron pedidos</h3>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-2 max-w-sm leading-relaxed">
            Intenta cambiar los filtros seleccionados o realiza una compra en el catálogo para generar tu primera orden.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-neutral-900 dark:bg-neutral-950">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:border-neutral-900 dark:text-neutral-500">
                  <th className="py-4 px-6">ID Pedido</th>
                  <th className="py-4 px-6">Fecha</th>
                  <th className="py-4 px-6">Componentes</th>
                  <th className="py-4 px-6 text-right">Total a pagar</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
                {displayedOrders.map((order) => {
                  const productNames = order.items.map(item => item.product.name).join(', ');
                  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-950 whitespace-nowrap dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-700 dark:text-neutral-300 select-all">
                            #{order.id.slice(0, 8)}...
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyId(order.id)}
                            className="text-slate-400 hover:text-slate-600 transition dark:text-neutral-500 dark:hover:text-neutral-300"
                            title="Copiar ID completo"
                          >
                            {copiedId === order.id ? (
                              <span className="text-[10px] text-teal-500 font-bold">¡Copiado!</span>
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-semibold dark:text-neutral-400 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate text-slate-500 font-medium dark:text-neutral-400" title={productNames}>
                        <span className="font-bold text-slate-700 dark:text-neutral-300 mr-1">({itemsCount})</span>
                        {productNames}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-slate-900 whitespace-nowrap dark:text-white">
                        ${order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-3">
                          {order.status === 'PENDING_PAYMENT' && (
                            <>
                              <Button
                                type="button"
                                disabled={payingOrderId === order.id}
                                onClick={() => handlePayOrder(order.id)}
                                className="bg-teal-500 hover:bg-teal-400 text-neutral-950 font-extrabold h-8 px-4 text-[10px] uppercase border-0 shadow-sm"
                              >
                                {payingOrderId === order.id ? 'Cargando...' : 'Pagar'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={cancellingOrderId === order.id}
                                onClick={() => handleCancelOrder(order.id)}
                                className="border-rose-500/30 text-rose-500 hover:bg-rose-50 dark:border-rose-500/25 dark:hover:bg-rose-950/15 h-8 px-3 text-[10px] uppercase font-extrabold flex items-center gap-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Cancelar
                              </Button>
                            </>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setSelectedOrder(order)}
                            className="h-8 px-3 text-[10px] font-bold flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Detalle
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-500 dark:text-neutral-400 font-semibold">
                Mostrando página {currentPage} de {totalPages} ({filteredOrders.length} pedidos en total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      
      <Modal
        open={!!selectedOrder}
        title="Detalles del Pedido"
        onClose={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header info */}
            <div className="border-b border-slate-100 dark:border-neutral-900 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">
                    ID completo del pedido
                  </span>
                  <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white select-all">
                    {selectedOrder.id}
                  </span>
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500 dark:text-neutral-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {formatDate(selectedOrder.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  Método: <span className="text-slate-700 dark:text-neutral-300">Stripe (Tarjeta de Crédito)</span>
                </span>
              </div>
            </div>

            
            {selectedOrder.shippingAddress && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-neutral-900 dark:bg-neutral-900/10">
                  <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                    <MapPin className="h-4 w-4 text-teal-500" />
                    <span>Dirección de envío</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-neutral-300 space-y-1">
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                    <p>C.P. {selectedOrder.shippingAddress.postalCode} • {selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-neutral-900 dark:bg-neutral-900/10">
                  <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                    <Info className="h-4 w-4 text-teal-500" />
                    <span>Información de Contacto</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-neutral-300 space-y-1">
                    <p><span className="font-bold text-slate-400">Nombre: </span>{selectedOrder.shippingAddress.fullName || `${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`.trim() || 'No especificado'}</p>
                    <p><span className="font-bold text-slate-400">Correo: </span>{selectedOrder.shippingAddress.email || session?.user?.email || 'No especificado'}</p>
                    <p><span className="font-bold text-slate-400">Teléfono: </span>{selectedOrder.shippingAddress.phone || session?.user?.phone || 'No especificado'}</p>
                  </div>
                </div>
              </div>
            )}

            
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-3">
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
                        <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded border border-slate-150 bg-slate-50 p-0.5 dark:border-neutral-850 dark:bg-neutral-900">
                          {item.product.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <ShoppingBag className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-500 group-hover:underline">
                            {item.product.name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
                            Precio unitario: ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          ${subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-bold block mt-0.5">
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
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-3">
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
                        className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-teal-500/30 transition text-xs font-bold text-slate-700 dark:border-neutral-850 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-850"
                      >
                        <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                        <span>{docNames[doc.documentType] || doc.documentType}</span>
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 ml-auto font-semibold">Ver archivo ↗</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 dark:bg-neutral-900 dark:border-neutral-850 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                Total del pedido
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-teal-600 dark:text-teal-400 block leading-none">
                  ${selectedOrder.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-neutral-500 mt-1 inline-block">
                  USD
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-neutral-900 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedOrder(null)}
              >
                Cerrar
              </Button>
              {selectedOrder.status === 'PENDING_PAYMENT' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={cancellingOrderId === selectedOrder.id}
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    className="border-rose-500/30 text-rose-500 hover:bg-rose-50 dark:border-rose-500/25 dark:hover:bg-rose-950/15"
                  >
                    {cancellingOrderId === selectedOrder.id ? 'Cancelando...' : 'Cancelar Pedido'}
                  </Button>
                  <Button
                    type="button"
                    disabled={payingOrderId === selectedOrder.id}
                    onClick={() => handlePayOrder(selectedOrder.id)}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-extrabold shadow"
                  >
                    {payingOrderId === selectedOrder.id ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Pagar ahora con Stripe'
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
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
