import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import {
  RotateCw,
  Crosshair,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  ShieldCheck,
  Wrench,
  MoreVertical,
  ExternalLink,
  Info,
  Circle,
  ShoppingCart,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import Scene from './components/Scene';
import { ASSEMBLY_SEQUENCE, PC_COMPONENTS } from './data/components';
import type { PCComponent, ComponentState, CameraAction } from './types';
import { getCatalogComponents } from '../../services/catalogService';
import { checkCompatibility, getCompatibilityRules } from '../../services/compatibilityService';
import { streamAiChat } from '../../services/aiService';
import type { CatalogComponent } from '../../types/catalog';
import type { CompatibilityRule, CompatibilityCheckResult } from '../../services/compatibilityService';
import type { ChatMessage } from '../../services/aiService';
import { useCart } from '../../context/CartContext';
import { getStoredSession } from '../../services/session';

const STATE_CONFIG: Record<ComponentState, { label: string; cls: string; dot: string }> = {
  installed: {
    label: 'Instalado',
    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    dot: 'bg-emerald-500',
  },
  available: {
    label: 'Lista para instalar',
    cls: 'bg-teal-500/10 text-teal-400 border-teal-500/25',
    dot: 'bg-teal-500',
  },
  installing: {
    label: 'Instalando...',
    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse',
    dot: 'bg-amber-500',
  },
  locked: {
    label: 'Pendiente',
    cls: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
    dot: 'bg-orange-500',
  },
  incompatible: {
    label: 'Incompatible',
    cls: 'bg-red-500/10 text-red-400 border-red-500/25',
    dot: 'bg-red-500',
  },
};

const LEGEND = [
  { label: 'Instalado', color: 'bg-emerald-500' },
  { label: 'Lista para instalar', color: 'bg-teal-500' },
  { label: 'Pendiente', color: 'bg-orange-500' },
  { label: 'Bloqueado', color: 'bg-slate-500' },
  { label: 'Incompatible', color: 'bg-red-500' },
];

function recalcStates(
  currentStates: Record<string, ComponentState>,
  allComps: PCComponent[],
): Record<string, ComponentState> {
  const installed = new Set<string>();
  Object.entries(currentStates).forEach(([k, v]) => {
    if (v === 'installed') installed.add(k);
  });

  const out: Record<string, ComponentState> = {};
  let changed = true;
  while (changed) {
    changed = false;
    allComps.forEach((c) => {
      if (installed.has(c.id)) {
        out[c.id] = 'installed';
        return;
      }
      if (currentStates[c.id] === 'installing') {
        out[c.id] = 'installing';
        return;
      }
      const depOk = !c.requiredAfter || installed.has(c.requiredAfter);
      if (depOk && c.hidden) {
        out[c.id] = 'installed';
        installed.add(c.id);
        changed = true;
      } else if (depOk) {
        out[c.id] = 'available';
      } else {
        out[c.id] = 'locked';
      }
    });
  }
  return out;
}

function getInitialStates(): Record<string, ComponentState> {
  return recalcStates({ case: 'installed' }, PC_COMPONENTS);
}

export const SimulatorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const session = getStoredSession();
  const userId = session?.user.id;

  const [components, setComponents] = useState<PCComponent[]>(PC_COMPONENTS);
  const [assemblyStates, setAssemblyStates] = useState<Record<string, ComponentState>>(getInitialStates);
  const [isAnimating, setIsAnimating] = useState(false);

  const [activeTab, setActiveTab] = useState<'assembly' | 'ai' | 'rules'>('assembly');

  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraAction, setCameraAction] = useState<CameraAction | null>(null);

  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [modalProducts, setModalProducts] = useState<CatalogComponent[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [compatibilityStatus, setCompatibilityStatus] = useState<{
    checked: boolean;
    compatible: boolean;
    results: CompatibilityCheckResult[];
  }>({ checked: false, compatible: true, results: [] });
  const [checkingCompat, setCheckingCompat] = useState(false);

  const [rules, setRules] = useState<CompatibilityRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy el **Arquitecto de Hardware de NeoHW**. 🧠\n\nPuedo ayudarte a buscar componentes en nuestro inventario real, sugerirte partes compatibles con tu configuración o resolver dudas técnicas sobre sockets, potencia y compatibilidad física. ¿Qué te gustaría armar hoy?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchRules = async () => {
      setLoadingRules(true);
      try {
        const res = await getCompatibilityRules();
        setRules(res.data);
      } catch {
        
      } finally {
        setRules((prev) =>
          prev.length > 0
            ? prev
            : [
                {
                  id: 'rule-socket',
                  name: 'Socket CPU-Mobo Match',
                  description: 'El procesador debe encajar en el socket de la placa madre.',
                  ruleType: 'MUST_MATCH',
                  sourceCategory: { id: 'cpu', name: 'Procesadores' },
                  targetCategory: { id: 'mobo', name: 'Placas Madre' },
                  sourceAttributeName: 'Socket',
                  targetAttributeName: 'Socket',
                  comparisonOperator: 'EQUALS',
                  isActive: true,
                },
                {
                  id: 'rule-ram',
                  name: 'RAM Type Match',
                  description: 'La placa madre debe soportar el tipo de memoria RAM (DDR4/DDR5).',
                  ruleType: 'MUST_MATCH',
                  sourceCategory: { id: 'ram', name: 'Memorias RAM' },
                  targetCategory: { id: 'mobo', name: 'Placas Madre' },
                  sourceAttributeName: 'Tipo de RAM',
                  targetAttributeName: 'Tipo de RAM',
                  comparisonOperator: 'EQUALS',
                  isActive: true,
                },
              ],
        );
        setLoadingRules(false);
      }
    };
    fetchRules();
  }, []);

  useEffect(() => {
    const run = async () => {
      const ids = components.map((c) => c.dbProduct?.id).filter((id): id is string => !!id);
      if (ids.length < 2) {
        setCompatibilityStatus({ checked: false, compatible: true, results: [] });
        return;
      }
      setCheckingCompat(true);
      try {
        const res = await checkCompatibility(ids);
        setCompatibilityStatus({ checked: true, compatible: res.compatible, results: res.results });
      } catch {
        
      } finally {
        setCheckingCompat(false);
      }
    };
    run();
  }, [components]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, aiLoading]);

  
  useEffect(() => {
    const loadProjectId = location.state?.loadProjectId;
    if (userId && loadProjectId) {
      try {
        const stored = localStorage.getItem(`neohw_proyectos_${userId}`);
        if (stored) {
          const projectsList = JSON.parse(stored);
          const project = projectsList.find((p: any) => p.id === loadProjectId);
          if (project) {
            const savedMap = project.componentsMap;
            setComponents((prev) =>
              prev.map((c) => {
                const savedProd = savedMap[c.id];
                return savedProd
                  ? { ...c, dbProduct: savedProd, selectedName: savedProd.name }
                  : { ...c, dbProduct: null, selectedName: '' };
              })
            );

            
            const newStates: Record<string, ComponentState> = { case: 'installed' };
            PC_COMPONENTS.forEach((c) => {
              if (savedMap[c.id]) {
                newStates[c.id] = 'installed';
              }
            });
            setAssemblyStates(recalcStates(newStates, PC_COMPONENTS));

            
            navigate(location.pathname, { replace: true, state: {} });

            setToastMessage(`Proyecto "${project.name}" cargado en el simulador.`);
            setTimeout(() => setToastMessage(null), 3000);
          }
        }
      } catch (e) {
        console.error('Error al cargar proyecto en el simulador:', e);
      }
    }
  }, [location.state, userId, navigate]);

  const handleOpenSaveModal = () => {
    setProjectName(`Ensamble NeoHW - ${new Date().toLocaleDateString('es-EC')}`);
    setIsSaveModalOpen(true);
  };

  const handleSaveProject = () => {
    if (!projectName.trim() || !userId) return;

    const selectedCompsMap: Record<string, CatalogComponent> = {};
    components.forEach((c) => {
      if (c.dbProduct) {
        selectedCompsMap[c.id] = c.dbProduct;
      }
    });

    const newProject = {
      id: crypto.randomUUID() || Date.now().toString(),
      name: projectName.trim(),
      createdAt: new Date().toISOString(),
      totalPrice: totalPrice,
      componentsMap: selectedCompsMap,
    };

    try {
      const stored = localStorage.getItem(`neohw_proyectos_${userId}`);
      const projectsList = stored ? JSON.parse(stored) : [];
      projectsList.unshift(newProject);
      localStorage.setItem(`neohw_proyectos_${userId}`, JSON.stringify(projectsList));

      setIsSaveModalOpen(false);
      setToastMessage(`Proyecto "${projectName}" guardado con éxito.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      console.error('Error al guardar el proyecto:', e);
    }
  };

  const handleDirectCheckout = () => {
    const selectedProds = components
      .map((c) => c.dbProduct)
      .filter((p): p is CatalogComponent => !!p);

    if (selectedProds.length === 0) return;

    selectedProds.forEach((prod) => {
      addToCart(prod);
    });

    navigate('/cliente/carrito');
  };

  const handleReset = () => {
    setComponents(PC_COMPONENTS.map((c) => ({ ...c, dbProduct: null })));
    setAssemblyStates(getInitialStates());
    setIsAnimating(false);
    setAutoRotate(false);
    setCameraAction({ type: 'reset', ts: Date.now() });
  };

  const completeInstall = useCallback((id: string) => {
    setIsAnimating(false);
    setAssemblyStates((prev) => {
      const next = { ...prev, [id]: 'installed' as ComponentState };
      return recalcStates(next, PC_COMPONENTS);
    });
  }, []);

  const startInstall = useCallback(
    (id: string) => {
      if (isAnimating) return;
      const comp = PC_COMPONENTS.find((c) => c.id === id);
      if (!comp) return;

      if (comp.hasModel === false) {
        setAssemblyStates((prev) => recalcStates({ ...prev, [id]: 'installed' }, PC_COMPONENTS));
        return;
      }

      setIsAnimating(true);
      setAssemblyStates((prev) => ({ ...prev, [id]: 'installing' }));
      setTimeout(() => {
        completeInstall(id);
      }, 1500);
    },
    [isAnimating, completeInstall],
  );

  const handleOpenSelectModal = async (slotId: string, catSlug: string) => {
    if (!catSlug) return;
    setActiveSlotId(slotId);
    setIsSelectModalOpen(true);
    setLoadingProducts(true);
    try {
      const res = await getCatalogComponents({ category: catSlug, limit: 50 });
      setModalProducts(res.items);
    } catch {
      
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSelectProduct = (product: CatalogComponent) => {
    if (!activeSlotId) return;
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id === activeSlotId) return { ...c, selectedName: product.name, dbProduct: product };
        if (activeSlotId.startsWith('ram_') && c.id.startsWith('ram_') && c.id !== activeSlotId && !c.dbProduct) {
          return { ...c, selectedName: product.name, dbProduct: product };
        }
        return c;
      }),
    );
    setIsSelectModalOpen(false);
    setActiveSlotId(null);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || aiLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setAiLoading(true);
    const updated: ChatMessage[] = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(updated);
    setChatMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
    try {
      await streamAiChat(
        updated,
        (chunk) => {
          setChatMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === 'assistant') last.content += chunk;
            return copy;
          });
        },
        () => setAiLoading(false),
        () => {
          setChatMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === 'assistant')
              last.content = '❌ Ocurrió un error al conectar con el asistente IA. Intente nuevamente.';
            return copy;
          });
          setAiLoading(false);
        },
      );
    } catch {
      setAiLoading(false);
    }
  };

  const visibleComponents = ASSEMBLY_SEQUENCE.filter((c) => !c.hidden);
  const installedCount = Object.values(assemblyStates).filter((s) => s === 'installed').length;
  const totalVisible = visibleComponents.length;
  const totalPrice = components.reduce((a, c) => a + (c.dbProduct?.price || 0), 0);
  const hasSelectedComponents = components.some((c) => !!c.dbProduct);

  const getAttr = (prod: CatalogComponent | null | undefined, name: string) =>
    prod?.attributes?.find((a) => a.name.toLowerCase().includes(name.toLowerCase()))?.value || null;

  const cpuProd = components.find((c) => c.id === 'cpu')?.dbProduct;
  const moboProd = components.find((c) => c.id === 'motherboard')?.dbProduct;
  const psuProd = components.find((c) => c.id === 'psu')?.dbProduct;
  const ramProd = components.find((c) => c.id === 'ram_1')?.dbProduct;

  const cpuSocket = getAttr(cpuProd, 'socket');
  const moboSocket = getAttr(moboProd, 'socket');
  const socketOk = !cpuSocket || !moboSocket || cpuSocket === moboSocket;

  const ramType = getAttr(ramProd, 'tipo') || getAttr(ramProd, 'ddr');
  const moboRam = getAttr(moboProd, 'ddr') || getAttr(moboProd, 'ram');
  const ramOk = !ramType || !moboRam || moboRam.toLowerCase().includes(ramType.toLowerCase());

  const cpuTdp = parseInt(getAttr(cpuProd, 'tdp') || '0', 10);
  const gpuTdp = parseInt(getAttr(components.find((c) => c.id === 'gpu')?.dbProduct, 'tdp') || '0', 10);
  const estWatts = cpuTdp + gpuTdp + 80;
  const psuWatts = parseInt(getAttr(psuProd, 'potencia') || getAttr(psuProd, 'watt') || '0', 10);
  const powerOk = psuWatts <= 0 || estWatts <= psuWatts;
  const powerMargin = psuWatts > 0 ? psuWatts - estWatts : 0;
  const powerPct = psuWatts > 0 ? Math.round((powerMargin / psuWatts) * 100) : 0;

  const formFactor = getAttr(moboProd, 'factor') || getAttr(moboProd, 'form') || '-';

  const localRuleChecks = [
    {
      label: 'Socket CPU – Placa madre',
      detail: socketOk ? `Compatible (${cpuSocket || 'N/A'})` : `${cpuSocket} ≠ ${moboSocket}`,
      pass: socketOk,
    },
    {
      label: 'Tipo de RAM soportada',
      detail: ramOk ? `${ramType || 'DDR'} compatible` : `${ramType} ≠ ${moboRam}`,
      pass: ramOk,
    },
    {
      label: 'Consumo energético fuente',
      detail: psuWatts > 0 ? `${estWatts}W / ${psuWatts}W (${powerPct}% margen)` : 'Sin datos',
      pass: powerOk,
    },
    {
      label: 'Factor de forma del gabinete',
      detail: `${formFactor} compatible`,
      pass: true,
    },
  ];

  const suggestions = [
    '¿Qué motherboard me recomiendas para un Ryzen 5 7600X?',
    '¿Es compatible DDR5 con la placa MSI PRO B760-P?',
    '¿Cuántos Watts de fuente necesito para i5 + RTX 4070?',
    'Verifica mi ensamble de hardware actual.',
  ];

  const camBtn = (type: CameraAction['type'], icon: React.ReactNode, label: string) => {
    const isActive = type === 'toggle-rotate' && autoRotate;
    return (
      <button
        type="button"
        onClick={() => {
          if (type === 'toggle-rotate') {
            setAutoRotate((p) => !p);
          } else {
            setCameraAction({ type, ts: Date.now() });
          }
        }}
        title={label}
        className={`w-9 h-9 flex items-center justify-center rounded-lg transition backdrop-blur-sm ${
          isActive
            ? 'border-teal-500/30 text-teal-400 bg-teal-500/10'
            : 'bg-neutral-900/80 border border-neutral-700/60 text-neutral-300 hover:text-teal-400 hover:border-teal-500/40'
        }`}
      >
        {icon}
      </button>
    );
  };

  return (
    <div className="flex flex-col -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 bg-neutral-950 text-white min-h-[calc(100vh-64px)]">
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-neutral-800/60 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2.5">
            Simulador dinámico de compatibilidad
            <span className="text-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold px-2 py-0.5 rounded uppercase">
              IA
            </span>
          </h1>
          <p className="text-xs text-neutral-400 font-medium mt-1">
            Diseña, ensambla tu PC en 3D interactivo y valida compatibilidades en tiempo real con el Asistente IA.
          </p>
        </div>
        {hasSelectedComponents && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold px-3 py-1.5 transition text-xs shadow-sm cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Limpiar Ensamble
          </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-0">
        <div className="lg:col-span-5 relative flex flex-col border-r border-neutral-800/60">
          <div className="absolute top-3 left-4 z-10 bg-neutral-900/80 border border-neutral-800 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-2 backdrop-blur-md text-neutral-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
            </span>
            Entorno 3D interactivo
          </div>

          <div className="absolute top-3 right-16 z-10 bg-neutral-900/80 border border-neutral-800 px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1.5 text-teal-400 backdrop-blur-md">
            <Wrench className="h-3.5 w-3.5" />
            Ensamble {Object.values(assemblyStates).filter((s) => s === 'installed').length}/{ASSEMBLY_SEQUENCE.length}
          </div>

          <div className="absolute right-3 top-14 z-10 flex flex-col gap-1.5">
            {camBtn('toggle-rotate', <RotateCw className="h-4 w-4" />, 'Rotar')}
            {camBtn('center', <Crosshair className="h-4 w-4" />, 'Centrar')}
            {camBtn('zoom-in', <ZoomIn className="h-4 w-4" />, 'Zoom +')}
            {camBtn('zoom-out', <ZoomOut className="h-4 w-4" />, 'Zoom -')}
            {camBtn('reset', <RefreshCw className="h-4 w-4" />, 'Reiniciar vista')}
          </div>

          <div className="flex-1 min-h-[400px]">
            <Scene
              states={assemblyStates}
              onInstallComplete={completeInstall}
              cameraAction={cameraAction}
              autoRotate={autoRotate}
            />
          </div>

          {isAnimating && (
            <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-20">
              <div className="bg-neutral-900/90 border border-teal-500/30 px-5 py-3 rounded-xl flex items-center gap-3 shadow-2xl animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                <span className="text-xs font-bold text-neutral-200">Instalando componente en 3D...</span>
              </div>
            </div>
          )}

          <div className="absolute bottom-10 left-4 z-10 text-[10px] text-neutral-500 font-medium max-w-xs">
            <Info className="h-3 w-3 inline mr-1 -mt-0.5" />
            Consejo: selecciona un componente y haz clic en un punto resaltado para instalarlo.
          </div>

          <div className="absolute bottom-3 left-0 right-0 z-10 flex items-center justify-center gap-5 text-[10px] font-bold text-neutral-400">
            {LEGEND.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col min-h-0 bg-neutral-950/50">
          <div className="flex gap-2 p-3 bg-neutral-900/60 border-b border-neutral-800/60 shrink-0 overflow-x-auto scrollbar-none">
            {([
              { key: 'assembly' as const, icon: <Wrench className="h-3.5 w-3.5" />, label: 'Ensamblar (3D)' },
              { key: 'ai' as const, icon: <Sparkles className="h-3.5 w-3.5" />, label: 'Asistente IA' },
              { key: 'rules' as const, icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'Reglas' },
            ] as const).map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 flex h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-teal-500/20 bg-teal-500/10 text-teal-500 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-400'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            {activeTab === 'assembly' && (
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-300">
                    Componentes de ensamblaje
                  </h3>
                  <Link
                    to="/cliente/catalogo"
                    className="text-[10px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition"
                  >
                    Ver catálogo completo <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="flex-1 divide-y divide-neutral-900/60">
                  {visibleComponents.map((comp) => {
                    const st = assemblyStates[comp.id] || 'locked';
                    const cfg = STATE_CONFIG[st];
                    const activeComp = components.find((c) => c.id === comp.id);

                    return (
                      <div
                        key={comp.id}
                        className={`flex items-center gap-3 px-4 py-3 transition group ${
                          st === 'locked' ? 'opacity-50' : 'hover:bg-neutral-900/40'
                        }`}
                      >
                        <span className="text-base shrink-0 w-7 text-center">{comp.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-white truncate">{comp.label}</p>
                          <p className="text-[11px] text-neutral-400 truncate">
                            {activeComp?.dbProduct ? activeComp.dbProduct.name : activeComp?.selectedName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => st === 'available' && startInstall(comp.id)}
                          disabled={st !== 'available'}
                          className={`text-[9px] font-bold px-2.5 py-1 rounded-full border shrink-0 transition ${cfg.cls} ${
                            st === 'available' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                          }`}
                        >
                          {st === 'available' && <Circle className="h-2 w-2 fill-teal-400 inline mr-1 -mt-px" />}
                          {cfg.label}
                        </button>
                        {comp.categorySlug && (
                          <button
                            type="button"
                            onClick={() => handleOpenSelectModal(comp.id, comp.categorySlug)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-800 transition text-neutral-500 hover:text-white shrink-0 opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        )}
                        {!comp.categorySlug && <div className="w-7 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-neutral-900/60 px-4 py-4 space-y-3">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                    Reglas de compatibilidad
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {localRuleChecks.map((r) => (
                      <div
                        key={r.label}
                        className="rounded-lg bg-neutral-900/60 border border-neutral-800/40 p-2.5 space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5">
                          {r.pass ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                          )}
                          <span className="text-[10px] font-bold text-neutral-300 truncate">{r.label}</span>
                        </div>
                        <p
                          className={`text-[9px] font-semibold ml-[18px] ${
                            r.pass ? 'text-teal-400' : 'text-red-400'
                          }`}
                        >
                          {r.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-neutral-900/60 px-4 py-4 space-y-2.5">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-300">
                    Resumen de configuración
                  </h4>
                  <div className="space-y-1.5 text-[11px]">
                    {[
                      { k: 'Consumo estimado', v: `${estWatts}W`, ok: powerOk },
                      { k: 'PSU seleccionada', v: psuWatts > 0 ? `${psuWatts}W` : '-', ok: true },
                      {
                        k: 'Margen disponible',
                        v: psuWatts > 0 ? `+${powerMargin}W (${powerPct}%)` : '-',
                        ok: powerOk,
                      },
                      { k: 'Factor de forma', v: formFactor, ok: true },
                      {
                        k: 'Socket CPU + Placa madre',
                        v: cpuSocket || moboSocket || '-',
                        ok: socketOk,
                      },
                      { k: 'Tipo de RAM', v: ramType || '-', ok: ramOk },
                    ].map((row) => (
                      <div key={row.k} className="flex items-center justify-between">
                        <span className="text-neutral-400 font-medium">{row.k}</span>
                        <span className="font-bold text-white flex items-center gap-1.5">
                          {row.v}
                          {row.ok ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-red-400" />
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  {hasSelectedComponents && (
                    <div className="pt-3 border-t border-neutral-900/60 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-neutral-400">Costo total estimado</span>
                        <span className="text-sm font-black text-teal-400">
                          ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <button
                          type="button"
                          onClick={handleOpenSaveModal}
                          className="h-10 rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Guardar Proyecto
                        </button>
                        <button
                          type="button"
                          onClick={handleDirectCheckout}
                          className="h-10 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 transition text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Comprar Ensamble
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {installedCount >= totalVisible && (
                  <div className="mx-4 mb-4 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/30 rounded-xl p-4 text-center space-y-2">
                    <span className="text-2xl">🎉</span>
                    <h4 className="text-sm font-black text-teal-400">¡Ensamblaje Completado!</h4>
                    <p className="text-[10px] text-slate-300 max-w-xs mx-auto">
                      Todos los componentes de hardware han sido instalados correctamente.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-2.5 max-w-[88%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border text-xs ${
                          msg.role === 'user'
                            ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                            : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                        }`}
                      >
                        {msg.role === 'user' ? '👤' : '🧠'}
                      </div>
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-[11px] font-medium leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-teal-50 text-neutral-950 font-semibold'
                            : 'bg-neutral-900 border border-neutral-800/60 text-neutral-200'
                        }`}
                      >
                        {msg.content.split('\n').map((line, idx) => {
                          const parts: React.ReactNode[] = [];
                          let lastIdx = 0;
                          const boldRe = /\*\*(.*?)\*\*/g;
                          let match;
                          while ((match = boldRe.exec(line)) !== null) {
                            parts.push(line.substring(lastIdx, match.index));
                            parts.push(<strong key={match.index}>{match[1]}</strong>);
                            lastIdx = boldRe.lastIndex;
                          }
                          parts.push(line.substring(lastIdx));
                          return (
                            <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
                              {parts.length > 1 ? parts : line}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex gap-2.5 max-w-[88%]">
                      <div className="h-7 w-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 text-xs animate-pulse">
                        🧠
                      </div>
                      <div className="bg-neutral-900 border border-neutral-800/60 rounded-2xl px-3.5 py-2.5 flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />
                        <span className="text-[10px] text-neutral-400 font-semibold animate-pulse">Pensando...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                <div className="p-2.5 bg-neutral-900/50 border-t border-neutral-800/60 overflow-x-auto whitespace-nowrap flex gap-1.5 shrink-0 scrollbar-none">
                  {suggestions.map((text, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setChatInput(text)}
                      className="inline-block bg-neutral-950 border border-neutral-850 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition text-[9px] font-bold px-2.5 py-1 rounded-lg whitespace-normal text-left max-w-[160px]"
                    >
                      {text}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleChatSubmit} className="p-3 border-t border-neutral-800 bg-neutral-900/60 flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Pregúntale al Arquitecto de Hardware..."
                    disabled={aiLoading}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-[11px] text-neutral-200 focus:outline-none focus:border-teal-500 transition font-medium"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !chatInput.trim()}
                    className="h-9 w-9 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 flex items-center justify-center transition shrink-0 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-300">
                    Reglas del Motor de Validación
                  </h3>
                  {loadingRules && <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />}
                </div>

                {compatibilityStatus.checked && (
                  <div
                    className={`rounded-xl border p-3 flex items-start gap-3 ${
                      compatibilityStatus.compatible
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/5 border-red-500/20 text-red-400'
                    }`}
                  >
                    {compatibilityStatus.compatible ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider">
                        {compatibilityStatus.compatible ? '¡Configuración Compatible!' : 'Conflictos Detectados'}
                      </h4>
                      {!compatibilityStatus.compatible && (
                        <div className="space-y-1 mt-1.5">
                          {compatibilityStatus.results
                            .filter((r) => r.status === 'FAIL')
                            .map((err, i) => (
                              <p key={i} className="text-[10px] font-semibold text-red-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                <strong>{err.ruleName}:</strong> {err.detail}
                              </p>
                            ))}
                        </div>
                      )}
                    </div>
                    {checkingCompat && <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400 shrink-0" />}
                  </div>
                )}

                <div className="space-y-2.5 flex-1">
                  {rules.map((rule) => (
                    <div key={rule.id} className="rounded-xl border border-neutral-850 bg-neutral-900/30 p-3.5 space-y-2.5">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h4 className="text-[11px] font-black text-slate-200 uppercase tracking-wide">{rule.name}</h4>
                          <span className="text-[9px] text-teal-400 font-extrabold block mt-0.5">
                            Tipo: {rule.ruleType}
                          </span>
                        </div>
                        <span
                          className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                            rule.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-neutral-800 text-neutral-500 border border-neutral-850'
                          }`}
                        >
                          {rule.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 font-medium">{rule.description}</p>
                      <div className="rounded-lg bg-neutral-950 p-2 text-[9px] font-bold text-neutral-400 border border-neutral-850 grid grid-cols-11 items-center gap-1">
                        <div className="col-span-4 text-right truncate">
                          {rule.sourceCategory?.name} • <span className="text-teal-400">{rule.sourceAttributeName}</span>
                        </div>
                        <div className="col-span-3 text-center text-[8px] uppercase bg-neutral-900 border border-neutral-800 text-neutral-500 py-0.5 rounded">
                          {rule.comparisonOperator === 'EQUALS' ? 'IGUAL A' : rule.comparisonOperator}
                        </div>
                        <div className="col-span-4 text-left truncate">
                          {rule.targetCategory?.name} • <span className="text-teal-400">{rule.targetAttributeName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={isSelectModalOpen}
        title={`Elegir Componente: ${components.find((c) => c.id === activeSlotId)?.label || ''}`}
        onClose={() => {
          setIsSelectModalOpen(false);
          setActiveSlotId(null);
        }}
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-400 font-medium">
            Selecciona un componente del catálogo real para usarlo en la simulación 3D.
          </p>
          {loadingProducts ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
              <span className="text-xs text-slate-400 font-bold animate-pulse">Cargando inventario...</span>
            </div>
          ) : modalProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-bold">
              No hay componentes de esta categoría registrados.
            </div>
          ) : (
            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {modalProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleSelectProduct(prod)}
                  className="rounded-xl border border-slate-200 dark:border-neutral-800 hover:border-teal-500 p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3 bg-slate-50 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-900"
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{prod.name}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-[9px] bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-extrabold px-1.5 py-0.5 rounded">
                        {prod.brand}
                      </span>
                      {prod.attributes.slice(0, 3).map((attr, i) => (
                        <span
                          key={i}
                          className="text-[9px] bg-teal-500/10 text-teal-700 dark:text-teal-400 font-black px-1.5 py-0.5 rounded border border-teal-500/10"
                        >
                          {attr.name}: {attr.value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-slate-900 dark:text-white block">
                      ${prod.price.toLocaleString('en-US')}
                    </span>
                    <span className={`text-[8px] font-bold block mt-0.5 uppercase ${prod.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {prod.stock > 0 ? `Stock: ${prod.stock}` : 'Agotado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-neutral-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSelectModalOpen(false);
                setActiveSlotId(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isSaveModalOpen}
        title="Guardar Proyecto de Ensamblaje"
        onClose={() => setIsSaveModalOpen(false)}
      >
        <div className="space-y-4 text-slate-900 dark:text-neutral-100">
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium leading-relaxed font-sans">
            Ingresa un nombre para tu configuración de hardware. Podrás acceder a ella para simularla de nuevo o comprarla directamente desde tu sección "Mis proyectos".
          </p>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Nombre del Proyecto
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ej. Mi Ensamble Gamer, Servidor de Trabajo"
              className="w-full bg-slate-50 border border-slate-200 dark:bg-neutral-900/60 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-teal-500 transition font-medium"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSaveModalOpen(false)}
            >
              Cancelar
            </Button>
            <button
              type="button"
              onClick={handleSaveProject}
              disabled={!projectName.trim()}
              className="rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-4 py-2 transition text-xs shadow-sm disabled:opacity-50 cursor-pointer"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-teal-500/30 bg-neutral-900 px-4 py-3 shadow-2xl animate-fade-in-up">
          <CheckCircle2 className="h-4 w-4 text-teal-400 animate-pulse" />
          <span className="text-xs font-bold text-neutral-200">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
