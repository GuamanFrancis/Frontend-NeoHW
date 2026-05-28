import { useEffect, useMemo, useState } from 'react';
import { Eye, Filter, Pencil, Search, Truck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageCard } from '../../components/ui/PageCard';
import { Modal } from '../../components/ui/Modal';
import { getOrders, updateOrderStatus, uploadOrderDocument, updateLocalOrder, type OrderItemBackend } from '../../services/ordersService';

export type SellerOrderStatus = 'Pendiente' | 'En proceso' | 'Enviado' | 'Entregado' | 'Cancelado';

type DateFilter = 'ultimos-3' | 'ultimos-7' | 'ultimos-30' | 'todos';

const statusStyles: Record<SellerOrderStatus, string> = {
  Pendiente: 'bg-emerald-400/10 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-200',
  'En proceso': 'bg-blue-400/10 text-blue-700 ring-blue-500/20 dark:bg-blue-500/15 dark:text-blue-200',
  Enviado: 'bg-violet-400/10 text-violet-700 ring-violet-500/20 dark:bg-violet-500/15 dark:text-violet-200',
  Entregado: 'bg-cyan-400/10 text-cyan-700 ring-cyan-500/20 dark:bg-cyan-500/15 dark:text-cyan-200',
  Cancelado: 'bg-rose-400/10 text-rose-700 ring-rose-500/20 dark:bg-rose-500/15 dark:text-rose-200',
};

const uiStatusToBackend: Record<SellerOrderStatus, string> = {
  Pendiente: 'PENDING_PAYMENT',
  'En proceso': 'PROCESSING',
  Enviado: 'SHIPPED',
  Entregado: 'DELIVERED',
  Cancelado: 'CANCELLED',
};

const backendStatusToUi: Record<string, SellerOrderStatus> = {
  PENDING_PAYMENT: 'Pendiente',
  PROCESSING: 'En proceso',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const actionButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-teal-500/60 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 dark:hover:text-teal-200';

const fieldClass =
  'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:border-teal-400 dark:disabled:bg-neutral-900';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

const formatOrderDate = (rawDate: string) => {
  const parsed = new Date(rawDate);

  return {
    day: new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(parsed),
    time: new Intl.DateTimeFormat('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(parsed),
  };
};

const dateFilterDays: Record<Exclude<DateFilter, 'todos'>, number> = {
  'ultimos-3': 3,
  'ultimos-7': 7,
  'ultimos-30': 30,
};

export interface MappedSellerOrder {
  id: string;
  itemsCount: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  createdAt: string;
  total: number;
  status: SellerOrderStatus;
  addressStr: string;
  items: OrderItemBackend[];
}

export const VendedorPedidosPage = () => {
  const [orders, setOrders] = useState<MappedSellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SellerOrderStatus | 'todos'>('todos');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ultimos-30');
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<MappedSellerOrder | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | null>(null);
  const [editStatus, setEditStatus] = useState<SellerOrderStatus>('Pendiente');

  const [orderToDispatch, setOrderToDispatch] = useState<MappedSellerOrder | null>(null);
  const [dispatchFile, setDispatchFile] = useState<File | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const [orderToDeliver, setOrderToDeliver] = useState<MappedSellerOrder | null>(null);
  const [deliveryPhotoFile, setDeliveryPhotoFile] = useState<File | null>(null);
  const [customerSignatureFile, setCustomerSignatureFile] = useState<File | null>(null);
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setIsLoading(true);

      const res = await getOrders();
      const paidOrders = JSON.parse(localStorage.getItem('neohw_paid_order_ids') || '[]');

      for (const order of res.data) {
        if (order.status === 'PENDING_PAYMENT' && paidOrders.includes(order.id)) {
          try {
            await updateOrderStatus(order.id, 'PROCESSING');
            updateLocalOrder(order.id, 'PROCESSING');
            order.status = 'PROCESSING';
          } catch (err) {
            console.error(err);
          }
        }
      }

      const mapped = res.data.map((order): MappedSellerOrder => {
        let itemsCount = 0;
        if (order.items && Array.isArray(order.items)) {
          itemsCount = order.items.reduce((sum: number, item) => sum + Number(item.quantity), 0);
        }

        let clientName = `Usuario #${order.userId.slice(0, 8)}`;
        let clientEmail = 'sin-correo@neohw.com';
        let clientPhone = 'Sin teléfono';
        let addressStr = 'No especificada';

        if (order.user) {
          const fn = order.user.firstName || '';
          const ln = order.user.lastName || '';
          const fullName = [fn, ln].filter(Boolean).join(' ');
          if (fullName) clientName = fullName;
          if (order.user.email) clientEmail = order.user.email;
          if (order.user.phone) clientPhone = order.user.phone;
        }

        if (order.shippingAddress) {
          try {
            const addr = typeof order.shippingAddress === 'string'
              ? JSON.parse(order.shippingAddress)
              : order.shippingAddress;
            if (addr && typeof addr === 'object') {
              const street = addr.street || addr.direccion || '';
              const city = addr.city || addr.ciudad || '';
              const state = addr.state || addr.provincia || '';
              const country = addr.country || addr.pais || '';
              addressStr = [street, city, state, country].filter(Boolean).join(', ') || 'No especificada';
              
              if (!order.user) {
                if (addr.email) clientEmail = addr.email;
                if (addr.fullName || addr.name) clientName = addr.fullName || addr.name;
                if (addr.phone || addr.telefono) clientPhone = addr.phone || addr.telefono;
              }
            }
          } catch {
            addressStr = String(order.shippingAddress);
          }
        }

        const isPaidLocal = order.status === 'PENDING_PAYMENT' && paidOrders.includes(order.id);
        const currentOrderStatus = isPaidLocal ? 'PROCESSING' : order.status;

        return {
          id: order.id,
          itemsCount,
          clientName,
          clientEmail,
          clientPhone,
          createdAt: order.createdAt,
          total: Number(order.totalAmount),
          status: backendStatusToUi[currentOrderStatus] || 'Pendiente',
          addressStr,
          items: order.items || [],
        };
      });
      setOrders(mapped);
    } catch (e) {
      console.error('Error fetching seller orders:', e);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
    
    const intervalId = setInterval(() => {
      void loadOrders();
    }, 300000);
    return () => clearInterval(intervalId);
  }, []);

  const handleOpenDispatchModal = (order: MappedSellerOrder) => {
    setOrderToDispatch(order);
    setDispatchFile(null);
    setDispatchError(null);
    setIsDispatching(false);
  };

  const handleConfirmDispatch = async () => {
    if (!orderToDispatch) return;
    setDispatchError(null);
    setIsDispatching(true);

    const isMock = orderToDispatch.id.startsWith('#NHW-');
    if (isMock) {
      setOrders((current) =>
        current.map((o) => (o.id === orderToDispatch.id ? { ...o, status: 'Enviado' } : o))
      );
      setOrderToDispatch(null);
      setIsDispatching(false);
      return;
    }

    try {
      
      if (orderToDispatch.status !== 'En proceso') {
        throw new Error('Solo se pueden enviar pedidos que están en estado "En proceso" (pagados por el cliente).');
      }

      
      if (!dispatchFile) {
        throw new Error('Es obligatorio subir una Prueba de Envío (SHIPPING_PROOF) en formato PDF o Imagen para despachar este pedido.');
      }

      const docRes = await uploadOrderDocument(orderToDispatch.id, dispatchFile, 'SHIPPING_PROOF');
      await updateOrderStatus(orderToDispatch.id, 'SHIPPED');
      updateLocalOrder(orderToDispatch.id, 'SHIPPED', {
        documentType: 'SHIPPING_PROOF',
        fileUrl: docRes.document?.fileUrl || docRes.fileUrl || ''
      });

      await loadOrders();
      setOrderToDispatch(null);
    } catch (err) {
      console.error(err);
      const errorMsg = err as { response?: { data?: { message?: string | string[] } }; message: string };
      const backendMsg = errorMsg.response?.data?.message || errorMsg.message;
      setDispatchError(Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleOpenDeliverModal = (order: MappedSellerOrder) => {
    setOrderToDeliver(order);
    setDeliveryPhotoFile(null);
    setCustomerSignatureFile(null);
    setDeliveryError(null);
    setIsDelivering(false);
  };

  const handleConfirmDelivery = async () => {
    if (!orderToDeliver) return;
    setDeliveryError(null);
    setIsDelivering(true);

    const isMock = orderToDeliver.id.startsWith('#NHW-');
    if (isMock) {
      setOrders((current) =>
        current.map((o) => (o.id === orderToDeliver.id ? { ...o, status: 'Entregado' } : o))
      );
      setOrderToDeliver(null);
      setIsDelivering(false);
      return;
    }

    try {
      if (orderToDeliver.status !== 'Enviado') {
        throw new Error('Solo se pueden entregar pedidos que están en estado "Enviado".');
      }

      if (!deliveryPhotoFile) {
        throw new Error('Debe subir la Foto de Entrega (DELIVERY_PHOTO) para entregar el pedido.');
      }

      if (!customerSignatureFile) {
        throw new Error('Debe subir la Firma del Cliente (CUSTOMER_SIGNATURE) para entregar el pedido.');
      }

      const docPhotoRes = await uploadOrderDocument(orderToDeliver.id, deliveryPhotoFile, 'DELIVERY_PHOTO');
      const docSigRes = await uploadOrderDocument(orderToDeliver.id, customerSignatureFile, 'CUSTOMER_SIGNATURE');
      await updateOrderStatus(orderToDeliver.id, 'DELIVERED');

      updateLocalOrder(orderToDeliver.id, 'DELIVERED', {
        documentType: 'DELIVERY_PHOTO',
        fileUrl: docPhotoRes.document?.fileUrl || docPhotoRes.fileUrl || ''
      });
      updateLocalOrder(orderToDeliver.id, 'DELIVERED', {
        documentType: 'CUSTOMER_SIGNATURE',
        fileUrl: docSigRes.document?.fileUrl || docSigRes.fileUrl || ''
      });

      await loadOrders();
      setOrderToDeliver(null);
    } catch (err) {
      console.error(err);
      const errorMsg = err as { response?: { data?: { message?: string | string[] } }; message: string };
      const backendMsg = errorMsg.response?.data?.message || errorMsg.message;
      setDeliveryError(Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg);
    } finally {
      setIsDelivering(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: SellerOrderStatus) => {
    try {
      const isMock = orderId.startsWith('#NHW-');
      if (isMock) {
        setOrders((current) =>
          current.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        const backendStatus = uiStatusToBackend[newStatus];
        await updateOrderStatus(orderId, backendStatus);
        updateLocalOrder(orderId, backendStatus);
        await loadOrders();
      }
      setModalMode(null);
      setSelectedOrder(null);
    } catch {
      alert('No se pudo actualizar el estado del pedido.');
    }
  };

  const openViewModal = (order: MappedSellerOrder) => {
    setSelectedOrder(order);
    setModalMode('view');
  };

  const openEditModal = (order: MappedSellerOrder) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setModalMode('edit');
  };

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !normalizedSearch ||
        order.id.toLowerCase().includes(normalizedSearch) ||
        order.clientName.toLowerCase().includes(normalizedSearch) ||
        order.clientEmail.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === 'todos' || order.status === statusFilter;

      if (dateFilter === 'todos') {
        return matchesSearch && matchesStatus;
      }

      const maxDays = dateFilterDays[dateFilter];
      const threshold = Date.now() - maxDays * 24 * 60 * 60 * 1000;
      const orderTime = new Date(order.createdAt).getTime();
      const matchesDate = Number.isFinite(orderTime) && orderTime >= threshold;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, dateFilter, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pageOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstResult = filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResult = Math.min(currentPage * pageSize, filteredOrders.length);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('todos');
    setDateFilter('ultimos-30');
    setCurrentPage(1);
  };

  return (
    <PageCard
      title="Atender pedidos de clientes"
      text="Visualiza y atiende pedidos en una sola vista."
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-3 lg:grid-cols-[1fr_190px_190px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar pedido por ID, cliente o correo..."
              className={`${fieldClass} w-full pl-10`}
            />
          </label>

          <select
            className={fieldClass}
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as SellerOrderStatus | 'todos');
              setCurrentPage(1);
            }}
          >
            <option value="todos">Estado: Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Enviado">Enviado</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          <select
            className={fieldClass}
            value={dateFilter}
            onChange={(event) => {
              setDateFilter(event.target.value as DateFilter);
              setCurrentPage(1);
            }}
          >
            <option value="ultimos-3">Fecha: Ultimos 3 dias</option>
            <option value="ultimos-7">Fecha: Ultimos 7 dias</option>
            <option value="ultimos-30">Fecha: Ultimos 30 dias</option>
            <option value="todos">Fecha: Todas</option>
          </select>

          <Button type="button" variant="outline" className="h-10 px-4 text-sm" onClick={clearFilters}>
            <Filter className="h-4 w-4" />
            Limpiar
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.03] dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-bold">Pedido</th>
                  <th className="px-4 py-3 font-bold">Cliente</th>
                  <th className="px-4 py-3 font-bold">Fecha</th>
                  <th className="px-4 py-3 font-bold">Total</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 text-right font-bold">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {pageOrders.map((order) => {
                  const formattedDate = formatOrderDate(order.createdAt);

                  return (
                    <tr key={order.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950 dark:text-white">{order.id}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
                          {order.itemsCount} {order.itemsCount === 1 ? 'producto' : 'productos'}
                        </p>
                        {order.items && order.items.length > 0 && (
                          <div className="mt-1.5 space-y-0.5 max-w-xs">
                            {order.items.map((item, idx) => (
                              <p key={item.id || idx} className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 leading-tight">
                                • {item.product?.name || `Componente ID: ${item.productId}`} <span className="text-slate-400 dark:text-neutral-500 font-bold">x{item.quantity}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-baseline gap-1.5">
                          <p className="font-medium text-slate-800 dark:text-neutral-200">{order.clientName}</p>
                          {/* Destacar pedidos nuevos creados hace menos de 24 horas (HU-012) */}
                          {new Date(order.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 && (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 animate-pulse" title="¡Pedido nuevo!"></span>
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">{order.clientEmail}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
                          <span className="font-semibold text-slate-700 dark:text-neutral-350">Teléf: </span>
                          {order.clientPhone || 'No registrado'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400 leading-relaxed max-w-[280px]">
                          <span className="font-semibold text-slate-700 dark:text-neutral-300">Dirección: </span>
                          {order.addressStr}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700 dark:text-neutral-300">{formattedDate.day}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">{formattedDate.time}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-teal-700 dark:text-teal-300">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusStyles[order.status as SellerOrderStatus]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => openViewModal(order)}
                            aria-label={`Ver ${order.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => openEditModal(order)}
                            aria-label={`Editar ${order.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => handleOpenDispatchModal(order)}
                            disabled={order.status !== 'En proceso'}
                            title="Preparar Envío"
                            aria-label={`Despachar ${order.id}`}
                          >
                            <Truck className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => handleOpenDeliverModal(order)}
                            disabled={order.status !== 'Enviado'}
                            title="Registrar Entrega"
                            aria-label={`Entregar ${order.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
                      Cargando pedidos...
                    </td>
                  </tr>
                )}

                {!isLoading && pageOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
                      No se encontraron pedidos con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-neutral-800 dark:text-neutral-400 md:flex-row md:items-center md:justify-between">
            <p>
              Mostrando {firstResult} a {lastResult} de {filteredOrders.length} pedidos
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={actionButtonClass}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                aria-label="Pagina anterior"
              >
                {'<'}
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={
                    page === currentPage
                      ? 'h-8 min-w-8 rounded-lg bg-teal-500 px-2 text-xs font-bold text-white'
                      : actionButtonClass
                  }
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className={actionButtonClass}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                aria-label="Pagina siguiente"
              >
                {'>'}
              </button>

              <select
                className={`${fieldClass} h-8`}
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5 por pagina</option>
                <option value={10}>10 por pagina</option>
                <option value={20}>20 por pagina</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={modalMode === 'view' && Boolean(selectedOrder)}
        title="Detalles del Pedido"
        text="Detalle completo de los componentes, total y dirección de envío."
        onClose={() => setModalMode(null)}
        footer={
          <Button type="button" onClick={() => setModalMode(null)}>
            Cerrar
          </Button>
        }
      >
        {selectedOrder && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">ID de Pedido</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Estado</p>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 mt-1 text-xs font-bold ring-1 ${statusStyles[selectedOrder.status as SellerOrderStatus]}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Fecha de Creación</p>
                <p className="text-slate-700 dark:text-neutral-300 mt-0.5">
                  {formatOrderDate(selectedOrder.createdAt).day} a las {formatOrderDate(selectedOrder.createdAt).time}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Total del Pedido</p>
                <p className="font-semibold text-teal-600 dark:text-teal-400 mt-0.5">{formatCurrency(selectedOrder.total)}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-neutral-800 pt-3">
              <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Información del Cliente</p>
              <p className="font-medium text-slate-900 dark:text-white mt-1">{selectedOrder.clientName}</p>
              <p className="text-slate-500 dark:text-neutral-400 mt-0.5 text-xs">{selectedOrder.clientEmail}</p>
              <p className="text-slate-500 dark:text-neutral-400 mt-0.5 text-xs">
                <span className="font-semibold text-slate-700 dark:text-neutral-350">Teléfono: </span>
                {selectedOrder.clientPhone || 'No registrado'}
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-neutral-800 pt-3">
              <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Dirección de Envío</p>
              <p className="text-slate-700 dark:text-neutral-300 mt-1">{selectedOrder.addressStr || 'No provista'}</p>
            </div>

            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="border-t border-slate-100 dark:border-neutral-800 pt-3">
                <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide mb-2">Componentes Comprados</p>
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-neutral-800">
                  <table className="w-full min-w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-white/[0.02] dark:text-neutral-400">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Producto</th>
                        <th className="px-3 py-2 text-center font-semibold">Cant.</th>
                        <th className="px-3 py-2 text-right font-semibold">Precio Unit.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-neutral-200">
                            {item.product?.name || `Componente ID: ${item.productId}`}
                          </td>
                          <td className="px-3 py-2 text-center text-slate-600 dark:text-neutral-300">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-600 dark:text-neutral-300">
                            {formatCurrency(Number(item.priceAtTime))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={modalMode === 'edit' && Boolean(selectedOrder)}
        title="Modificar Estado del Pedido"
        text="Selecciona el nuevo estado para este pedido en el flujo de despacho."
        onClose={() => setModalMode(null)}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setModalMode(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => selectedOrder && void handleUpdateStatus(selectedOrder.id, editStatus)}
            >
              Actualizar Estado
            </Button>
          </>
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-white/[0.02] text-sm">
              <p className="text-xs text-slate-500 dark:text-neutral-400">Pedido actual</p>
              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedOrder.id}</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-2">Cliente</p>
              <p className="font-medium text-slate-800 dark:text-neutral-300 mt-0.5">{selectedOrder.clientName}</p>
            </div>

             {selectedOrder.status === 'Pendiente' && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-amber-600 text-xs font-semibold leading-relaxed">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <span>Este pedido está pendiente de pago. Solo el cliente mediante Stripe puede marcarlo como "En proceso". Evita forzar este estado manualmente.</span>
              </div>
            )}

            <label className="block space-y-1">
              <span className="text-sm font-semibold text-slate-700 dark:text-neutral-300">Nuevo Estado</span>
              <select
                className={`${fieldClass} w-full`}
                value={editStatus}
                onChange={(event) => setEditStatus(event.target.value as SellerOrderStatus)}
              >
                {selectedOrder.status === 'Pendiente' ? (
                  <>
                    <option value="Pendiente">Pendiente (Esperando pago)</option>
                    <option value="Cancelado">Cancelado</option>
                  </>
                ) : (
                  <>
                    <option value="En proceso">En proceso (Pagado)</option>
                    <option value="Enviado">Enviado (Despachado)</option>
                    <option value="Entregado">Entregado</option>
                    <option value="Cancelado">Cancelado</option>
                  </>
                )}
              </select>
            </label>
          </div>
        )}
      </Modal>

      {/* Modal Premium para Confirmación de Despacho (HU-012) */}
      <Modal
        open={!!orderToDispatch}
        title="Preparar Despacho del Pedido"
        onClose={() => setOrderToDispatch(null)}
      >
        {orderToDispatch && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  ¿Estás listo para despachar el pedido {orderToDispatch.id}?
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Para actualizar el estado a <span className="font-bold text-teal-500">Enviado (SHIPPED)</span>, es obligatorio cumplir con las reglas del negocio:
                </p>
              </div>
            </div>

            {/* Checklist de requisitos de negocio */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40 text-xs font-semibold space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Requisito 1: Pago y Estado</span>
                {orderToDispatch.status === 'En proceso' ? (
                  <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">✓ Cumplido (En proceso)</span>
                ) : (
                  <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">✗ Requerido ({orderToDispatch.status})</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-neutral-500 leading-normal -mt-2">
                El pedido debe estar pagado (estado "En proceso") para poder realizar el envío.
              </p>

              <div className="border-t border-slate-200/40 dark:border-neutral-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500">Requisito 2: Prueba de Envío (SHIPPING_PROOF)</span>
                  {dispatchFile ? (
                    <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">✓ Cargado</span>
                  ) : (
                    <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">✗ Obligatorio</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setDispatchFile(files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-teal-500/10 file:text-teal-600 hover:file:bg-teal-500/20 file:cursor-pointer cursor-pointer border border-dashed border-slate-300 dark:border-neutral-700 rounded-lg p-2 bg-white dark:bg-neutral-950"
                  disabled={orderToDispatch.status !== 'En proceso'}
                />
                <p className="text-[9px] text-slate-400 dark:text-neutral-500 mt-1 font-medium">
                  Soporta imágenes (JPEG, PNG, WEBP) o documentos PDF de hasta 5 MB.
                </p>
              </div>
            </div>

            {dispatchError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-red-600 dark:text-red-300 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <span>{dispatchError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOrderToDispatch(null)}
                disabled={isDispatching}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirmDispatch()}
                disabled={isDispatching || orderToDispatch.status !== 'En proceso' || !dispatchFile}
                className="bg-teal-500 hover:bg-teal-600 text-white font-extrabold"
              >
                {isDispatching ? 'Despachando...' : 'Confirmar Envío'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Premium para Confirmación de Entrega (DELIVERED) */}
      <Modal
        open={!!orderToDeliver}
        title="Registrar Entrega del Pedido"
        onClose={() => setOrderToDeliver(null)}
      >
        {orderToDeliver && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  ¿Registrar entrega para el pedido {orderToDeliver.id}?
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Para actualizar el estado a <span className="font-bold text-emerald-500">Entregado (DELIVERED)</span>, debes subir los soportes correspondientes:
                </p>
              </div>
            </div>

            {/* Checklist de requisitos de entrega */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40 text-xs font-semibold space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Estado del Pedido</span>
                {orderToDeliver.status === 'Enviado' ? (
                  <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">✓ Listo (Enviado)</span>
                ) : (
                  <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">✗ Requerido ({orderToDeliver.status})</span>
                )}
              </div>

              {/* Documento 1: Foto de Entrega */}
              <div className="border-t border-slate-200/40 dark:border-neutral-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500">1. Foto de la Entrega (DELIVERY_PHOTO)</span>
                  {deliveryPhotoFile ? (
                    <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">✓ Cargado</span>
                  ) : (
                    <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">✗ Requerido</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setDeliveryPhotoFile(files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-teal-500/10 file:text-teal-600 hover:file:bg-teal-500/20 file:cursor-pointer cursor-pointer border border-dashed border-slate-300 dark:border-neutral-700 rounded-lg p-2 bg-white dark:bg-neutral-950"
                  disabled={orderToDeliver.status !== 'Enviado'}
                />
              </div>

              {/* Documento 2: Firma del Cliente */}
              <div className="border-t border-slate-200/40 dark:border-neutral-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500">2. Firma del Cliente (CUSTOMER_SIGNATURE)</span>
                  {customerSignatureFile ? (
                    <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">✓ Cargado</span>
                  ) : (
                    <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">✗ Requerido</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setCustomerSignatureFile(files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-teal-500/10 file:text-teal-600 hover:file:bg-teal-500/20 file:cursor-pointer cursor-pointer border border-dashed border-slate-300 dark:border-neutral-700 rounded-lg p-2 bg-white dark:bg-neutral-950"
                  disabled={orderToDeliver.status !== 'Enviado'}
                />
              </div>
            </div>

            {deliveryError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-red-600 dark:text-red-300 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <span>{deliveryError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOrderToDeliver(null)}
                disabled={isDelivering}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirmDelivery()}
                disabled={isDelivering || orderToDeliver.status !== 'Enviado' || !deliveryPhotoFile || !customerSignatureFile}
                className="bg-teal-500 hover:bg-teal-600 text-white font-extrabold"
              >
                {isDelivering ? 'Procesando...' : 'Confirmar Entrega'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageCard>
  );
};

