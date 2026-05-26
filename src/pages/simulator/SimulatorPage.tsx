import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Info,
  ShoppingCart,
  MessageSquare,
  X,
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
import { PublicHeader } from '../../components/layout/PublicHeader';


const STATE_CONFIG: Record<ComponentState, { label: string; short: string; cls: string; dot: string }> = {
  installed: {
    label: 'Instalado',
    short: 'Inst',
    cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    dot: 'bg-emerald-500',
  },
  available: {
    label: 'Lista para instalar',
    short: 'Elegir',
    cls: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25',
    dot: 'bg-teal-500',
  },
  installing: {
    label: 'Instalando...',
    short: 'Instal...',
    cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 animate-pulse',
    dot: 'bg-amber-500',
  },
  locked: {
    label: 'Pendiente',
    short: 'Bloq',
    cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25',
    dot: 'bg-orange-500',
  },
  incompatible: {
    label: 'Incompatible',
    short: 'Incomp',
    cls: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',
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

function recalcStates(currentStates: Record<string, ComponentState>, allComps: PCComponent[]): Record<string, ComponentState> {
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

const getInitialStates = () => recalcStates({}, PC_COMPONENTS);

export const SimulatorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const session = getStoredSession();
  const userId = session?.user.id;

  
  const [components, setComponents] = useState<PCComponent[]>(PC_COMPONENTS);
  const [assemblyStates, setAssemblyStates] = useState<Record<string, ComponentState>>(getInitialStates);
  const [isAnimating, setIsAnimating] = useState(false);
  
  
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraAction, setCameraAction] = useState<CameraAction | null>(null);
  const [sceneKey, setSceneKey] = useState(0);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [modalProducts, setModalProducts] = useState<CatalogComponent[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isAuthRequiredModalOpen, setIsAuthRequiredModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<'limit' | 'save' | 'checkout'>('limit');
  const [isRamQtyModalOpen, setIsRamQtyModalOpen] = useState(false);
  const [selectedRamProduct, setSelectedRamProduct] = useState<CatalogComponent | null>(null);
  const [selectedRamSlotId, setSelectedRamSlotId] = useState<string | null>(null);

  
  const [, setRules] = useState<CompatibilityRule[]>([]);
  const [, setLoadingRules] = useState(false);
  const [, setCheckingCompat] = useState(false);
  const [, setCompatibilityStatus] = useState<{ checked: boolean; compatible: boolean; results: CompatibilityCheckResult[] }>({ checked: false, compatible: true, results: [] });
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: '¡Hola! Soy el **Arquitecto de Hardware de NeoHW**. 🧠\n\nPuedo ayudarte a buscar componentes en nuestro inventario real, sugerirte partes compatibles con tu configuración o resolver dudas técnicas sobre sockets, potencia y compatibilidad física. ¿Qué te gustaría armar hoy?',
  }]);

  const summaryRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const isPublic = location.pathname === '/simulador';

 
  const isCaseSelected = useMemo(() => !!components.find((c) => c.id === 'case')?.dbProduct, [components]);
  const hasSelectedComponents = useMemo(() => components.some((c) => !!c.dbProduct), [components]);
  const installedCount = useMemo(() => Object.values(assemblyStates).filter((s) => s === 'installed').length, [assemblyStates]);
  
  const visibleComponents = useMemo(() => ASSEMBLY_SEQUENCE.filter((c) => {
    const active = components.find(ac => ac.id === c.id);
    if (active?.hidden || c.hidden) return false;
    if (c.id === 'case' && isCaseSelected) return false;
    return true;
  }), [components, isCaseSelected]);

  const getAttr = useCallback((prod: CatalogComponent | null | undefined, name: string) => {
    return prod?.attributes?.find((a) => a.name.toLowerCase().includes(name.toLowerCase()))?.value || null;
  }, []);

  const hardwareStats = useMemo(() => {
    const cpuProd = components.find((c) => c.id === 'cpu')?.dbProduct;
    const moboProd = components.find((c) => c.id === 'motherboard')?.dbProduct;
    const psuProd = components.find((c) => c.id === 'psu')?.dbProduct;
    const ramProd = components.find((c) => c.id === 'ram_1')?.dbProduct;
    const gpuProd = components.find((c) => c.id === 'gpu')?.dbProduct;

    const cpuSocket = getAttr(cpuProd, 'socket');
    const moboSocket = getAttr(moboProd, 'socket');
    const ramType = getAttr(ramProd, 'tipo') || getAttr(ramProd, 'ddr');
    const moboRam = getAttr(moboProd, 'ddr') || getAttr(moboProd, 'ram');
    const formFactor = getAttr(moboProd, 'factor') || getAttr(moboProd, 'form') || '-';

    const cpuTdp = parseInt(getAttr(cpuProd, 'tdp') || '0', 10);
    const gpuTdp = parseInt(getAttr(gpuProd, 'tdp') || '0', 10);
    const psuWatts = parseInt(getAttr(psuProd, 'potencia') || getAttr(psuProd, 'watt') || '0', 10);
    
    const estWatts = cpuTdp + gpuTdp > 0 ? cpuTdp + gpuTdp + 80 : 0;
    const totalPrice = components.reduce((a, c) => a + (c.dbProduct?.price || 0), 0);
    
    return { cpuProd, moboProd, ramProd, cpuSocket, moboSocket, ramType, moboRam, formFactor, estWatts, psuWatts, totalPrice };
  }, [components, getAttr]);

  const localRuleChecks = useMemo(() => {
    const { cpuSocket, moboSocket, ramType, moboRam, estWatts, psuWatts, formFactor } = hardwareStats;
    const socketOk = !cpuSocket || !moboSocket || cpuSocket === moboSocket;
    const ramOk = !ramType || !moboRam || moboRam.toLowerCase().includes(ramType.toLowerCase());
    const powerOk = psuWatts <= 0 || estWatts <= psuWatts;
    const powerMargin = psuWatts > 0 ? psuWatts - estWatts : 0;
    const powerPct = psuWatts > 0 ? Math.round((powerMargin / psuWatts) * 100) : 0;

    return [
      { label: 'Socket CPU – Placa madre', detail: socketOk ? `Compatible (${cpuSocket || 'N/A'})` : `${cpuSocket} ≠ ${moboSocket}`, pass: socketOk },
      { label: 'Tipo de RAM soportada', detail: ramOk ? `${ramType || 'DDR'} compatible` : `${ramType} ≠ ${moboRam}`, pass: ramOk },
      { label: 'Consumo energético fuente', detail: psuWatts > 0 ? `${estWatts}W / ${psuWatts}W (${powerPct}% margen)` : 'Sin datos', pass: powerOk },
      { label: 'Factor de forma', detail: `${formFactor} compatible`, pass: true },
    ];
  }, [hardwareStats]);

  const getCandidateCompatibility = useCallback((prod: CatalogComponent): { pass: boolean; reason?: string } => {
    if (!activeSlotId) return { pass: true };
    const { cpuProd, moboProd, ramProd, estWatts } = hardwareStats;
    
    if (activeSlotId === 'cpu') {
      const prodSocket = getAttr(prod, 'socket');
      const moboSocket = getAttr(moboProd, 'socket');
      if (prodSocket && moboSocket && prodSocket.toLowerCase() !== moboSocket.toLowerCase()) 
        return { pass: false, reason: `Socket incompatible con Placa (${moboSocket})` };
    }
    if (activeSlotId === 'motherboard') {
      const prodSocket = getAttr(prod, 'socket');
      const cpuSocket = getAttr(cpuProd, 'socket');
      if (prodSocket && cpuSocket && prodSocket.toLowerCase() !== cpuSocket.toLowerCase()) 
        return { pass: false, reason: `Socket incompatible con CPU (${cpuSocket})` };

      const prodRam = getAttr(prod, 'ddr') || getAttr(prod, 'ram');
      const ramType = getAttr(ramProd, 'tipo') || getAttr(ramProd, 'ddr');
      if (prodRam && ramType && !prodRam.toLowerCase().includes(ramType.toLowerCase())) 
        return { pass: false, reason: `Tipo de RAM incompatible (${ramType})` };
    }
    if (activeSlotId.startsWith('ram_')) {
      const prodRam = getAttr(prod, 'tipo') || getAttr(prod, 'ddr');
      const moboRam = getAttr(moboProd, 'ddr') || getAttr(moboProd, 'ram');
      if (prodRam && moboRam && !moboRam.toLowerCase().includes(prodRam.toLowerCase())) 
        return { pass: false, reason: `No soportado por Placa (${moboRam})` };
    }
    if (activeSlotId === 'psu') {
      const prodWatts = parseInt(getAttr(prod, 'potencia') || getAttr(prod, 'watt') || '0', 10);
      if (prodWatts > 0 && estWatts > prodWatts) 
        return { pass: false, reason: `Potencia insuficiente (${prodWatts}W < ${estWatts}W req.)` };
    }
    return { pass: true };
  }, [activeSlotId, hardwareStats, getAttr]);

  const sortedModalProducts = useMemo(() => {
    return [...modalProducts].sort((a, b) => {
      const compatA = getCandidateCompatibility(a).pass ? 1 : 0;
      const compatB = getCandidateCompatibility(b).pass ? 1 : 0;
      return compatB - compatA;
    });
  }, [modalProducts, getCandidateCompatibility]);

  
  useEffect(() => {
    const fetchRules = async () => {
      setLoadingRules(true);
      try {
        const res = await getCompatibilityRules();
        setRules(res.data);
      } catch {console.error("Error cargando reglas:", Error);} finally {
        setLoadingRules(false);
      }
    };
    fetchRules();
  }, []);

  useEffect(() => {
    const checkOptionalCategories = async () => {
      try {
        const coolerRes = await getCatalogComponents({ category: 'refrigeracion', limit: 1 });
        const fansRes = await getCatalogComponents({ category: 'ventiladores', limit: 1 });
        setComponents(prev => prev.map(c => {
          if (c.id === 'cooler' && !coolerRes.items.some(p => p.stock > 0)) return { ...c, hidden: true };
          if (c.id === 'fans' && !fansRes.items.some(p => p.stock > 0)) return { ...c, hidden: true };
          return c;
        }));
      } catch (e) {
        console.error(e);
      }
    };
    checkOptionalCategories();
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
      } catch {console.error("Error comprobando compatibilidad:", Error);} finally {
        setCheckingCompat(false);
      }
    };
    run();
  }, [components]);

  useEffect(() => {
    const isCompleted = components.every(c => {
      if (c.hidden || c.id === 'ram_3' || c.id === 'ram_4' || c.id === 'cables') return true;
      return assemblyStates[c.id] === 'installed';
    });
    if (isCompleted && isCaseSelected && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [assemblyStates, components, isCaseSelected]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, aiLoading]);
  
  useEffect(() => {
    try {
      const temp = localStorage.getItem('neohw_temp_assembly');
      if (temp) {
        const parsed = JSON.parse(temp);
        if (parsed.components && parsed.assemblyStates) {
          
          setTimeout(() => {
            setComponents(parsed.components);
            setAssemblyStates(parsed.assemblyStates);
          }, 0);
        }
        localStorage.removeItem('neohw_temp_assembly');
      }
    } catch (e) {
      console.error('Error al restaurar el ensamble temporal:', e);
    }
  }, []);

  useEffect(() => {
    const loadProjectId = location.state?.loadProjectId;
    if (userId && loadProjectId) {
      try {
        const stored = localStorage.getItem(`neohw_proyectos_${userId}`);
        if (stored) {
          const projectsList = JSON.parse(stored);
          
          
          const project = projectsList.find((p: { id: string; name: string; componentsMap: Record<string, CatalogComponent> }) => p.id === loadProjectId);
          
          if (project) {
            const savedMap = project.componentsMap;
            
            
            setTimeout(() => {
              setComponents((prev) => prev.map((c) => {
                const savedProd = savedMap[c.id];
                return savedProd ? { ...c, dbProduct: savedProd, selectedName: savedProd.name } : { ...c, dbProduct: null, selectedName: '' };
              }));
              
              const newStates: Record<string, ComponentState> = { case: 'installed' };
              PC_COMPONENTS.forEach((c) => { if (savedMap[c.id]) newStates[c.id] = 'installed'; });
              setAssemblyStates(recalcStates(newStates, PC_COMPONENTS));
            }, 0);
            
            navigate(location.pathname, { replace: true, state: {} });
            setToastMessage(`Proyecto "${project.name}" cargado en el simulador.`);
            setTimeout(() => setToastMessage(null), 3000);
          }
        }
      } catch (e) {
        console.error("Error cargando el proyecto:", e);
      }
    }
  }, [location.state, userId, navigate, location.pathname]);

  
  const handleSaveTempAssembly = useCallback(() => {
    localStorage.setItem('neohw_temp_assembly', JSON.stringify({ components, assemblyStates }));
  }, [components, assemblyStates]);

  const handleOpenSaveModal = useCallback(() => {
    if (!userId) {
      setAuthModalReason('save');
      setIsAuthRequiredModalOpen(true);
      return;
    }
    setProjectName(`Ensamble NeoHW - ${new Date().toLocaleDateString('es-EC')}`);
    setIsSaveModalOpen(true);
  }, [userId]);

  const handleSaveProject = useCallback(() => {
    if (!projectName.trim() || !userId) return;
    const selectedCompsMap: Record<string, CatalogComponent> = {};
    components.forEach((c) => { if (c.dbProduct) selectedCompsMap[c.id] = c.dbProduct; });

    const newProject = {
      id: crypto.randomUUID() || Date.now().toString(),
      name: projectName.trim(),
      createdAt: new Date().toISOString(),
      totalPrice: hardwareStats.totalPrice,
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
      console.error(e);
    }
  }, [projectName, userId, components, hardwareStats.totalPrice]);

  const handleDirectCheckout = useCallback(() => {
    if (!userId) {
      setAuthModalReason('checkout');
      setIsAuthRequiredModalOpen(true);
      return;
    }
    const selectedProds = components.map((c) => c.dbProduct).filter((p): p is CatalogComponent => !!p);
    if (selectedProds.length === 0) return;
    selectedProds.forEach((prod) => addToCart(prod));
    navigate('/cliente/carrito');
  }, [userId, components, addToCart, navigate]);

  const handleSendToCart = useCallback(() => {
    if (!userId) {
      setAuthModalReason('checkout');
      setIsAuthRequiredModalOpen(true);
      return;
    }
    const selectedProds = components.map((c) => c.dbProduct).filter((p): p is CatalogComponent => !!p);
    if (selectedProds.length === 0) {
      setToastMessage("Selecciona al menos un componente.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    selectedProds.forEach((prod) => addToCart(prod));
    setToastMessage("¡Añadidos al carrito!");
    setTimeout(() => setToastMessage(null), 3000);
  }, [userId, components, addToCart]);

  const handleReset = useCallback(() => {
    setComponents(PC_COMPONENTS.map((c) => ({ ...c, dbProduct: null })));
    setAssemblyStates(getInitialStates());
    setIsAnimating(false);
    setAutoRotate(false);
    setCameraAction({ type: 'reset', ts: Date.now() });
    setSceneKey(prev => prev + 1);
  }, []);

  const completeInstall = useCallback((id: string) => {
    setIsAnimating(false);
    setAssemblyStates((prev) => recalcStates({ ...prev, [id]: 'installed' as ComponentState }, PC_COMPONENTS));
  }, []);

  const startInstall = useCallback((id: string) => {
    if (isAnimating) return;
    const comp = PC_COMPONENTS.find((c) => c.id === id);
    if (!comp) return;

    if (comp.hasModel === false) {
      setAssemblyStates((prev) => recalcStates({ ...prev, [id]: 'installed' }, PC_COMPONENTS));
      return;
    }
    setIsAnimating(true);
    setAssemblyStates((prev) => ({ ...prev, [id]: 'installing' }));
    setTimeout(() => completeInstall(id), 1500);
  }, [isAnimating, completeInstall]);

  const handleOpenSelectModal = useCallback(async (slotId: string, catSlug: string) => {
    if (!catSlug) return;
    if (!userId && slotId !== 'case' && slotId !== 'motherboard' && slotId !== 'psu') {
      setAuthModalReason('limit');
      setIsAuthRequiredModalOpen(true);
      return;
    }
    setActiveSlotId(slotId);
    setLoadingProducts(true);
    try {
      const res = await getCatalogComponents({ category: catSlug, limit: 50 });
      setModalProducts(res.items);
    } catch {console.error("Error abriendo modal:", Error);} finally {
      setLoadingProducts(false);
    }
  }, [userId]);

  const handleSelectProduct = useCallback((product: CatalogComponent) => {
    if (!activeSlotId) return;
    if (activeSlotId === 'ram_1') {
      setSelectedRamProduct(product);
      setSelectedRamSlotId(activeSlotId);
      setIsRamQtyModalOpen(true);
      return;
    }
    setComponents((prev) => prev.map((c) => c.id === activeSlotId ? { ...c, selectedName: product.name, dbProduct: product, quantity: 1 } : c));
    if (activeSlotId === 'case') setAssemblyStates((prev) => recalcStates({ ...prev, case: 'installed' }, PC_COMPONENTS));
    setActiveSlotId(null);
  }, [activeSlotId]);

  const handleConfirmRamQuantity = useCallback((quantity: number) => {
    if (!selectedRamProduct || !selectedRamSlotId) return;
    setComponents((prev) => prev.map((c) => {
      const slotNum = parseInt(c.id.replace('ram_', ''), 10);
      if (c.id.startsWith('ram_')) {
        return slotNum <= quantity 
          ? { ...c, selectedName: `${selectedRamProduct.name} (Slot ${slotNum})`, dbProduct: selectedRamProduct, quantity: 1 }
          : { ...c, selectedName: `Memoria RAM DDR4/DDR5 Slot ${slotNum}`, dbProduct: null, quantity: 1 };
      }
      return c;
    }));
    setAssemblyStates((prev) => {
      const next = { ...prev };
      for (let i = 1; i <= 4; i++) {
        next[`ram_${i}`] = i <= quantity ? 'available' : 'locked';
      }
      return recalcStates(next, PC_COMPONENTS);
    });
    setIsRamQtyModalOpen(false);
    setSelectedRamProduct(null);
    setSelectedRamSlotId(null);
    setActiveSlotId(null);
  }, [selectedRamProduct, selectedRamSlotId]);

  const handleChatSubmit = useCallback(async (e: React.FormEvent) => {
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
          (chunk) => setChatMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === 'assistant') last.content += chunk;
            return copy;
          }),
          () => setAiLoading(false),
          () => {
            setChatMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === 'assistant') last.content = '❌ Ocurrió un error al conectar con el asistente IA. Intente nuevamente.';
              return copy;
            });
            setAiLoading(false);
          },
      );
    } catch {
      setAiLoading(false);
    }
  }, [chatInput, aiLoading, chatMessages]);

  const camBtn = useCallback((type: CameraAction['type'], icon: React.ReactNode, label: string) => {
    const isActive = type === 'toggle-rotate' && autoRotate;
    return (
        <button
            type="button"
            onClick={() => type === 'toggle-rotate' ? setAutoRotate((p) => !p) : setCameraAction({ type, ts: Date.now() })}
            title={label}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition backdrop-blur-sm ${
                isActive ? 'border-teal-500/30 text-teal-400 bg-teal-500/10' : 'bg-neutral-900/80 border border-neutral-700/60 text-neutral-300 hover:text-teal-400 hover:border-teal-500/40'
            }`}
        >
          {icon}
        </button>
    );
  }, [autoRotate]);

  return (
      <div className={isPublic ? "flex flex-col bg-slate-50 text-slate-900 dark:bg-neutral-950 dark:text-white min-h-screen transition-colors duration-200" : "flex flex-col -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 bg-slate-50 text-slate-900 dark:bg-neutral-950 dark:text-white min-h-[calc(100vh-64px)] transition-colors duration-200"}>
        {isPublic && <PublicHeader />}
        <div className="flex-1 flex flex-col px-4 sm:px-6">
          <div className="pt-4 pb-3 border-b border-slate-200 dark:border-neutral-800/60 flex items-center justify-between flex-wrap gap-4 shrink-0">
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                Simulador de compatibilidad 3D
                <span className="text-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-bold px-2 py-0.5 rounded uppercase">IA</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium mt-0.5">Monta tu configuración de hardware en 3D interactivo y valida compatibilidad.</p>
            </div>
            {hasSelectedComponents && (
                <button type="button" onClick={handleReset} className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold px-3 py-1.5 transition text-xs shadow-sm cursor-pointer">
                  <RefreshCw className="h-3.5 w-3.5" /> Limpiar Ensamble
                </button>
            )}
          </div>
  
          <div className="flex-1 flex flex-col lg:flex-row items-start gap-4 py-4">
            
            
            <div className="w-full lg:w-[20%] lg:sticky lg:top-6 flex flex-col border border-slate-200 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/10 rounded-2xl overflow-hidden h-[400px] lg:h-[calc(100vh-120px)] shadow-sm">
              {activeSlotId ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-neutral-800/60 bg-slate-100/40 dark:bg-neutral-900/60 shrink-0">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-neutral-300 truncate">
                      Catálogo: {components.find((c) => c.id === activeSlotId)?.label || ''}
                    </h3>
                    <button type="button" onClick={() => { setActiveSlotId(null); setModalProducts([]); }} className="text-[10px] font-bold text-red-500 hover:text-red-600 transition shrink-0 ml-2">Volver</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2 pr-1 scrollbar-hide">
                    {loadingProducts ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                        <span className="text-[10px] text-slate-450 font-bold animate-pulse">Cargando catálogo...</span>
                      </div>
                    ) : sortedModalProducts.length === 0 ? (
                      <div className="py-12 text-center text-[10px] text-slate-400 font-bold">No hay componentes en esta categoría.</div>
                    ) : (
                      sortedModalProducts.map((prod) => {
                        const compat = getCandidateCompatibility(prod);
                        return (
                          <div key={prod.id} onClick={() => handleSelectProduct(prod)} className="rounded-xl border border-slate-200 dark:border-neutral-800/60 hover:border-teal-500 p-2.5 transition-all cursor-pointer flex flex-col gap-1.5 bg-white dark:bg-neutral-950 hover:bg-slate-50 dark:hover:bg-neutral-900">
                            <div className="min-w-0">
                              <h4 className="text-[11px] font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-tight">{prod.name}</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-[8px] bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-extrabold px-1 py-0.5 rounded">{prod.brand}</span>
                                {compat.pass 
                                  ? <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black px-1 py-0.5 rounded border border-emerald-500/10">✓ Compatible</span>
                                  : <span className="text-[8px] bg-rose-500/10 text-rose-600 dark:text-rose-450 font-black px-1 py-0.5 rounded border border-rose-500/10">⚠ Incompatible</span>}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-0.5 border-t border-slate-100 dark:border-neutral-900/60 pt-1 shrink-0">
                              <span className="text-[11px] font-black text-teal-650 dark:text-teal-400">${prod.price.toLocaleString('en-US')}</span>
                              {!compat.pass && <span className="text-[8px] text-red-500 font-medium truncate max-w-[80px]" title={compat.reason}>{compat.reason}</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-500 flex items-center justify-center mb-3"><Sparkles className="h-6 w-6 animate-pulse" /></div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider mb-1">Elegir Componente</h4>
                  <p className="text-[10px] text-slate-500 dark:text-neutral-450 max-w-[180px] leading-relaxed">Haz clic en "Elegir" en las ranuras de la derecha para explorar el catálogo aquí.</p>
                </div>
              )}
            </div>
  
            
            <div className="w-full lg:w-[50%] flex flex-col gap-4">
              <div className="w-full aspect-[16/10] min-h-[350px] relative rounded-2xl overflow-hidden border border-slate-300 dark:border-neutral-850 bg-neutral-950 shadow-md flex flex-col shrink-0">
                <div className="absolute top-3 left-4 z-10 bg-neutral-900/80 border border-neutral-800 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 backdrop-blur-md text-neutral-300 pointer-events-none">
                  <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" /></span>
                  Vista 3D interactiva
                </div>
  
                <div className="absolute top-3 right-16 z-10 bg-neutral-900/80 border border-neutral-800 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 text-teal-400 backdrop-blur-md pointer-events-none">
                  <Wrench className="h-3.5 w-3.5" /> Montaje {assemblyStates['case'] === 'installed' ? installedCount : 0}/{ASSEMBLY_SEQUENCE.length}
                </div>
  
                <div className="absolute right-3 top-14 z-10 flex flex-col gap-1.5">
                  {camBtn('toggle-rotate', <RotateCw className="h-4 w-4" />, 'Rotar')}
                  {camBtn('center', <Crosshair className="h-4 w-4" />, 'Centrar')}
                  {camBtn('zoom-in', <ZoomIn className="h-4 w-4" />, 'Zoom +')}
                  {camBtn('zoom-out', <ZoomOut className="h-4 w-4" />, 'Zoom -')}
                  {camBtn('reset', <RefreshCw className="h-4 w-4" />, 'Reiniciar vista')}
                </div>
  
                <div className="flex-1 min-h-0 bg-neutral-950">
                  <Scene key={sceneKey} states={assemblyStates} onInstallComplete={completeInstall} cameraAction={cameraAction} autoRotate={autoRotate} />
                </div>

                {!isCaseSelected && (
                  <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-35">
                    <div className="w-16 h-16 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/25"><Wrench className="h-8 w-8 animate-pulse" /></div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Simulador bloqueado</h3>
                    <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">Debes escoger un gabinete en el panel derecho para comenzar.</p>
                  </div>
                )}
  
                {isAnimating && (
                  <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-20">
                    <div className="bg-neutral-900/90 border border-teal-500/30 px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-2xl animate-pulse">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />
                      <span className="text-[11px] font-bold text-neutral-200">Ensamble en proceso 3D...</span>
                    </div>
                  </div>
                )}
  
                <div className="absolute bottom-10 left-4 z-10 text-[9px] text-neutral-500 font-medium max-w-xs pointer-events-none">
                  <Info className="h-3 w-3 inline mr-1 -mt-0.5" /> Arrastra para girar, rueda para zoom.
                </div>
  
                <div className="absolute bottom-3 left-0 right-0 z-10 flex items-center justify-center gap-3.5 flex-wrap px-4 text-[9px] font-bold text-neutral-400 pointer-events-none">
                  {LEGEND.map((l) => (
                    <span key={l.label} className="flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${l.color}`} />{l.label}</span>
                  ))}
                </div>
              </div>
  
              <div ref={summaryRef} className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 shrink-0">
                <div className="border border-slate-200 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/10 rounded-2xl p-4 flex flex-col shadow-sm">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2.5">Chequeo físico de compatibilidad</h4>
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[160px] pr-1 scrollbar-hide">
                    {localRuleChecks.map((r) => (
                      <div key={r.label} className="rounded-xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800/40 p-2.5 flex items-start justify-between gap-2 shadow-sm">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-700 dark:text-neutral-300 block truncate">{r.label}</span>
                          <span className={`text-[9px] font-semibold ${r.pass ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'}`}>{r.detail}</span>
                        </div>
                        {r.pass ? <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/10 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Costo total estimado</span>
                      <span className="text-base font-black text-teal-600 dark:text-teal-400">${hardwareStats.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-neutral-900/60 pt-2 mb-3.5 text-[10px] grid grid-cols-2 gap-x-4 gap-y-1">
                      {[
                        { k: 'Consumo', v: `${hardwareStats.estWatts}W` },
                        { k: 'Placa Base', v: hardwareStats.formFactor },
                        { k: 'Socket', v: hardwareStats.cpuSocket || hardwareStats.moboSocket || '-' },
                        { k: 'Memoria', v: hardwareStats.ramType || '-' },
                      ].map((row) => (
                        <div key={row.k} className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-neutral-400 font-medium">{row.k}:</span>
                          <span className="font-bold text-slate-800 dark:text-white truncate max-w-[80px]">{row.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={handleOpenSaveModal} disabled={!hasSelectedComponents} className="h-10 rounded-lg border border-slate-350 dark:border-neutral-800 bg-white dark:bg-neutral-900/65 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/70 disabled:opacity-40 disabled:cursor-not-allowed transition text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-sm">
                        Guardar Proyecto
                      </button>
                      <button type="button" onClick={handleSendToCart} disabled={!hasSelectedComponents} className="h-10 rounded-lg border border-slate-350 dark:border-neutral-800 bg-white dark:bg-neutral-900/65 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/70 disabled:opacity-40 disabled:cursor-not-allowed transition text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-sm">
                        <ShoppingCart className="h-3.5 w-3.5" /> Añadir Carrito
                      </button>
                    </div>
                    <button type="button" onClick={handleDirectCheckout} disabled={!hasSelectedComponents} className="w-full h-10 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/40 disabled:text-slate-900/60 disabled:cursor-not-allowed text-slate-950 transition text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer border-none">
                      Comprar Ensamble
                    </button>
                  </div>
                </div>
              </div>
            </div>
  
            
            <div className="w-full lg:w-[30%] lg:sticky lg:top-6 flex flex-col border border-slate-200 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/10 rounded-2xl overflow-hidden h-[400px] lg:h-[calc(100vh-120px)] shadow-sm">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-neutral-800/60 bg-slate-100/40 dark:bg-neutral-900/60 shrink-0">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-teal-500" /> Ranuras de Ensamble
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100 dark:divide-neutral-900/40 px-2 py-1 scrollbar-hide">
                {visibleComponents.map((comp) => {
                  const st = assemblyStates[comp.id] || 'locked';
                  const activeComp = components.find((c) => c.id === comp.id);
                  const config = STATE_CONFIG[st]; 

                  return (
                    <div key={comp.id} className={`flex items-center gap-2.5 px-3 py-3 transition rounded-xl ${st === 'locked' ? 'opacity-50' : 'hover:bg-slate-100/50 dark:hover:bg-neutral-900/40'}`}>
                      <span className="text-base shrink-0 w-6 text-center">{comp.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{comp.label}</p>
                        <p className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">{activeComp?.dbProduct ? activeComp.dbProduct.name : activeComp?.selectedName}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        
                        {st !== 'available' && (
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border ${config.cls}`}>
                            {config.short}
                          </span>
                        )}
                        {st === 'available' && !activeComp?.dbProduct && (
                          <button type="button" onClick={() => handleOpenSelectModal(comp.id, comp.categorySlug)} className="text-[8px] font-black px-2 py-1 rounded bg-teal-500 hover:bg-teal-400 text-neutral-950 transition cursor-pointer shadow-sm shadow-teal-500/10 border-none">
                            Elegir
                          </button>
                        )}
                        {st === 'available' && activeComp?.dbProduct && (
                          <button type="button" onClick={() => startInstall(comp.id)} className="text-[8px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition cursor-pointer">
                            Instalar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
  
        
        <button type="button" onClick={() => setIsAiOpen(!isAiOpen)} className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-none" title="Asistente AI de Hardware">
          {isAiOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6 animate-bounce" />}
        </button>
  
        
        {isAiOpen && (
          <div className="fixed bottom-24 right-6 z-40 w-[380px] h-[520px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] rounded-2xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
            <div className="bg-teal-500 dark:bg-teal-600 text-slate-950 px-4 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-base">🧠</span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">Arquitecto AI</h4>
                  <p className="text-[9px] font-bold text-slate-900/60 -mt-0.5">En línea</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsAiOpen(false)} className="text-slate-950 hover:bg-black/10 p-1.5 rounded-lg transition"><X className="h-4 w-4" /></button>
            </div>
  
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-neutral-950/30 scrollbar-hide">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border text-[10px] ${msg.role === 'user' ? 'bg-slate-250 border-slate-300 text-slate-700 dark:bg-neutral-850 dark:border-neutral-800 dark:text-neutral-300' : 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400'}`}>
                    {msg.role === 'user' ? '👤' : '🧠'}
                  </div>
                  <div className={`rounded-2xl px-3 py-2 text-[11px] font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-teal-500 text-slate-950 rounded-tr-none font-semibold' : 'bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-850 text-slate-800 dark:text-neutral-200 rounded-tl-none'}`}>
                    {msg.content.split('\n').map((line, idx) => {
                      const parts: React.ReactNode[] = [];
                      let lastIdx = 0;
                      const boldRe = /\*\*(.*?)\*\*/g;
                      let match;
                      while ((match = boldRe.exec(line)) !== null) {
                        parts.push(line.substring(lastIdx, match.index));
                        parts.push(<strong key={match.index} className="font-extrabold">{match[1]}</strong>);
                        lastIdx = boldRe.lastIndex;
                      }
                      parts.push(line.substring(lastIdx));
                      return <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>{parts.length > 1 ? parts : line}</p>;
                    })}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="h-6 w-6 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 text-[10px] animate-pulse">🧠</div>
                  <div className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-850 rounded-2xl rounded-tl-none px-3.5 py-2.5 flex items-center gap-2 shadow-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500 dark:text-teal-400" />
                    <span className="text-[10px] text-slate-400 font-semibold animate-pulse">Pensando...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
  
            <div className="p-2 bg-slate-100 dark:bg-neutral-900/50 border-t border-slate-200 dark:border-neutral-800/60 overflow-x-auto whitespace-nowrap flex gap-1.5 shrink-0 scrollbar-none">
              {['¿Qué motherboard me recomiendas para un Ryzen 5 7600X?', '¿Es compatible DDR5 con la placa MSI PRO B760-P?', '¿Cuántos Watts de fuente necesito para i5 + RTX 4070?', 'Verifica mi ensamble de hardware actual.'].map((text, idx) => (
                <button key={idx} type="button" onClick={() => setChatInput(text)} className="inline-block bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-850 text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 hover:border-slate-300 dark:hover:border-neutral-700 transition text-[9px] font-bold px-2.5 py-1.5 rounded-lg whitespace-normal text-left max-w-[150px] cursor-pointer shadow-sm">
                  {text}
                </button>
              ))}
            </div>
  
            <form onSubmit={handleChatSubmit} className="p-3 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2 shrink-0">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Pregúntale al Arquitecto de Hardware..." disabled={aiLoading} className="flex-1 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-[11px] text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-teal-500 transition font-medium" />
              <button type="submit" disabled={aiLoading || !chatInput.trim()} className="h-9 w-9 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 flex items-center justify-center transition shrink-0 disabled:opacity-50 cursor-pointer border-none">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
  
        <Modal open={isSaveModalOpen} title="Guardar Proyecto de Ensamblaje" onClose={() => setIsSaveModalOpen(false)}>
          <div className="space-y-4 text-slate-900 dark:text-neutral-100">
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium leading-relaxed font-sans">Ingresa un nombre para tu configuración de hardware. Podrás acceder a ella para simularla de nuevo o comprarla directamente desde tu sección "Mis proyectos".</p>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-neutral-500">Nombre del Proyecto</label>
              <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Ej. Mi Ensamble Gamer, Servidor de Trabajo" className="w-full bg-slate-50 border border-slate-200 dark:bg-neutral-900/60 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-teal-500 transition font-medium" />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
              <Button type="button" variant="outline" onClick={() => setIsSaveModalOpen(false)}>Cancelar</Button>
              <button type="button" onClick={handleSaveProject} disabled={!projectName.trim()} className="rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-4 py-2 transition text-xs shadow-sm disabled:opacity-50 cursor-pointer">Guardar</button>
            </div>
          </div>
        </Modal>
  
        <Modal open={isAuthRequiredModalOpen} title="Inicio de Sesión Requerido" onClose={() => setIsAuthRequiredModalOpen(false)}>
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-400"><ShieldCheck className="h-6 w-6" /></div>
            <div>
              <h3 className="text-base font-extrabold text-white">{authModalReason === 'limit' ? 'Límite de Ensamble Gratuito' : authModalReason === 'save' ? 'Guarda tus Proyectos' : 'Completa tu Compra'}</h3>
              <p className="text-xs text-neutral-400 mt-2 max-w-sm mx-auto leading-relaxed">{authModalReason === 'limit' ? 'Como usuario visitante solo puedes ensamblar el Gabinete, Placa Madre y Fuente de Poder de forma gratuita. Regístrate o inicia sesión para montar un PC completo.' : authModalReason === 'save' ? 'Para guardar esta configuración de componentes en tu cuenta personal y verla cuando desees, regístrate o inicia sesión.' : 'Para agregar estas piezas al carrito de compras y continuar al pago, inicia sesión con tu cuenta.'}</p>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <Link to="/login?redirect=/cliente/simulador" onClick={handleSaveTempAssembly} className="flex h-11 items-center justify-center rounded-lg bg-teal-500 font-bold text-slate-950 hover:bg-teal-400 transition text-sm">Iniciar Sesión</Link>
              <Link to="/registro?redirect=/cliente/simulador" onClick={handleSaveTempAssembly} className="flex h-11 items-center justify-center rounded-lg border border-slate-350 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-900 transition font-bold text-slate-800 dark:text-neutral-200 text-sm">Registrarse</Link>
            </div>
          </div>
        </Modal>
  
        <Modal open={isRamQtyModalOpen} title="Cantidad de Módulos RAM" onClose={() => { setIsRamQtyModalOpen(false); setSelectedRamProduct(null); setSelectedRamSlotId(null); setActiveSlotId(null); }}>
          <div className="space-y-4 text-slate-900 dark:text-neutral-100">
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium leading-relaxed font-sans">¿Cuántos módulos de memoria RAM del modelo <strong>{selectedRamProduct?.name}</strong> deseas instalar en la placa madre?</p>
            <div className="grid grid-cols-4 gap-3 py-2">
              {[1, 2, 3, 4].map((qty) => (
                <button key={qty} type="button" onClick={() => handleConfirmRamQuantity(qty)} className="h-14 rounded-xl border border-slate-200 dark:border-neutral-800 hover:border-teal-500 bg-slate-50 dark:bg-neutral-900/60 dark:hover:bg-neutral-900 text-sm font-black flex items-center justify-center transition cursor-pointer hover:scale-105">{qty}x</button>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-neutral-900">
              <Button type="button" variant="outline" onClick={() => { setIsRamQtyModalOpen(false); setSelectedRamProduct(null); setSelectedRamSlotId(null); setActiveSlotId(null); }}>Cancelar</Button>
            </div>
          </div>
        </Modal>
  
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-teal-500/30 bg-neutral-900 px-4 py-3 shadow-2xl animate-fade-in-up">
            <CheckCircle2 className="h-4 w-4 text-teal-400 animate-pulse" />
            <span className="text-xs font-bold text-neutral-200">{toastMessage}</span>
          </div>
        )}
      </div>
  );
};