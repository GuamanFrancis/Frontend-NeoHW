import { useEffect, useMemo, useState } from 'react';
import { Eye, Filter, Search, Truck, AlertTriangle, CheckCircle2, XCircle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { PageCard } from '../../components/ui/PageCard';
import { Modal } from '../../components/ui/Modal';
import { getOrders, updateOrderStatus, uploadOrderDocument, type OrderItemBackend } from '../../services/ordersService';

export type SellerOrderStatus = 'Pendiente' | 'En proceso' | 'Enviado' | 'Entregado' | 'Cancelado';

type DateFilter = 'ultimos-3' | 'ultimos-7' | 'ultimos-30' | 'todos';

const statusStyles: Record<SellerOrderStatus, string> = {
  Pendiente: 'bg-emerald-400/10 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-200',
  'En proceso': 'bg-blue-400/10 text-blue-700 ring-blue-500/20 dark:bg-blue-500/15 dark:text-blue-200',
  Enviado: 'bg-violet-400/10 text-violet-700 ring-violet-500/20 dark:bg-violet-500/15 dark:text-violet-200',
  Entregado: 'bg-cyan-400/10 text-cyan-700 ring-cyan-500/20 dark:bg-cyan-500/15 dark:text-cyan-200',
  Cancelado: 'bg-rose-400/10 text-rose-700 ring-rose-500/20 dark:bg-rose-500/15 dark:text-rose-200',
};


const backendStatusToUi: Record<string, SellerOrderStatus> = {
  PENDING_PAYMENT: 'Pendiente',
  PROCESSING: 'En proceso',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const actionButtonClass =
  'flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-teal-500/60 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 dark:hover:text-teal-200 cursor-pointer';

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
  trackingCode?: string | null;
  subtotal?: number;
  taxAmount?: number;
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
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [maxVisitedPage, setMaxVisitedPage] = useState(1);

  useEffect(() => {
    if (currentPage === 1) {
      setMaxVisitedPage(1);
    } else {
      setMaxVisitedPage((prev) => Math.max(prev, currentPage));
    }
  }, [currentPage]);

  const [selectedOrder, setSelectedOrder] = useState<MappedSellerOrder | null>(null);
  const [modalMode, setModalMode] = useState<'view' | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<MappedSellerOrder | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [orderToDispatch, setOrderToDispatch] = useState<MappedSellerOrder | null>(null);
  const [dispatchFile, setDispatchFile] = useState<File | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const [orderToDeliver, setOrderToDeliver] = useState<MappedSellerOrder | null>(null);
  const [deliveryPhotoFile, setDeliveryPhotoFile] = useState<File | null>(null);
  const [customerSignatureFile, setCustomerSignatureFile] = useState<File | null>(null);
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);

      const res = await getOrders(undefined, undefined, 50);

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

        const currentOrderStatus = order.status;

        return {
          id: order.id,
          trackingCode: order.trackingCode,
          subtotal: order.subtotal ? Number(order.subtotal) : undefined,
          taxAmount: order.taxAmount ? Number(order.taxAmount) : undefined,
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
      setToastMessage(`El pedido ${orderToDispatch.trackingCode || orderToDispatch.id} se ha despachado con éxito.`);
      setOrderToDispatch(null);
      setIsDispatching(false);
      return;
    }

    try {
      if (orderToDispatch.status !== 'En proceso') {
        throw new Error('Solo se pueden enviar pedidos que están en estado "En proceso" (pagados por el cliente).');
      }

      if (!dispatchFile) {
        throw new Error('Es obligatorio subir una Prueba de Envío en formato PDF o Imagen para despachar este pedido.');
      }

      await uploadOrderDocument(orderToDispatch.id, dispatchFile, 'SHIPPING_PROOF');
      await updateOrderStatus(orderToDispatch.id, 'SHIPPED');

      await loadOrders();
      setToastMessage(`El pedido ${orderToDispatch.trackingCode || orderToDispatch.id} se ha despachado con éxito.`);
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
      setToastMessage(`La entrega del pedido ${orderToDeliver.trackingCode || orderToDeliver.id} fue registrada con éxito.`);
      setOrderToDeliver(null);
      setIsDelivering(false);
      return;
    }

    try {
      if (orderToDeliver.status !== 'Enviado') {
        throw new Error('Solo se pueden entregar pedidos que están en estado "Enviado".');
      }

      if (!deliveryPhotoFile) {
        throw new Error('Debe subir la Foto de Entrega para entregar el pedido.');
      }

      if (!customerSignatureFile) {
        throw new Error('Debe subir la Firma del Cliente para entregar el pedido.');
      }

      await uploadOrderDocument(orderToDeliver.id, deliveryPhotoFile, 'DELIVERY_PHOTO');
      await uploadOrderDocument(orderToDeliver.id, customerSignatureFile, 'CUSTOMER_SIGNATURE');
      await updateOrderStatus(orderToDeliver.id, 'DELIVERED');

      await loadOrders();
      setToastMessage(`La entrega del pedido ${orderToDeliver.trackingCode || orderToDeliver.id} fue registrada con éxito.`);
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

  const handleOpenCancelModal = (order: MappedSellerOrder) => {
    setOrderToCancel(order);
    setCancelError(null);
    setIsCancelling(false);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setCancelError(null);
    setIsCancelling(true);

    const isMock = orderToCancel.id.startsWith('#NHW-');
    if (isMock) {
      setOrders((current) =>
        current.map((o) => (o.id === orderToCancel.id ? { ...o, status: 'Cancelado' } : o))
      );
      setToastMessage(`El pedido ${orderToCancel.trackingCode || orderToCancel.id} se ha cancelado con éxito.`);
      setOrderToCancel(null);
      setIsCancelling(false);
      return;
    }

    try {
      if (orderToCancel.status === 'Entregado' || orderToCancel.status === 'Cancelado') {
        throw new Error('No se puede cancelar un pedido que ya está entregado o cancelado.');
      }

      await updateOrderStatus(orderToCancel.id, 'CANCELLED');
      await loadOrders();
      setToastMessage(`El pedido ${orderToCancel.trackingCode || orderToCancel.id} se ha cancelado con éxito.`);
      setOrderToCancel(null);
    } catch (err) {
      console.error(err);
      const errorMsg = err as { response?: { data?: { message?: string | string[] } }; message: string };
      const backendMsg = errorMsg.response?.data?.message || errorMsg.message;
      setCancelError(Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg);
    } finally {
      setIsCancelling(false);
    }
  };

  const openViewModal = (order: MappedSellerOrder) => {
    setSelectedOrder(order);
    setModalMode('view');
  };

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !normalizedSearch ||
        order.id.toLowerCase().includes(normalizedSearch) ||
        (order.trackingCode && order.trackingCode.toLowerCase().includes(normalizedSearch)) ||
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
    <PageCard>
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
              <thead className="bg-slate-50 text-sm uppercase tracking-wider text-slate-900 dark:bg-white/[0.02] dark:text-white border-b border-slate-200 dark:border-neutral-800">
                <tr>
                  <th className="px-5 py-4 font-bold text-center">Cliente</th>
                  <th className="px-5 py-4 font-bold">Pedido</th>
                  <th className="px-5 py-4 font-bold">Fecha</th>
                  <th className="px-5 py-4 font-bold">Total</th>
                  <th className="px-5 py-4 font-bold">Estado</th>
                  <th className="px-5 py-4 text-right font-bold">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {pageOrders.map((order) => {
                  const formattedDate = formatOrderDate(order.createdAt);

                  return (
                    <tr key={order.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                      <td className="px-5 py-4 min-w-[360px]">
                        <div className="grid grid-cols-2 gap-x-4 text-sm font-normal text-slate-900 dark:text-white dark:text-white">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <p className="text-sm font-medium text-slate-900 dark:text-white dark:text-white">{order.clientName}</p>
                              {new Date(order.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 && (
                                <span className="relative flex h-2 w-2 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 animate-pulse" title="¡Pedido nuevo!"></span>
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 text-sm font-normal text-slate-600 dark:text-neutral-350 dark:text-white/80 max-w-[180px] break-all">{order.clientEmail}</p>
                          </div>
                          <div>
                            <p className="text-sm font-normal text-slate-900 dark:text-white dark:text-white">
                              {order.clientPhone || 'No registrado'}
                            </p>
                            <p className="mt-1.5 text-sm font-normal text-slate-900 dark:text-white dark:text-white leading-relaxed max-w-[200px]">
                              {order.addressStr}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-mono text-sm font-bold text-slate-900 dark:text-white dark:text-white select-all">
                          {order.trackingCode ? (
                            <span className="text-teal-600 dark:text-teal-400">{order.trackingCode}</span>
                          ) : (
                            order.id.slice(0, 8) + '...'
                          )}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-slate-900 dark:text-white dark:text-white">{formattedDate.day}</p>
                        <p className="mt-1 text-[11px] text-slate-900 dark:text-white dark:text-white font-normal">{formattedDate.time}</p>
                      </td>
                      <td className="px-5 py-4 font-bold text-sm text-slate-900 dark:text-white dark:text-white">{formatCurrency(order.total)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-semibold ${statusStyles[order.status as SellerOrderStatus]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2.5">
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => openViewModal(order)}
                            aria-label={`Ver ${order.id}`}
                          >
                            <Eye className="h-5.5 w-5.5 text-slate-700 dark:text-slate-200" />
                          </button>
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => handleOpenDispatchModal(order)}
                            disabled={order.status !== 'En proceso'}
                            title="Preparar Envío"
                            aria-label={`Despachar ${order.id}`}
                          >
                            <Truck className="h-5.5 w-5.5 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => handleOpenDeliverModal(order)}
                            disabled={order.status !== 'Enviado'}
                            title="Registrar Entrega"
                            aria-label={`Entregar ${order.id}`}
                          >
                            <CheckCircle2 className="h-5.5 w-5.5 text-emerald-500" />
                          </button>
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => handleOpenCancelModal(order)}
                            disabled={order.status === 'Entregado' || order.status === 'Cancelado'}
                            title="Cancelar Pedido"
                            aria-label={`Cancelar ${order.id}`}
                          >
                            <XCircle className="h-5.5 w-5.5 text-rose-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-900 dark:text-white dark:text-white">
                      Cargando pedidos...
                    </td>
                  </tr>
                )}

                {!isLoading && pageOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-900 dark:text-white dark:text-white">
                      No se encontraron pedidos con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-900 dark:text-white dark:border-neutral-800 dark:text-white md:flex-row md:items-center md:justify-between">
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

              {Array.from({ length: Math.min(totalPages, maxVisitedPage) }, (_, index) => index + 1).map((page) => (
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
        onClose={() => setModalMode(null)}
        className="max-w-2xl p-8"
      >
        {selectedOrder && (
          <div className="space-y-6 text-slate-900 dark:text-white max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <span className="block font-semibold text-slate-900 dark:text-white text-base">
                  {selectedOrder.trackingCode ? 'Código de Rastreo' : 'Código de Pedido'}
                </span>
                <span className="block font-mono font-normal text-slate-900 dark:text-white text-base mt-0.5">
                  {selectedOrder.trackingCode ? (
                    <span className="font-bold text-teal-600 dark:text-teal-400">{selectedOrder.trackingCode}</span>
                  ) : (
                    selectedOrder.id
                  )}
                </span>
              </div>
              <div>
                <span className="block font-semibold text-slate-900 dark:text-white text-base">Fecha de Creación</span>
                <span className="block font-normal text-slate-900 dark:text-white text-base mt-0.5">
                  {formatOrderDate(selectedOrder.createdAt).day} a las {formatOrderDate(selectedOrder.createdAt).time}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-150 dark:border-white/10" />

            <div>
              <span className="block font-bold uppercase tracking-wider text-slate-900 dark:text-white text-sm">Información del Cliente</span>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-3">
                <div>
                  <span className="block font-semibold text-slate-900 dark:text-white text-base">Cliente</span>
                  <span className="block font-normal text-slate-900 dark:text-white text-base mt-0.5">{selectedOrder.clientName}</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-900 dark:text-white text-base">Email</span>
                  <span className="block font-normal text-slate-900 dark:text-white text-base mt-0.5">{selectedOrder.clientEmail}</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-900 dark:text-white text-base">Teléfono</span>
                  <span className="block font-normal text-slate-900 dark:text-white text-base mt-0.5">{selectedOrder.clientPhone || 'No registrado'}</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-900 dark:text-white text-base">Dirección de Envío</span>
                  <span className="block font-normal text-slate-900 dark:text-white text-base mt-0.5">{selectedOrder.addressStr || 'No provista'}</span>
                </div>
              </div>
            </div>

            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <>
                <div className="border-t border-slate-150 dark:border-white/10" />
                <div>
                  <span className="block font-bold uppercase tracking-wider text-slate-900 dark:text-white text-sm mb-3">Componentes Comprados</span>
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
                    <div className="max-h-[160px] overflow-y-auto scrollbar-thin">
                      <table className="w-full min-w-full text-left text-base">
                        <thead className="bg-slate-50 text-slate-900 dark:text-white dark:bg-black dark:text-white border-b border-slate-200 dark:border-white/10 sticky top-0">
                          <tr>
                            <th className="px-3 py-2.5 font-bold">Producto</th>
                            <th className="px-3 py-2.5 text-center font-bold">Cant.</th>
                            <th className="px-3 py-2.5 text-right font-bold">Precio Unit.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 dark:divide-white/10">
                          {selectedOrder.items.map((item, idx) => (
                            <tr key={item.id || idx}>
                              <td className="px-3 py-2.5 font-normal text-slate-900 dark:text-white">
                                {item.product?.name || `Componente ID: ${item.productId}`}
                              </td>
                              <td className="px-3 py-2.5 text-center font-normal text-slate-900 dark:text-white">
                                {item.quantity}
                              </td>
                              <td className="px-3 py-2.5 text-right font-normal text-slate-900 dark:text-white">
                                {formatCurrency(Number(item.priceAtTime))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="border-t border-slate-150 dark:border-white/10" />

            <div className="border-t border-slate-150 dark:border-white/10 pt-4 space-y-2">
              {selectedOrder.subtotal !== undefined && selectedOrder.taxAmount !== undefined && (
                <>
                  <div className="flex justify-between text-sm font-semibold text-slate-700 dark:text-white/80">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-slate-700 dark:text-white/80 pb-2 border-b border-slate-200 dark:border-white/10">
                    <span>IVA (15%)</span>
                    <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-bold uppercase tracking-wider text-slate-900 dark:text-white text-sm">Total del Pedido</span>
                  <span className="block text-2xl font-semibold text-slate-900 dark:text-white mt-1">{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className="text-right">
                  <span className="block font-bold uppercase tracking-wider text-slate-900 dark:text-white text-sm">Estado</span>
                  <span className={`block text-lg font-semibold mt-1 ${statusStyles[selectedOrder.status as SellerOrderStatus]}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setModalMode(null)}
                variant="outlineHoverSolid"
                className="h-11 px-6 font-bold text-sm border border-teal-500 text-teal-600 bg-transparent hover:bg-teal-500 hover:text-white dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-400 dark:hover:text-neutral-950 transition cursor-pointer"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!orderToDispatch}
        title="Preparar Despacho del Pedido"
        onClose={() => setOrderToDispatch(null)}
        className="max-w-3xl p-8 md:p-10"
      >
        {orderToDispatch && (
          <div className="space-y-6 text-left">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 shrink-0">
                <Truck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg md:text-xl font-medium text-slate-900 dark:text-white leading-snug">
                  ¿Estás listo para despachar el pedido {orderToDispatch.trackingCode || orderToDispatch.id}?
                </h4>
                <p className="text-base text-slate-600 dark:text-white/80 mt-2 font-medium opacity-90">
                  Para actualizar el estado a <span className="font-bold text-teal-500">Enviado</span>, es obligatorio cumplir con las reglas del negocio:
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-white/10 dark:bg-black text-base font-semibold space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-slate-800 dark:text-white font-bold">Requisito 1: Pago y Estado</span>
                {orderToDispatch.status === 'En proceso' ? (
                  <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-md text-xs uppercase font-bold tracking-wider">✓ Cumplido</span>
                ) : (
                  <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-md text-xs uppercase font-bold tracking-wider">✗ Requerido ({orderToDispatch.status})</span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-white/70 leading-relaxed -mt-3 font-normal opacity-90">
                El pedido debe estar pagado (estado "En proceso") para poder realizar el envío.
              </p>

              <div className="border-t border-slate-200/45 dark:border-white/10 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-800 dark:text-white font-bold">Requisito 2: Prueba de Envío</span>
                  {dispatchFile ? (
                    <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-md text-xs uppercase font-bold tracking-wider">✓ Cargado</span>
                  ) : (
                    <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-md text-xs uppercase font-bold tracking-wider">✗ Obligatorio</span>
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
                  className="w-full text-base text-slate-700 dark:text-white/90 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-500/10 file:text-teal-650 hover:file:bg-teal-500/20 file:cursor-pointer cursor-pointer border border-dashed border-slate-300 dark:border-white/10 rounded-xl p-3 bg-white dark:bg-black"
                  disabled={orderToDispatch.status !== 'En proceso'}
                />
                <p className="text-sm text-slate-500 dark:text-white/60 mt-2 font-medium opacity-85">
                  Soporta imágenes (JPEG, PNG, WEBP) o documentos PDF de hasta 5 MB.
                </p>
              </div>
            </div>

            {dispatchError && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-650 dark:text-red-300 text-sm font-semibold">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                <span>{dispatchError}</span>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-5 border-t border-slate-100 dark:border-neutral-900">
              <button
                type="button"
                onClick={() => setOrderToDispatch(null)}
                disabled={isDispatching}
                className="border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10 px-6 py-3 rounded-xl text-base font-bold transition cursor-pointer bg-transparent"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDispatch()}
                disabled={isDispatching || orderToDispatch.status !== 'En proceso' || !dispatchFile}
                className={`border font-bold px-6 py-3 rounded-xl text-base transition-all duration-200 ${
                  (isDispatching || orderToDispatch.status !== 'En proceso' || !dispatchFile)
                    ? 'bg-slate-100 dark:bg-white/5 text-slate-450 dark:text-white/30 border-slate-200 dark:border-white/10 cursor-not-allowed opacity-60'
                    : 'bg-teal-650 hover:bg-teal-700 text-white border-teal-650 hover:border-teal-700 cursor-pointer shadow-lg shadow-teal-500/20 active:scale-95'
                }`}
              >
                {isDispatching ? 'Despachando...' : 'Confirmar Envío'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!orderToDeliver}
        title="Registrar Entrega del Pedido"
        onClose={() => setOrderToDeliver(null)}
        className="max-w-3xl p-8 md:p-10"
      >
        {orderToDeliver && (
          <div className="space-y-6 text-left">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg md:text-xl font-medium text-slate-900 dark:text-white leading-snug">
                  ¿Registrar entrega para el pedido {orderToDeliver.trackingCode || orderToDeliver.id}?
                </h4>
                <p className="text-base text-slate-605 dark:text-white/80 mt-2 font-medium opacity-90">
                  Para actualizar el estado a <span className="font-bold text-emerald-500">Entregado</span>, debes subir los soportes correspondientes:
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-white/10 dark:bg-black text-base font-semibold space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-slate-800 dark:text-white font-bold">Estado del Pedido</span>
                {orderToDeliver.status === 'Enviado' ? (
                  <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-md text-xs uppercase font-bold tracking-wider">✓ Listo</span>
                ) : (
                  <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-md text-xs uppercase font-bold tracking-wider">✗ Requerido ({orderToDeliver.status})</span>
                )}
              </div>

              <div className="border-t border-slate-200/45 dark:border-white/10 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-800 dark:text-white font-bold">1. Foto de la Entrega</span>
                  {deliveryPhotoFile ? (
                    <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-md text-xs uppercase font-bold tracking-wider">✓ Cargado</span>
                  ) : (
                    <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-md text-xs uppercase font-bold tracking-wider">✗ Requerido</span>
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
                  className="w-full text-base text-slate-700 dark:text-white/90 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-500/10 file:text-teal-655 hover:file:bg-teal-500/20 file:cursor-pointer cursor-pointer border border-dashed border-slate-300 dark:border-white/10 rounded-xl p-3 bg-white dark:bg-black"
                  disabled={orderToDeliver.status !== 'Enviado'}
                />
                <p className="text-sm text-slate-500 dark:text-white/60 mt-2 font-medium opacity-85">
                  Soporta imágenes (JPEG, PNG, WEBP) de hasta 5 MB.
                </p>
              </div>

              <div className="border-t border-slate-200/45 dark:border-white/10 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-800 dark:text-white font-bold">2. Firma del Cliente</span>
                  {customerSignatureFile ? (
                    <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-md text-xs uppercase font-bold tracking-wider">✓ Cargado</span>
                  ) : (
                    <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-md text-xs uppercase font-bold tracking-wider">✗ Requerido</span>
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
                  className="w-full text-base text-slate-700 dark:text-white/90 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-500/10 file:text-teal-655 hover:file:bg-teal-500/20 file:cursor-pointer cursor-pointer border border-dashed border-slate-300 dark:border-white/10 rounded-xl p-3 bg-white dark:bg-black"
                  disabled={orderToDeliver.status !== 'Enviado'}
                />
                <p className="text-sm text-slate-500 dark:text-white/60 mt-2 font-medium opacity-85">
                  Soporta imágenes (JPEG, PNG, WEBP) o documentos PDF de hasta 5 MB.
                </p>
              </div>
            </div>

            {deliveryError && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-650 dark:text-red-300 text-sm font-semibold">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                <span>{deliveryError}</span>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-5 border-t border-slate-100 dark:border-neutral-900">
              <button
                type="button"
                onClick={() => setOrderToDeliver(null)}
                disabled={isDelivering}
                className="border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10 px-6 py-3 rounded-xl text-base font-bold transition cursor-pointer bg-transparent"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelivery()}
                disabled={isDelivering || orderToDeliver.status !== 'Enviado' || !deliveryPhotoFile || !customerSignatureFile}
                className={`border font-bold px-6 py-3 rounded-xl text-base transition-all duration-200 ${
                  (isDelivering || orderToDeliver.status !== 'Enviado' || !deliveryPhotoFile || !customerSignatureFile)
                    ? 'bg-slate-100 dark:bg-white/5 text-slate-450 dark:text-white/30 border-slate-200 dark:border-white/10 cursor-not-allowed opacity-60'
                    : 'bg-teal-650 hover:bg-teal-700 text-white border-teal-650 hover:border-teal-700 cursor-pointer shadow-lg shadow-teal-500/20 active:scale-95'
                }`}
              >
                {isDelivering ? 'Procesando...' : 'Confirmar Entrega'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!orderToCancel}
        title="Cancelar Pedido de Cliente"
        onClose={() => setOrderToCancel(null)}
        className="max-w-3xl p-8 md:p-10"
      >
        {orderToCancel && (
          <div className="space-y-6 text-left">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
                <XCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg md:text-xl font-medium text-slate-900 dark:text-white leading-snug">
                  ¿Confirmas la cancelación del pedido {orderToCancel.trackingCode || orderToCancel.id}?
                </h4>
                <p className="text-base text-slate-655 dark:text-white/80 mt-2 leading-relaxed opacity-90 font-medium">
                  Esta acción actualizará el estado del pedido a <span className="font-bold text-rose-500">Cancelado</span> y liberará los recursos. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            {cancelError && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-650 dark:text-red-300 text-sm font-semibold">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-5 border-t border-slate-100 dark:border-neutral-900">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                disabled={isCancelling}
                className="border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10 px-6 py-3 rounded-xl text-base font-bold transition cursor-pointer bg-transparent"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmCancel()}
                disabled={isCancelling}
                className={`border font-bold px-6 py-3 rounded-xl text-base transition-all duration-200 ${
                  isCancelling
                    ? 'bg-slate-100 dark:bg-white/5 text-slate-450 dark:text-white/30 border-slate-200 dark:border-white/10 cursor-not-allowed opacity-60'
                    : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 hover:border-rose-700 cursor-pointer shadow-lg shadow-rose-500/20 active:scale-95'
                }`}
              >
                {isCancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        )}
      </Modal>

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
                {toastMessage.toLowerCase().includes('despachado')
                  ? '¡PEDIDO DESPACHADO!'
                  : toastMessage.toLowerCase().includes('entrega')
                  ? '¡ENTREGA REGISTRADA!'
                  : '¡PEDIDO CANCELADO!'}
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
    </PageCard>
  );
};


