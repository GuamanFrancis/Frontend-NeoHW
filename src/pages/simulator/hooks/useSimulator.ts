import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { getCatalogComponents } from '../../../services/catalogService';
import { checkCompatibility, getCompatibilityRules } from '../../../services/compatibilityService';
import { streamAiChat } from '../../../services/aiService';
import { useCart } from '../../../context/CartContext';
import { getStoredSession } from '../../../services/session';
import { saveProject } from '../../../services/projectsService';
import type { PCComponent, ComponentState, CameraAction } from '../types';
import type { CatalogComponent } from '../../../types/catalog';
import type { CompatibilityRule, CompatibilityCheckResult } from '../../../services/compatibilityService';
import type { ChatMessage } from '../../../services/aiService';
import { checkProductCompatibility } from '../utils/compatibilityHelpers';
import { ASSEMBLY_SEQUENCE, PC_COMPONENTS } from '../data/components';

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

const getStoredComponents = (): PCComponent[] => {
  try {
    const stored = localStorage.getItem('neohw_live_assembly');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.components && Array.isArray(parsed.components)) {
        const validIds = new Set(PC_COMPONENTS.map(c => c.id));
        const filtered = parsed.components.filter((c: any) => validIds.has(c.id));
        return PC_COMPONENTS.map(pc => {
          const storedComp = filtered.find((c: any) => c.id === pc.id);
          return storedComp ? { ...pc, dbProduct: storedComp.dbProduct, selectedName: storedComp.selectedName, quantity: storedComp.quantity } : pc;
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
  return PC_COMPONENTS;
};

const getStoredAssemblyStates = (): Record<string, ComponentState> => {
  try {
    const stored = localStorage.getItem('neohw_live_assembly');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.assemblyStates) {
        const validIds = new Set(PC_COMPONENTS.map(c => c.id));
        const filteredStates: Record<string, ComponentState> = {};
        Object.entries(parsed.assemblyStates).forEach(([k, v]) => {
          if (validIds.has(k)) {
            filteredStates[k] = v as ComponentState;
          }
        });
        return recalcStates(filteredStates, PC_COMPONENTS);
      }
    }
  } catch (e) {
    console.error(e);
  }
  return recalcStates({}, PC_COMPONENTS);
};

export const useSimulator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addMultipleToCart } = useCart();
  const session = getStoredSession();
  const userId = session?.user.id;

  const [components, setComponents] = useState<PCComponent[]>(getStoredComponents);
  const [assemblyStates, setAssemblyStates] = useState<Record<string, ComponentState>>(getStoredAssemblyStates);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<CatalogComponent | null>(null);

  const handleOpenClickDetail = useCallback((product: CatalogComponent) => {
    setSelectedDetailProduct(product);
    setIsDetailDrawerOpen(true);
  }, []);
  
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraAction, setCameraAction] = useState<CameraAction | null>(null);
  const [sceneKey, setSceneKey] = useState(0);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [modalProducts, setModalProducts] = useState<CatalogComponent[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');

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
  const [compatibilityStatus, setCompatibilityStatus] = useState<{ checked: boolean; compatible: boolean; results: CompatibilityCheckResult[] }>({ checked: false, compatible: true, results: [] });
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

  const isMoboMiniItx = useMemo(() => {
    const moboProd = components.find((c) => c.id === 'motherboard')?.dbProduct;
    if (!moboProd) return false;
    const name = moboProd.name.toLowerCase();
    const form = (getAttr(moboProd, 'formato') || '').toLowerCase();
    return name.includes('itx') || form.includes('itx');
  }, [components, getAttr]);

  const maxRamSlots = isMoboMiniItx ? 2 : 4;

  const hardwareStats = useMemo(() => {
    const cpuProd = components.find((c) => c.id === 'cpu')?.dbProduct;
    const moboProd = components.find((c) => c.id === 'motherboard')?.dbProduct;
    const psuProd = components.find((c) => c.id === 'psu')?.dbProduct;
    const ramProd = components.find((c) => c.id === 'ram_1')?.dbProduct;
    const gpuProd = components.find((c) => c.id === 'gpu')?.dbProduct;

    const cpuSocket = getAttr(cpuProd, 'socket') || '-';
    const moboSocket = getAttr(moboProd, 'socket') || '-';
    const ramType = getAttr(ramProd, 'tipo') || getAttr(ramProd, 'ddr') || '-';
    const moboRam = getAttr(moboProd, 'ddr') || getAttr(moboProd, 'ram') || '-';
    const formFactor = getAttr(moboProd, 'factor') || getAttr(moboProd, 'form') || '-';

    const cpuTdp = parseInt(getAttr(cpuProd, 'tdp') || '0', 10);
    const gpuTdp = parseInt(getAttr(gpuProd, 'tdp') || '0', 10);
    const psuWatts = parseInt(getAttr(psuProd, 'potencia') || getAttr(psuProd, 'watt') || '0', 10);
    
    const estWatts = cpuTdp + gpuTdp > 0 ? cpuTdp + gpuTdp + 80 : 0;
    const totalPrice = components.reduce((a, c) => a + (c.dbProduct?.price || 0), 0);
    
    return { cpuProd, moboProd, ramProd, cpuSocket, moboSocket, ramType, moboRam, formFactor, estWatts, psuWatts, totalPrice };
  }, [components, getAttr]);

  useEffect(() => {
    const fetchRules = async () => {
      setLoadingRules(true);
      try {
        const res = await getCompatibilityRules();
        setRules(res.data);
      } catch { console.error("Error cargando reglas:", Error); } finally {
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
        const filteredResults = res.results.filter((r) => {
          const sourceSlot = components.find((c) => c.dbProduct?.id === r.sourceProduct.id)?.id;
          const targetSlot = components.find((c) => c.dbProduct?.id === r.targetProduct.id)?.id;
          if (r.ruleName.includes('Mobo-Case Form Factor')) {
            return sourceSlot === 'motherboard' && targetSlot === 'case';
          }
          if (r.ruleName.includes('CPU-Mobo Socket')) {
            return sourceSlot === 'cpu' && targetSlot === 'motherboard';
          }
          if (r.ruleName.includes('RAM-Mobo Type')) {
            return sourceSlot?.startsWith('ram_') && targetSlot === 'motherboard';
          }
          if (r.ruleName.includes('Case GPU Clearance')) {
            return sourceSlot === 'gpu' && targetSlot === 'case';
          }
          if (r.ruleName.includes('PSU Wattage Capacity')) {
            return (sourceSlot === 'cpu' || sourceSlot === 'gpu') && targetSlot === 'psu';
          }
          if (r.ruleName.includes('PSU-Case Form Factor')) {
            return sourceSlot === 'psu' && targetSlot === 'case';
          }
          return true;
        });
        const compatible = filteredResults.every((r) => r.status !== 'FAIL');
        setCompatibilityStatus({ checked: true, compatible, results: filteredResults });
      } catch { console.error("Error comprobando compatibilidad:", Error); } finally {
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
      localStorage.setItem('neohw_live_assembly', JSON.stringify({ components, assemblyStates }));
    } catch (e) {
      console.error(e);
    }
  }, [components, assemblyStates]);

  useEffect(() => {
    const loadProject = location.state?.loadProject;
    if (loadProject) {
      const savedMap = loadProject.componentsMap;
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
      setToastMessage(`Proyecto "${loadProject.name}" cargado en el simulador.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  }, [location.state, navigate, location.pathname]);

  const handleSaveTempAssembly = useCallback(() => {
    localStorage.setItem('neohw_temp_assembly', JSON.stringify({ components, assemblyStates }));
  }, [components, assemblyStates]);

  const handleOpenSaveModal = useCallback(() => {
    if (!userId) {
      setAuthModalReason('save');
      setIsAuthRequiredModalOpen(true);
      return;
    }
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-EC');
    const timeStr = now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    setProjectName(`Ensamble NeoHW - ${dateStr} ${timeStr}`);
    setIsSaveModalOpen(true);
  }, [userId]);

  const handleSaveProject = useCallback(() => {
    if (!projectName.trim() || !userId) return;
    
    const groupedItems: Record<string, number> = {};
    components.forEach((c) => {
      if (c.dbProduct) {
        const pId = c.dbProduct.id;
        groupedItems[pId] = (groupedItems[pId] || 0) + 1;
      }
    });

    const items = Object.entries(groupedItems).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    if (items.length === 0) {
      alert('El proyecto debe tener al menos un componente seleccionado.');
      return;
    }

    const payload = {
      name: projectName.trim(),
      description: `Ensamble creado en el simulador 3D el ${new Date().toLocaleDateString('es-EC')}`,
      items,
    };

    saveProject(payload)
      .then(() => {
        setIsSaveModalOpen(false);
        setToastMessage(`Proyecto "${projectName}" guardado en tu cuenta.`);
        setTimeout(() => setToastMessage(null), 3000);
      })
      .catch((err) => {
        console.error(err);
        alert('Error al guardar el proyecto en el servidor');
      });
  }, [projectName, userId, components]);

  const handleSendToCart = useCallback(async () => {
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
    await addMultipleToCart(selectedProds);
    setToastMessage("¡Añadidos al carrito!");
    setTimeout(() => setToastMessage(null), 3000);
    navigate('/cliente/carrito');
  }, [userId, components, addMultipleToCart, navigate]);

  const handleReset = useCallback(() => {
    setComponents(PC_COMPONENTS.map((c) => ({ ...c, dbProduct: null })));
    setAssemblyStates(recalcStates({}, PC_COMPONENTS));
    setIsAnimating(false);
    setAutoRotate(false);
    setCameraAction({ type: 'reset', ts: Date.now() });
    setSceneKey(prev => prev + 1);
    try {
      localStorage.removeItem('neohw_live_assembly');
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleRemoveComponent = useCallback((id: string) => {
    const idsToRemove = new Set<string>([id]);
    if (id === 'ram_1') {
      idsToRemove.add('ram_2');
      idsToRemove.add('ram_3');
      idsToRemove.add('ram_4');
    }

    let added = true;
    while (added) {
      added = false;
      PC_COMPONENTS.forEach((c) => {
        if (c.requiredAfter && idsToRemove.has(c.requiredAfter) && !idsToRemove.has(c.id)) {
          idsToRemove.add(c.id);
          added = true;
        }
      });
    }

    setComponents((prev) => prev.map((c) => {
      if (idsToRemove.has(c.id)) {
        let defaultName = 'Sin seleccionar';
        if (c.id.startsWith('ram_') && c.id !== 'ram_1') {
          defaultName = `Memoria RAM DDR4/DDR5 Slot ${c.id.replace('ram_', '')}`;
        }
        return { ...c, dbProduct: null, selectedName: defaultName };
      }
      return c;
    }));

    setAssemblyStates((prev) => {
      const next = { ...prev };
      idsToRemove.forEach((x) => {
        delete next[x];
      });
      return recalcStates(next, PC_COMPONENTS);
    });
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
    setCatalogSearch('');
    setLoadingProducts(true);
    try {
      const res = await getCatalogComponents({ category: catSlug, limit: 50 });
      const sorted = res.items.sort((a, b) => {
        const errA = checkProductCompatibility(a, slotId, components);
        const errB = checkProductCompatibility(b, slotId, components);
        if (!errA && errB) return -1;
        if (errA && !errB) return 1;
        return 0;
      });
      setModalProducts(sorted);
    } catch { console.error("Error abriendo modal:", Error); } finally {
      setLoadingProducts(false);
    }
  }, [userId, components]);

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

  return {
    isPublic,
    components,
    assemblyStates,
    isAnimating,
    isDetailDrawerOpen,
    selectedDetailProduct,
    setIsDetailDrawerOpen,
    setSelectedDetailProduct,
    handleOpenClickDetail,
    isAiOpen,
    setIsAiOpen,
    autoRotate,
    setAutoRotate,
    cameraAction,
    setCameraAction,
    sceneKey,
    setSceneKey,
    activeSlotId,
    setActiveSlotId,
    modalProducts,
    setModalProducts,
    loadingProducts,
    toastMessage,
    catalogSearch,
    setCatalogSearch,
    isSaveModalOpen,
    setIsSaveModalOpen,
    projectName,
    setProjectName,
    isAuthRequiredModalOpen,
    setIsAuthRequiredModalOpen,
    authModalReason,
    isRamQtyModalOpen,
    setIsRamQtyModalOpen,
    selectedRamProduct,
    setSelectedRamProduct,
    selectedRamSlotId,
    setSelectedRamSlotId,
    compatibilityStatus,
    maxRamSlots,
    chatInput,
    setChatInput,
    aiLoading,
    chatMessages,
    summaryRef,
    chatBottomRef,
    isCaseSelected,
    hasSelectedComponents,
    installedCount,
    visibleComponents,
    hardwareStats,
    handleOpenSaveModal,
    handleSaveProject,
    handleSendToCart,
    handleReset,
    handleRemoveComponent,
    completeInstall,
    startInstall,
    handleOpenSelectModal,
    handleSelectProduct,
    handleConfirmRamQuantity,
    handleChatSubmit,
    handleSaveTempAssembly,
    setToastMessage
  };
};
