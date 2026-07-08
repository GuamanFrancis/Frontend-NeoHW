import React, { useCallback } from 'react';
import { Link } from 'react-router';
import type { CameraAction } from './types';
import {
  RotateCw,
  Crosshair,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Wrench,
  Info,
  MessageSquare,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import Scene from './components/Scene';
import { ASSEMBLY_SEQUENCE } from './data/components';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { ComponenteDetalleDrawer } from '../cliente/ComponenteDetalleDrawer';
import { AssemblySlots } from './components/AssemblySlots';
import { SummaryCard } from './components/SummaryCard';
import { ChatbotDrawer } from './components/ChatbotDrawer';
import { useSimulator } from './hooks/useSimulator';


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
    isAuthRequiredModalOpen,
    setIsAuthRequiredModalOpen,
    authModalReason,
    isRamQtyModalOpen,
    setIsRamQtyModalOpen,
    selectedRamProduct,
    setSelectedRamProduct,
    setSelectedRamSlotId,
    compatibilityStatus,
    maxRamSlots,
    chatInput,
    setChatInput,
    aiLoading,
    chatMessages,
    chatBottomRef,
    isCaseSelected,
    hasSelectedComponents,
    installedCount,
    visibleComponents,
    hardwareStats,
    handleSendToCart,
    isCartLoading,
    handleReset,
    handleRemoveComponent,
    completeInstall,
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
      <div className={isPublic ? "flex flex-col bg-slate-50 text-slate-900 dark:bg-neutral-950 dark:text-white min-h-screen transition-colors duration-200 overflow-x-hidden" : "flex flex-col -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 -mb-5 sm:-mb-6 bg-slate-50 text-slate-900 dark:bg-neutral-950 dark:text-white min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] transition-colors duration-200 overflow-y-auto lg:overflow-hidden"}>
        {isPublic && <PublicHeader />}
        <div className="flex-1 flex flex-col px-4 sm:px-6">
          <div className="flex-1 flex flex-col lg:flex-row items-start gap-4 py-4">
            <div className="w-full lg:w-[25%] shrink-0">
              <AssemblySlots
                visibleComponents={visibleComponents}
                assemblyStates={assemblyStates}
                components={components}
                onOpenSelectModal={handleOpenSelectModal}
                onRemoveComponent={handleRemoveComponent}
                activeSlotId={activeSlotId}
                modalProducts={modalProducts}
                loadingProducts={loadingProducts}
                catalogSearch={catalogSearch}
                setCatalogSearch={setCatalogSearch}
                onSelectProduct={handleSelectProduct}
                onCloseCatalog={() => { setActiveSlotId(null); setModalProducts([]); }}
                onOpenDetail={handleOpenClickDetail}
                hasSelectedComponents={hasSelectedComponents}
                onReset={handleReset}
              />
            </div>
  
            <div className="w-full lg:w-[55%] flex flex-col gap-4">
              <div className="w-full aspect-[16/10] min-h-[480px] lg:min-h-[580px] relative rounded-2xl overflow-hidden border border-slate-350 dark:border-neutral-800 bg-neutral-950 shadow-md flex flex-col shrink-0">
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
                  {isCaseSelected && (
                    <Scene key={sceneKey} states={assemblyStates} onInstallComplete={completeInstall} cameraAction={cameraAction} autoRotate={autoRotate} />
                  )}
                </div>
  
                {!isCaseSelected && (
                  <div className="absolute inset-0 bg-slate-955/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-35">
                    <div className="w-16 h-16 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/25"><Wrench className="h-8 w-8 animate-pulse" /></div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Simulador bloqueado</h3>
                    <p className="text-sm text-neutral-200 max-w-xs leading-relaxed">Debes escoger un gabinete en el panel izquierdo para comenzar.</p>
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
  
                <div className="absolute bottom-10 left-4 z-10 text-[9px] text-neutral-300 font-medium max-w-xs pointer-events-none">
                  <Info className="h-3 w-3 inline mr-1 -mt-0.5" /> Arrastra para girar, rueda para zoom.
                </div>
              </div>
            </div>
  
            <div className="w-full lg:w-[20%] flex flex-col gap-4 lg:sticky lg:top-6 lg:h-[calc(100vh-120px)]">
              <SummaryCard
                components={components}
                hardwareStats={hardwareStats}
                hasSelectedComponents={hasSelectedComponents}
                onSendToCart={handleSendToCart}
                isCartLoading={isCartLoading}
                compatibilityStatus={compatibilityStatus}
              />
            </div>
          </div>
        </div>
  
        {!isAiOpen && (
          <div className="fixed bottom-7 right-24 z-40 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-[11px] font-bold px-4 py-2.5 rounded-2xl shadow-xl animate-pulse flex items-center gap-1.5 pointer-events-none select-none border border-indigo-500/30">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            ¿Dudas con el ensamble? ¡Pregúntale a la IA!
          </div>
        )}
  
        <button 
          type="button" 
          onClick={() => setIsAiOpen(!isAiOpen)} 
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border-none" 
          title="Asistente de Compatibilidad IA"
        >
          {isAiOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="relative">
              <MessageSquare className="h-6 w-6 animate-pulse" />
              <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
            </div>
          )}
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
  
        <Modal open={isAuthRequiredModalOpen} title="Inicio de Sesión Requerido" onClose={() => setIsAuthRequiredModalOpen(false)}>
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-400"><ShieldCheck className="h-6 w-6" /></div>
            <div>
              <h3 className="text-base font-extrabold text-white">{authModalReason === 'limit' ? 'Límite de Ensamble Gratuito' : authModalReason === 'save' ? 'Guarda tus Proyectos' : 'Completa tu Compra'}</h3>
              <p className="text-xs text-slate-700 dark:text-neutral-300 mt-2 max-w-sm mx-auto leading-relaxed">{authModalReason === 'limit' ? 'Como usuario visitante solo puedes ensamblar el Gabinete, Placa Madre y Fuente de Poder de forma gratuita. Regístrate o inicia sesión para montar un PC completo.' : authModalReason === 'save' ? 'Para guardar esta configuración de componentes en tu cuenta personal y verla cuando desees, regístrate o inicia sesión.' : 'Para agregar estas piezas al carrito de compras y continuar al pago, inicia sesión con tu cuenta.'}</p>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <Link to="/login?redirect=/cliente/simulador" onClick={handleSaveTempAssembly} className="flex h-11 items-center justify-center rounded-lg bg-teal-500 font-bold text-slate-950 hover:bg-teal-400 transition text-sm">Iniciar Sesión</Link>
              <Link to="/registro?redirect=/cliente/simulador" onClick={handleSaveTempAssembly} className="flex h-11 items-center justify-center rounded-lg border border-slate-350 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-900 transition font-bold text-slate-800 dark:text-neutral-200 text-sm">Registrarse</Link>
            </div>
          </div>
        </Modal>
  
        <Modal open={isRamQtyModalOpen} title="Cantidad de Módulos RAM" onClose={() => { setIsRamQtyModalOpen(false); setSelectedRamProduct(null); setSelectedRamSlotId(null); setActiveSlotId(null); }}>
          <div className="space-y-4 text-slate-900 dark:text-neutral-100">
            <p className="text-xs text-slate-700 dark:text-neutral-300 font-medium leading-relaxed font-sans">¿Cuántos módulos de memoria RAM del modelo <strong>{selectedRamProduct?.name}</strong> deseas instalar en la placa madre?</p>
            <div className="grid grid-cols-4 gap-3 py-2">
              {Array.from({ length: maxRamSlots }, (_, i) => i + 1).map((qty) => (
                <button key={qty} type="button" onClick={() => handleConfirmRamQuantity(qty)} className="h-14 rounded-xl border border-slate-200 dark:border-neutral-800 hover:border-teal-500 bg-slate-50 dark:bg-neutral-900/60 dark:hover:bg-neutral-900 text-sm font-black flex items-center justify-center transition cursor-pointer hover:scale-105">{qty}x</button>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-neutral-900">
              <Button type="button" variant="outline" onClick={() => { setIsRamQtyModalOpen(false); setSelectedRamProduct(null); setSelectedRamSlotId(null); setActiveSlotId(null); }}>Cancelar</Button>
            </div>
          </div>
        </Modal>
  
        {toastMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-2xl border border-teal-500/40 bg-slate-900/95 dark:bg-neutral-900/95 px-6 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md text-white font-sans max-w-md w-full sm:w-auto text-center justify-center animate-bounce">
            <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0 animate-pulse" />
            <span className="text-sm font-bold tracking-wide">{toastMessage}</span>
          </div>
        )}

        <ComponenteDetalleDrawer
          componente={selectedDetailProduct}
          open={isDetailDrawerOpen}
          onClose={() => {
            setIsDetailDrawerOpen(false);
            setSelectedDetailProduct(null);
          }}
          showAddToCart={false}
          triggerType="click"
        />
      </div>
  );
};