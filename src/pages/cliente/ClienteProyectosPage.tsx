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
  DollarSign,
  AlertTriangle,
  PackageOpen,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useCart } from '../../context/CartContext';
import type { CatalogComponent } from '../../types/catalog';
import { ComponenteDetalleDrawer } from './ComponenteDetalleDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { getProjects } from '../../services/projectsService';
import type { BackendProject } from '../../services/projectsService';
import { getCatalogComponentById } from '../../services/catalogService';

interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  totalPrice: number;
  componentsMap: Record<string, CatalogComponent>;
}

const mapBackendProjects = (
  backendProjects: BackendProject[],
  catalog: CatalogComponent[]
): SavedProject[] => {
  return backendProjects.map((bp) => {
    const componentsMap: Record<string, CatalogComponent> = {};
    let ramIndex = 1;
    let totalPrice = 0;
    
    bp.items.forEach((item) => {
      const catalogComp = catalog.find((c) => c.id === item.productId);
      if (catalogComp) {
        const qty = Number(item.quantity) || 1;
        for (let i = 0; i < qty; i++) {
          let slotId: string;
          if (catalogComp.categorySlug === 'memorias-ram') {
            slotId = `ram_${ramIndex}`;
            ramIndex++;
          } else {
            const standardSlots: Record<string, string> = {
              'gabinetes': 'case',
              'fuentes-de-poder': 'psu',
              'placas-madre': 'motherboard',
              'procesadores': 'cpu',
              'tarjetas-graficas': 'gpu',
              'almacenamiento': 'storage',
              'refrigeracion': 'cooler'
            };
            slotId = standardSlots[catalogComp.categorySlug] || catalogComp.categorySlug;
          }
          
          if (slotId) {
            componentsMap[slotId] = catalogComp;
          }
        }
        totalPrice += catalogComp.price * qty;
      } else {
        const priceNum = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
        const fallbackComp: CatalogComponent = {
          id: item.productId,
          name: item.product.name,
          description: '',
          category: 'Componente',
          categorySlug: 'componente',
          categoryId: '',
          brand: '',
          price: priceNum || 0,
          stock: 0,
          status: 'agotado',
          imageUrl: item.product.imageUrl || '',
          model: '',
          sku: item.product.sku || '',
          attributes: [],
          sellerId: ''
        };
        componentsMap[item.productId] = fallbackComp;
        totalPrice += fallbackComp.price * (Number(item.quantity) || 1);
      }
    });
    
    return {
      id: bp.id,
      name: bp.name,
      createdAt: bp.createdAt,
      totalPrice: totalPrice,
      componentsMap
    };
  });
};

const SLOT_NAMES_ES: Record<string, string> = {
  case: 'Gabinete',
  psu: 'Fuente de poder',
  motherboard: 'Placa madre',
  cpu: 'Procesador',
  gpu: 'Tarjeta gráfica',
  storage: 'Almacenamiento',
  cooler: 'Refrigeración',
};

const getFriendlySlotName = (slotId: string): string => {
  if (slotId.startsWith('ram_')) {
    const num = slotId.split('_')[1];
    return `Memoria RAM ${num}`;
  }
  return SLOT_NAMES_ES[slotId] || slotId;
};

export const ClienteProyectosPage = () => {
  const navigate = useNavigate();
  const { addMultipleToCart } = useCart();
  
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [projectToDelete, setProjectToDelete] = useState<SavedProject | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [buyingProjectId, setBuyingProjectId] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<CatalogComponent | null>(null);

  useEffect(() => {
    const fetchProjectsData = async () => {
      try {
        setLoading(true);
        const backendProjects = await getProjects();
        let activeProjects = backendProjects;
        try {
          const deletedIds = JSON.parse(localStorage.getItem('neohw_deleted_project_ids') || '[]');
          const deletedSet = new Set<string>(deletedIds);
          activeProjects = backendProjects.filter((p) => !deletedSet.has(p.id));
        } catch (e) {
          console.error(e);
        }
        const uniqueProductIds = Array.from(
          new Set(activeProjects.flatMap((p) => p.items.map((item) => item.productId)))
        );
        const catalogItemsResult = await Promise.allSettled(
          uniqueProductIds.map((id) => getCatalogComponentById(id))
        );
        const catalogItems = catalogItemsResult
          .filter((res): res is PromiseFulfilledResult<CatalogComponent> => res.status === 'fulfilled')
          .map((res) => res.value);
        const mapped = mapBackendProjects(activeProjects, catalogItems);
        setProjects(mapped);
      } catch (e) {
        console.error('Error al cargar proyectos guardados:', e);
      } finally {
        setLoading(false);
      }
    };
    void fetchProjectsData();
  }, []);

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
    if (!projectToDelete) return;
    try {
      const deletedIds = JSON.parse(localStorage.getItem('neohw_deleted_project_ids') || '[]');
      deletedIds.push(projectToDelete.id);
      localStorage.setItem('neohw_deleted_project_ids', JSON.stringify(deletedIds));
    } catch (e) {
      console.error(e);
    }
    const updated = projects.filter((p) => p.id !== projectToDelete.id);
    setProjects(updated);
    showToast(`Proyecto "${projectToDelete.name}" eliminado de tu cuenta.`);
    setProjectToDelete(null);
  };

  const handleLoadInSimulator = (project: SavedProject) => {
    navigate('/cliente/simulador', { state: { loadProject: project } });
  };

  const handleBuyProject = async (project: SavedProject) => {
    if (buyingProjectId) return;
    const items = Object.values(project.componentsMap);
    if (items.length === 0) {
      showToast('Este proyecto no tiene componentes seleccionados.');
      return;
    }

    const eligibleItems = items.filter((prod) => prod && prod.stock > 0);

    if (eligibleItems.length > 0) {
      try {
        setBuyingProjectId(project.id);
        await addMultipleToCart(eligibleItems);
        navigate('/cliente/carrito');
      } catch (err) {
        console.error(err);
        showToast('Error al añadir componentes al carrito.');
      } finally {
        setBuyingProjectId(null);
      }
    } else {
      showToast('No se pudieron agregar los componentes al carrito (sin stock disponible).');
    }
  };

  if (loading) {
    return (
      <div className="w-full pb-16 text-slate-900 dark:text-neutral-100 pt-5">
        <div className="flex flex-col items-center justify-center py-20 text-center border border-slate-200 rounded-xl bg-white dark:border-neutral-900 dark:bg-neutral-950/20 animate-pulse">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent mb-4" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-neutral-300">Cargando tus proyectos...</h3>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="w-full pb-16 text-slate-900 dark:text-neutral-100 pt-2">
        <div className="flex h-96 flex-col items-center justify-between rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-white/50 p-8 text-center dark:bg-neutral-900/10 max-w-2xl mx-auto py-16">
          <FolderHeart className="h-16 w-16 text-teal-500" />
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">No tienes proyectos guardados</h3>
            <p className="text-base text-slate-955 dark:text-white mt-2 max-w-md leading-relaxed">
              Aún no has guardado ninguna configuración de hardware en el simulador 3D. 
              Crea tu PC ideal con la validación de compatibilidad por Inteligencia Artificial y guárdala aquí.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/cliente/simulador')}
            className="flex items-center justify-center gap-2 rounded-lg border border-teal-500 text-teal-600 bg-transparent hover:bg-teal-500 hover:text-white dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-400 dark:hover:text-neutral-955 font-bold px-6 py-3 transition shadow-sm mt-6 text-sm cursor-pointer"
          >
            <Cpu className="h-4 w-4" />
            Ir al Simulador 3D IA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-16 text-slate-900 dark:text-neutral-100 pt-2">
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
                {toastMessage.toLowerCase().includes('eliminado') ? '¡ENSAMBLE ELIMINADO!' : '¡PROYECTO ACTUALIZADO!'}
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

      <div className="mb-3 flex items-center justify-end pb-2 border-b border-slate-100 dark:border-neutral-900">
        <button
          type="button"
          onClick={() => navigate('/cliente/simulador')}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-955 text-slate-955 bg-transparent hover:bg-teal-500 hover:border-teal-500 hover:text-slate-955 dark:border-white dark:text-white dark:hover:bg-teal-500 dark:hover:border-teal-500 dark:hover:text-white font-bold px-4 py-2.5 transition text-sm cursor-pointer"
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
              <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[250px]">
                  <div className="flex items-center gap-2">
                    <FolderHeart className="h-5 w-5 text-teal-500" />
                    <h3 className="text-xl font-bold text-slate-955 dark:text-white truncate">
                      {project.name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm font-semibold text-slate-955 dark:text-white">
                    <span className="flex items-center gap-1.5">
                      <PackageOpen className="h-4 w-4 text-teal-500" />
                      {componentCount} componentes
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-right">
                    <span className="text-sm text-slate-955 dark:text-white uppercase tracking-wider block font-bold">
                      Costo Estimado
                    </span>
                    <span className="text-xl font-bold text-slate-955 dark:text-white flex items-center justify-end">
                      <DollarSign className="h-5 w-5 -mr-0.5" />
                      {project.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadInSimulator(project)}
                      title="Cargar en el simulador 3D"
                      className="h-10 px-4 rounded-lg border border-slate-955 text-slate-955 bg-transparent hover:bg-teal-500 hover:border-teal-500 hover:text-slate-955 dark:border-white dark:text-white dark:hover:bg-teal-500 dark:hover:border-teal-500 dark:hover:text-white transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Simular
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBuyProject(project)}
                      disabled={buyingProjectId !== null}
                      title="Añadir todas las partes al carrito"
                      className="h-10 px-4 rounded-lg border border-slate-955 text-slate-955 bg-transparent hover:bg-teal-500 hover:border-teal-500 hover:text-slate-955 dark:border-white dark:text-white dark:hover:bg-teal-500 dark:hover:border-teal-500 dark:hover:text-white transition text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {buyingProjectId === project.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500 dark:text-white" />
                          Cargando...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Comprar todo
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectToDelete(project)}
                      title="Eliminar proyecto"
                      className="h-10 w-10 flex items-center justify-center rounded-lg border border-red-600 text-red-600 bg-transparent hover:bg-red-600 hover:text-white dark:border-white dark:text-white dark:hover:bg-red-600 dark:hover:border-red-600 dark:hover:text-white transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(project.id)}
                      className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-955 text-slate-955 bg-transparent hover:bg-teal-500 hover:border-teal-500 hover:text-slate-955 dark:border-white dark:text-white dark:hover:bg-teal-500 dark:hover:border-teal-500 dark:hover:text-white transition cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-neutral-900 bg-slate-50/50 dark:bg-neutral-950/40 p-5">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-955 dark:text-white mb-3 px-1">
                    Componentes Seleccionados
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(project.componentsMap).map(([slotId, component]) => (
                      <div
                        key={slotId}
                        className="group relative flex flex-col md:flex-row items-center gap-5 rounded-xl border border-slate-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900/20 p-4 shadow-sm transition-all duration-300 hover:border-teal-500/40 hover:shadow-md"
                      >
                        {/* Left Side: Product image with fallback */}
                        <div
                          className="flex h-24 w-24 md:h-28 md:w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-neutral-900/50 cursor-pointer"
                          onClick={() => setSelectedComponent(component)}
                        >
                          <img
                            src={component.imageUrl || '/favicon.jpg'}
                            alt={component.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/favicon.jpg';
                            }}
                          />
                        </div>

                        {/* Center Side: Divided into 2 columns on desktop (Info left, Description right) */}
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
                          {/* Info Column (Left) */}
                          <div className="min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                <h4
                                  className="text-lg md:text-xl font-bold text-slate-955 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition cursor-pointer truncate"
                                  onClick={() => setSelectedComponent(component)}
                                >
                                  {component.name}
                                </h4>
                                <span
                                  className={`text-sm font-bold uppercase tracking-wider ${
                                    component.stock > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {component.stock > 0 ? 'Disponible' : 'Agotado'}
                                </span>
                              </div>

                              <div className="text-sm md:text-base font-bold text-slate-955 dark:text-white uppercase tracking-wider mb-2">
                                Ranura: <span className="capitalize text-teal-600 dark:text-teal-400">{getFriendlySlotName(slotId)}</span>
                              </div>
                            </div>

                            {/* Specifications grid (2 columns, up to 4 attributes, 2 on top and 2 below) */}
                            {component.attributes && component.attributes.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-neutral-900/50 text-sm md:text-base">
                                {component.attributes.slice(0, 4).map((attr, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-955 dark:text-white">{attr.name}:</span>
                                    <span className="text-slate-955 dark:text-white font-medium">{attr.value} {attr.unit || ''}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Description Column (Right) */}
                          <div className="flex flex-col justify-start lg:justify-center min-w-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-neutral-900/50 pt-3 lg:pt-0 lg:pl-6">
                            <span className="text-xs font-bold text-slate-955 dark:text-white uppercase tracking-wider mb-1 block">
                              Descripción
                            </span>
                            {component.description ? (
                              <p className="text-sm md:text-base text-slate-955 dark:text-white font-normal leading-relaxed line-clamp-4">
                                {component.description}
                              </p>
                            ) : (
                              <p className="text-sm text-slate-400 dark:text-neutral-500 italic">
                                Sin descripción disponible
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Side: Price & Actions */}
                        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 w-full md:w-auto shrink-0 md:border-l border-slate-100 dark:border-neutral-800 md:pl-5 min-w-[120px]">
                          <span className="text-lg md:text-xl font-bold text-slate-955 dark:text-white">
                            ${component.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedComponent(component)}
                            className="w-full md:w-auto rounded-lg border border-slate-955 dark:border-neutral-700 px-4 py-2.5 text-center text-sm font-bold hover:bg-slate-50 dark:hover:bg-neutral-900 transition text-slate-955 dark:text-white whitespace-nowrap cursor-pointer"
                          >
                            Ver detalles
                          </button>
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
              <p className="text-base font-bold text-slate-955 dark:text-white">
                ¿Estás seguro de que deseas eliminar este proyecto?
              </p>
              <p className="text-sm text-slate-955 dark:text-white mt-1 leading-relaxed">
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
              className="rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 transition text-sm shadow-sm"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </Modal>

      {selectedComponent && (
        <ComponenteDetalleDrawer
          componente={selectedComponent}
          open={!!selectedComponent}
          onClose={() => setSelectedComponent(null)}
        />
      )}
    </div>
  );
};
