import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  FolderHeart,
  Cpu,
  Trash2,
  Play,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  PackageOpen
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { getStoredSession } from '../../services/session';
import { useCart } from '../../context/CartContext';
import type { CatalogComponent } from '../../types/catalog';

interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  totalPrice: number;
  componentsMap: Record<string, CatalogComponent>;
}

export const ClienteProyectosPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  
  
  const [projectToDelete, setProjectToDelete] = useState<SavedProject | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const session = getStoredSession();
  const userId = session?.user.id;

  
  useEffect(() => {
    if (!userId) return;
    try {
      const stored = localStorage.getItem(`neohw_proyectos_${userId}`);
      if (stored) {
        setProjects(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error al cargar proyectos guardados:', e);
    }
  }, [userId]);

  
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  
  const toggleExpand = (id: string) => {
    setExpandedProjectId(expandedProjectId === id ? null : id);
  };

  
  const handleDeleteConfirm = () => {
    if (!projectToDelete || !userId) return;
    
    const updated = projects.filter((p) => p.id !== projectToDelete.id);
    setProjects(updated);
    try {
      localStorage.setItem(`neohw_proyectos_${userId}`, JSON.stringify(updated));
      showToast(`Proyecto "${projectToDelete.name}" eliminado correctamente.`);
    } catch (e) {
      console.error('Error al eliminar proyecto:', e);
    }
    setProjectToDelete(null);
  };

  
  const handleLoadInSimulator = (project: SavedProject) => {
    navigate('/cliente/simulador', { state: { loadProjectId: project.id } });
  };

  
  const handleBuyProject = (project: SavedProject) => {
    const items = Object.values(project.componentsMap);
    if (items.length === 0) {
      showToast('Este proyecto no tiene componentes seleccionados.');
      return;
    }

    let addedCount = 0;
    items.forEach((prod) => {
      if (prod && prod.stock > 0) {
        addToCart(prod);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      navigate('/cliente/carrito');
    } else {
      showToast('No se pudieron agregar los componentes al carrito (sin stock disponible).');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-7xl pb-16 text-slate-900 dark:text-neutral-100">
        <div className="mb-8 border-b border-slate-100 dark:border-neutral-900 pb-6">
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white leading-none">
            Proyectos de Ensamblaje
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2 font-medium">
            Administra tus configuraciones personalizadas de PC y simula o compra en cualquier momento.
          </p>
        </div>

        <div className="flex h-96 flex-col items-center justify-between rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-white/50 p-8 text-center dark:bg-neutral-900/10 max-w-2xl mx-auto py-16">
          <FolderHeart className="h-16 w-16 text-slate-300 dark:text-neutral-700" />
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">No tienes proyectos guardados</h3>
            <p className="text-sm text-slate-400 dark:text-neutral-500 mt-2 max-w-md">
              Aún no has guardado ninguna configuración de hardware en el simulador 3D. 
              Crea tu PC ideal con la validación de compatibilidad por Inteligencia Artificial y guárdala aquí.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/cliente/simulador')}
            className="flex items-center justify-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold px-6 py-3 transition shadow-sm mt-6 text-sm"
          >
            <Cpu className="h-4 w-4" />
            Ir al Simulador 3D IA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl pb-16 text-slate-900 dark:text-neutral-100">
      {}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-teal-500/30 bg-neutral-900 px-4 py-3 shadow-2xl animate-fade-in-up">
          <CheckCircle2 className="h-4 w-4 text-teal-400" />
          <span className="text-xs font-bold text-neutral-200">{toastMessage}</span>
        </div>
      )}

      <div className="mb-8 border-b border-slate-100 dark:border-neutral-900 pb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white leading-none">
            Proyectos de Ensamblaje
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2 font-medium">
            Administra tus configuraciones personalizadas de PC, simula en 3D o agrégalas al carrito de compras.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/cliente/simulador')}
          className="flex items-center justify-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2.5 transition shadow-sm text-xs"
        >
          <Cpu className="h-4 w-4" />
          Nuevo Ensamble
        </button>
      </div>

      <div className="space-y-4">
        {projects.map((project) => {
          const isExpanded = expandedProjectId === project.id;
          const componentCount = Object.keys(project.componentsMap).length;

          return (
            <div
              key={project.id}
              className="rounded-xl border border-slate-200 dark:border-neutral-850 bg-white dark:bg-neutral-950/20 shadow-sm overflow-hidden transition-all duration-300 hover:border-teal-500/40"
            >
              {}
              <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[250px]">
                  <div className="flex items-center gap-2">
                    <FolderHeart className="h-5 w-5 text-teal-500" />
                    <h3 className="text-lg font-extrabold text-slate-950 dark:text-white truncate">
                      {project.name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(project.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <PackageOpen className="h-3.5 w-3.5" />
                      {componentCount} componentes
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 dark:text-neutral-500 uppercase tracking-wider block font-bold">
                      Costo Estimado
                    </span>
                    <span className="text-lg font-black text-teal-500 dark:text-teal-400 flex items-center justify-end">
                      <DollarSign className="h-4 w-4 -mr-0.5" />
                      {project.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadInSimulator(project)}
                      title="Cargar en el simulador 3D"
                      className="h-10 px-4 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-500 hover:bg-teal-500/25 transition text-xs font-bold flex items-center gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Simular
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBuyProject(project)}
                      title="Añadir todas las partes al carrito"
                      className="h-10 px-4 rounded-lg bg-teal-500 hover:bg-teal-600 text-white transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Comprar todo
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectToDelete(project)}
                      title="Eliminar proyecto"
                      className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-500 hover:text-red-500 hover:bg-red-500/10 dark:text-neutral-400 dark:hover:text-red-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(project.id)}
                      className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-900 transition"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-neutral-900 bg-slate-50/50 dark:bg-neutral-950/40 p-5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-3 px-1">
                    Componentes Seleccionados
                  </h4>
                  <div className="divide-y divide-slate-150 dark:divide-neutral-900/60 max-w-5xl">
                    {Object.entries(project.componentsMap).map(([slotId, component]) => (
                      <div
                        key={slotId}
                        className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden flex items-center justify-center shrink-0">
                            {component.imageUrl ? (
                              <img
                                src={component.imageUrl}
                                alt={component.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  
                                  e.currentTarget.src = '';
                                  e.currentTarget.className = 'hidden';
                                }}
                              />
                            ) : (
                              <Cpu className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-slate-950 dark:text-white truncate">
                              {component.name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                              Slot: <span className="capitalize font-bold text-teal-500">{slotId.replace('_', ' ')}</span> • Marca: <span className="font-bold">{component.brand}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-4">
                          <div>
                            <span className="text-sm font-black text-slate-950 dark:text-white">
                              ${component.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span
                              className={`text-[8px] font-bold block mt-0.5 uppercase tracking-wider ${
                                component.stock > 0 ? 'text-emerald-500' : 'text-rose-500'
                              }`}
                            >
                              {component.stock > 0 ? `Stock: ${component.stock}` : 'Sin stock'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {}
      <Modal
        open={!!projectToDelete}
        title="¿Eliminar Proyecto?"
        onClose={() => setProjectToDelete(null)}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                ¿Estás seguro de que deseas eliminar este proyecto?
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Esta acción no se puede deshacer. El proyecto "{projectToDelete?.name}" se borrará permanentemente de tu cuenta.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProjectToDelete(null)}
            >
              Cancelar
            </Button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 transition text-xs shadow-sm"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
