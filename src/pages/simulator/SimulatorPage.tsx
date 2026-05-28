import React, { useCallback } from 'react';
import { Link } from 'react-router';
import type { CameraAction } from './types';
import {
  RotateCw,
  Crosshair,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle, 
  Loader2,
  ShieldCheck,
  Wrench,
  Info,
  MessageSquare,
  X,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import Scene from './components/Scene';
import { ASSEMBLY_SEQUENCE } from './data/components';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { ComponenteDetalleDrawer } from '../cliente/ComponenteDetalleDrawer';
import { getFriendlyCompatibilityDetail } from './utils/compatibilityHelpers';
import { CatalogPanel } from './components/CatalogPanel';
import { AssemblySlots } from './components/AssemblySlots';
import { SummaryCard } from './components/SummaryCard';
import { ChatbotDrawer } from './components/ChatbotDrawer';
import { useSimulator } from './hooks/useSimulator';

const LEGEND = [
  { label: 'Instalado', color: 'bg-emerald-500' },
  { label: 'Lista para instalar', color: 'bg-teal-500' },
  { label: 'Pendiente', color: 'bg-orange-500' },
  { label: 'Bloqueado', color: 'bg-slate-500' },
  { label: 'Incompatible', color: 'bg-red-500' },
];

export const SimulatorPage = () => {
  const {
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
    cameraAction,
    sceneKey,
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
    setSelectedRamSlotId,
    compatibilityStatus,
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
    setAutoRotate,
    setCameraAction
  } = useSimulator();

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
  }, [autoRotate, setAutoRotate, setCameraAction]);

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
                <button type="button" onClick={handleReset} className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-650 dark:text-red-400 font-bold px-3 py-1.5 transition text-xs shadow-sm cursor-pointer">
                  <RefreshCw className="h-3.5 w-3.5" /> Limpiar Ensamble
                </button>
            )}
          </div>
  
          <div className="flex-1 flex flex-col lg:flex-row items-start gap-4 py-4">
            <div className="w-full lg:w-[30%] lg:sticky lg:top-6 flex flex-col border border-slate-200 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/10 rounded-2xl overflow-hidden h-[400px] lg:h-[calc(100vh-120px)] shadow-sm">
              {activeSlotId ? (
                <CatalogPanel
                  activeSlotId={activeSlotId}
                  components={components}
                  modalProducts={modalProducts}
                  loadingProducts={loadingProducts}
                  catalogSearch={catalogSearch}
                  setCatalogSearch={setCatalogSearch}
                  onSelectProduct={handleSelectProduct}
                  onClose={() => { setActiveSlotId(null); setModalProducts([]); }}
                  onOpenDetail={handleOpenClickDetail}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-500 flex items-center justify-center mb-3"><Sparkles className="h-6 w-6 animate-pulse" /></div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider mb-1">Elegir Componente</h4>
                  <p className="text-[10px] text-slate-500 dark:text-neutral-450 max-w-[180px] leading-relaxed">Haz clic en "Elegir" en las ranuras de la derecha para explorar el catálogo aquí.</p>
                </div>
              )}
            </div>
  
            <div className="w-full lg:w-[50%] flex flex-col gap-4">
              <div className="w-full aspect-[16/10] min-h-[350px] relative rounded-2xl overflow-hidden border border-slate-300 dark:border-neutral-855 bg-neutral-955 shadow-md flex flex-col shrink-0">
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
                    <p className="text-xs text-neutral-450 max-w-xs leading-relaxed">Debes escoger un gabinete en el panel derecho para comenzar.</p>
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
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-neutral-450 mb-2.5">Chequeo físico de compatibilidad</h4>
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[160px] pr-1 scrollbar-hide">
                    {!compatibilityStatus.checked ? (
                      <div className="text-center py-8 text-[10px] text-slate-400 font-bold italic leading-relaxed">
                        Selecciona e instala al menos 2 componentes para iniciar el chequeo del servidor.
                      </div>
                    ) : compatibilityStatus.results.filter((r) => (r.status as string) !== 'SKIPPED').length === 0 ? (
                      <div className="text-center py-8 text-[10px] text-slate-400 font-bold italic leading-relaxed">
                        No se encontraron reglas incompatibles. Configuración compatible.
                      </div>
                    ) : (
                      compatibilityStatus.results
                        .filter((r) => (r.status as string) !== 'SKIPPED')
                        .map((r) => (
                          <div key={`${r.ruleId}-${r.sourceProduct.id}-${r.targetProduct.id}`} className="rounded-xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800/40 p-2.5 flex items-start justify-between gap-2 shadow-sm">
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-medium text-slate-750 dark:text-neutral-350 block truncate">{r.ruleName}</span>
                              <span className={`text-[9px] font-normal leading-snug block mt-0.5 ${r.status === 'PASS' ? 'text-teal-600 dark:text-teal-400' : r.status === 'WARN' ? 'text-amber-650 dark:text-amber-400' : 'text-rose-650 dark:text-rose-450'}`}>
                                {getFriendlyCompatibilityDetail(r.ruleName, r.detail)}
                              </span>
                            </div>
                            {r.status === 'PASS' ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                            ) : r.status === 'WARN' ? (
                              <AlertTriangle className="h-4.5 w-4.5 text-amber-550 dark:text-amber-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-4.5 w-4.5 text-red-550 dark:text-rose-450 shrink-0 mt-0.5" />
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
  
                <SummaryCard
                  components={components}
                  hardwareStats={hardwareStats}
                  hasSelectedComponents={hasSelectedComponents}
                  onOpenSaveModal={handleOpenSaveModal}
                  onSendToCart={handleSendToCart}
                />
              </div>
            </div>
  
            <AssemblySlots
              visibleComponents={visibleComponents}
              assemblyStates={assemblyStates}
              components={components}
              onOpenSelectModal={handleOpenSelectModal}
              onStartInstall={startInstall}
              onRemoveComponent={handleRemoveComponent}
            />
          </div>
        </div>
  
        <button type="button" onClick={() => setIsAiOpen(!isAiOpen)} className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-none" title="Asistente AI de Hardware">
          {isAiOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6 animate-bounce" />}
        </button>
  
        <ChatbotDrawer
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
          messages={chatMessages}
          aiLoading={aiLoading}
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSubmit={handleChatSubmit}
          chatBottomRef={chatBottomRef}
        />
  
        <Modal open={isSaveModalOpen} title="Guardar Proyecto de Ensamblaje" onClose={() => setIsSaveModalOpen(false)}>
          <div className="space-y-4 text-slate-900 dark:text-neutral-100">
            <p className="text-xs text-slate-500 dark:text-neutral-450 font-medium leading-relaxed font-sans">Ingresa un nombre para tu configuración de hardware. Podrás acceder a ella para simularla de nuevo o comprarla directamente desde tu sección "Mis proyectos".</p>
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

        <ComponenteDetalleDrawer
          componente={selectedDetailProduct}
          open={isDetailDrawerOpen}
          onClose={() => {
            setIsDetailDrawerOpen(false);
            setSelectedDetailProduct(null);
          }}
          onAddToCart={() => {}} 
          triggerType="click"
        />
      </div>
  );
};