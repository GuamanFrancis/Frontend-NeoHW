import type { CatalogComponent } from '../../../types/catalog';
import type { PCComponent } from '../types';

export const getProductAttr = (prod: CatalogComponent | null | undefined, attrName: string): string | null => {
  if (!prod || !prod.attributes) return null;
  const attr = prod.attributes.find((a) => a.name.toLowerCase() === attrName.toLowerCase());
  return attr ? attr.value.trim() : null;
};

export const isFormFactorCompatible = (moboForm: string | null, caseForm: string | null): boolean => {
  if (!moboForm || !caseForm) return true;
  const mobo = moboForm.toLowerCase();
  const box = caseForm.toLowerCase();
  
  if (box === 'atx') {
    return mobo === 'atx' || mobo === 'micro-atx' || mobo === 'mini-itx';
  }
  if (box === 'micro-atx') {
    return mobo === 'micro-atx' || mobo === 'mini-itx';
  }
  if (box === 'mini-itx') {
    return mobo === 'mini-itx';
  }
  return true;
};

export const getFriendlyCompatibilityDetail = (ruleName: string, detail: string): string => {
  const cleanDetail = detail.toLowerCase();
  
  if (ruleName === 'Socket CPU-Mobo Match') {
    const matches = detail.match(/No coinciden:\s*([\w\-]+)\s*vs\s*([\w\-]+)/i);
    if (matches) {
      return `El procesador (${matches[1].toUpperCase()}) no es compatible físicamente con el zócalo (socket) de la placa madre (${matches[2].toUpperCase()}).`;
    }
  }
  
  if (ruleName === 'RAM Type Match') {
    const matches = detail.match(/No coinciden:\s*([\w\-]+)\s*vs\s*([\w\-]+)/i);
    if (matches) {
      return `La memoria RAM (${matches[1].toUpperCase()}) no coincide con el tipo de ranura DDR de la placa madre (${matches[2].toUpperCase()}).`;
    }
  }
  
  if (ruleName === 'Form Factor Mobo-Case Match' || cleanDetail.includes('formato') || cleanDetail.includes('factor')) {
    return `Las dimensiones de la placa madre superan el espacio disponible en el gabinete seleccionado.`;
  }
  
  if (ruleName === 'PSU-GPU Watts Match' || cleanDetail.includes('potencia') || cleanDetail.includes('watts')) {
    const matches = detail.match(/(\d+)W\s*disponible,\s*(\d+)W\s*requerido/i);
    if (matches) {
      return `La fuente de poder es insuficiente: ofrece ${matches[1]}W pero tu configuración requiere al menos ${matches[2]}W.`;
    }
    return `La fuente de poder no tiene suficiente potencia para alimentar la tarjeta gráfica seleccionada.`;
  }

  return detail
    .replace('Ambos coinciden:', 'Compatible:')
    .replace('No coinciden:', 'Incompatible:');
};

export const checkProductCompatibility = (
  prod: CatalogComponent,
  slotId: string,
  components: PCComponent[]
): string | null => {
  const installedCpu = components.find(c => c.id === 'cpu')?.dbProduct;
  const installedMobo = components.find(c => c.id === 'motherboard')?.dbProduct;
  const installedCase = components.find(c => c.id === 'case')?.dbProduct;
  const installedRam = components.find(c => c.id === 'ram_1')?.dbProduct;

  if (slotId === 'motherboard') {
    if (installedCpu) {
      const cpuSocket = getProductAttr(installedCpu, 'Socket');
      const moboSocket = getProductAttr(prod, 'Socket');
      if (cpuSocket && moboSocket && cpuSocket.toLowerCase() !== moboSocket.toLowerCase()) {
        return `Zócalo incompatible: CPU requiere ${cpuSocket.toUpperCase()}, placa tiene ${moboSocket.toUpperCase()}.`;
      }
    }
    if (installedRam) {
      const ramType = getProductAttr(installedRam, 'Tipo de RAM');
      const moboRam = getProductAttr(prod, 'Tipo de RAM');
      if (ramType && moboRam && ramType.toLowerCase() !== moboRam.toLowerCase()) {
        return `Memoria incompatible: RAM instalada es ${ramType.toUpperCase()}, placa soporta ${moboRam.toUpperCase()}.`;
      }
    }
    if (installedCase) {
      const caseForm = getProductAttr(installedCase, 'Formato');
      const moboForm = getProductAttr(prod, 'Formato');
      if (caseForm && moboForm && !isFormFactorCompatible(moboForm, caseForm)) {
        return `Formato incompatible: Placa (${moboForm.toUpperCase()}) es muy grande para el gabinete (${caseForm.toUpperCase()}).`;
      }
    }
  }

  if (slotId === 'cpu') {
    if (installedMobo) {
      const moboSocket = getProductAttr(installedMobo, 'Socket');
      const cpuSocket = getProductAttr(prod, 'Socket');
      if (moboSocket && cpuSocket && moboSocket.toLowerCase() !== cpuSocket.toLowerCase()) {
        return `Zócalo incompatible: Placa requiere ${moboSocket.toUpperCase()}, CPU tiene ${cpuSocket.toUpperCase()}.`;
      }
    }
  }

  if (slotId.startsWith('ram_')) {
    if (installedMobo) {
      const moboRam = getProductAttr(installedMobo, 'Tipo de RAM');
      const ramType = getProductAttr(prod, 'Tipo de RAM');
      if (moboRam && ramType && moboRam.toLowerCase() !== ramType.toLowerCase()) {
        return `Memoria incompatible: Placa requiere ${moboRam.toUpperCase()}, RAM seleccionada es ${ramType.toUpperCase()}.`;
      }
    }
  }

  if (slotId === 'case') {
    if (installedMobo) {
      const moboForm = getProductAttr(installedMobo, 'Formato');
      const caseForm = getProductAttr(prod, 'Formato');
      if (moboForm && caseForm && !isFormFactorCompatible(moboForm, caseForm)) {
        return `Gabinete incompatible: No soporta formato de placa ${moboForm.toUpperCase()} (gabinete es ${caseForm.toUpperCase()}).`;
      }
    }
  }

  return null;
};
