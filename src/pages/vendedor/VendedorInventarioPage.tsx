import { useEffect, useState } from 'react';
import { Boxes, PencilLine } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { Modal } from '../../components/ui/Modal';
import { PageCard } from '../../components/ui/PageCard';
import { getCatalogComponents, updateCatalogComponent } from '../../services/catalogService';
import type { CatalogComponent, CatalogStockStatus } from '../../types/catalog';

const statusLabel: Record<CatalogStockStatus, string> = {
  disponible: 'Disponible',
  'stock-bajo': 'Stock bajo',
  agotado: 'Agotado',
};

const statusStyle: Record<CatalogStockStatus, string> = {
  disponible: 'bg-emerald-400/10 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-200',
  'stock-bajo': 'bg-amber-400/10 text-amber-700 ring-amber-500/20 dark:bg-amber-500/15 dark:text-amber-200',
  agotado: 'bg-rose-400/10 text-rose-700 ring-rose-500/20 dark:bg-rose-500/15 dark:text-rose-200',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

export const VendedorInventarioPage = () => {
  const [items, setItems] = useState<CatalogComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CatalogComponent | null>(null);
  const [stockValue, setStockValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadInventory = async () => {
      try {
        const response = await getCatalogComponents({ page: 1, limit: 100 });
        if (!isMounted) return;
        setItems(response.items);
        setPageError('');
      } catch {
        if (!isMounted) return;
        setPageError('No fue posible sincronizar inventario con backend. Verifica la conexion e intenta de nuevo.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadInventory();

    return () => {
      isMounted = false;
    };
  }, []);

  const openEdit = (item: CatalogComponent) => {
    setSelectedItem(item);
    setStockValue(item.stock.toString());
    setFormError('');
  };

  const closeEdit = () => {
    setSelectedItem(null);
    setStockValue('');
    setFormError('');
    setIsSaving(false);
  };

  const saveInventory = async () => {
    if (!selectedItem) return;

    const parsedStock = Number(stockValue);
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      setFormError('Ingresa un stock valido.');
      return;
    }

    const normalizedStock = Math.trunc(parsedStock);

    try {
      setIsSaving(true);
      setFormError('');

      const updated = await updateCatalogComponent(selectedItem.id, {
        stock: normalizedStock,
      });

      setItems((current) => current.map((item) => (item.id === selectedItem.id ? updated : item)));
      closeEdit();
    } catch {
      setFormError('No se pudo actualizar el inventario del componente.');
      setIsSaving(false);
    }
  };

  return (
    <PageCard
      title="Inventario de componentes"
      text="Consulta stock disponible y actualiza existencias por producto."
      icon={<Boxes className="h-6 w-6" />}
    >
      {pageError && (
        <div className="mb-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
          {pageError}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.03] dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-bold">Componente</th>
                <th className="px-4 py-3 font-bold">Categoria</th>
                <th className="px-4 py-3 font-bold">Marca</th>
                <th className="px-4 py-3 font-bold">Precio</th>
                <th className="px-4 py-3 font-bold">Stock</th>
                <th className="px-4 py-3 font-bold">Estado</th>
                <th className="px-4 py-3 text-right font-bold">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {items.map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-950 dark:text-white">{item.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">{item.description}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">{item.category}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">{item.brand}</td>
                  <td className="px-4 py-3 font-semibold text-teal-700 dark:text-teal-300">{formatCurrency(item.price)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-neutral-200">{item.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusStyle[item.status]}`}>
                      {statusLabel[item.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-teal-500/60 hover:bg-teal-50 hover:text-teal-700 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 dark:hover:text-teal-200"
                        onClick={() => openEdit(item)}
                        aria-label={`Actualizar inventario de ${item.name}`}
                      >
                        <PencilLine className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
                    Cargando inventario...
                  </td>
                </tr>
              )}

              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
                    No hay componentes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={Boolean(selectedItem)}
        title="Actualizar inventario"
        text="Edita el stock del componente."
        onClose={closeEdit}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeEdit}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveInventory()} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Componente"
            value={selectedItem?.name ?? ''}
            disabled
          />
          <FormInput
            label="Stock"
            value={stockValue}
            onChange={(event) => setStockValue(event.target.value)}
            inputMode="numeric"
          />
        </div>

        {formError && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {formError}
          </div>
        )}
      </Modal>
    </PageCard>
  );
};
