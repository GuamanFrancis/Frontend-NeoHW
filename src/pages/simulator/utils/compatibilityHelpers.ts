import type { CatalogComponent } from '../../../types/catalog';
import type { PCComponent } from '../types';

export const getProductAttr = (prod: CatalogComponent | null | undefined, attrName: string): string | null => {
  if (!prod || !prod.attributes) return null;
  const attr = prod.attributes.find((a) => a.name.toLowerCase() === attrName.toLowerCase());
  return attr ? attr.value.trim() : null;
};

export const isFormFactorCompatible = (moboForm: string | null, caseFormats: string | null): boolean => {
  if (!moboForm || !caseFormats) return true;
  const mobo = moboForm.trim().toLowerCase();
  const formats = caseFormats.split(',').map((f) => f.trim().toLowerCase());
  return formats.includes(mobo);
};

export const isPsuFormFactorCompatible = (psuForm: string | null, casePsuFormats: string | null): boolean => {
  if (!psuForm || !casePsuFormats) return true;
  const psu = psuForm.trim().toLowerCase();
  const formats = casePsuFormats.split(',').map((f) => f.trim().toLowerCase());
  return formats.includes(psu);
};

export const getFriendlyCompatibilityDetail = (ruleName: string, detail: string, status?: string): string => {
  const cleanDetail = detail.toLowerCase();
  const isPass = status === 'PASS';

  if (ruleName === 'Socket CPU-Mobo Match' || ruleName === 'CPU-Mobo Socket') {
    if (isPass) {
      return 'El procesador y la placa madre tienen el mismo zócalo compatible.';
    }
    const matches = detail.match(/(?:no coinciden:\s*)?([\w-]+)\s*vs\s*([\w-]+)/i);
    if (matches) {
      return `El procesador (${matches[1].toUpperCase()}) no es compatible físicamente con el zócalo de la placa madre (${matches[2].toUpperCase()}).`;
    }
  }

  if (ruleName === 'RAM Type Match' || ruleName === 'RAM-Mobo Type') {
    if (isPass) {
      return 'La memoria RAM coincide con el tipo de ranura DDR de la placa madre.';
    }
    const matches = detail.match(/(?:no coinciden:\s*)?([\w-]+)\s*vs\s*([\w-]+)/i);
    if (matches) {
      return `La memoria RAM (${matches[1].toUpperCase()}) no coincide con el tipo de ranura DDR de la placa madre (${matches[2].toUpperCase()}).`;
    }
  }

  if (ruleName === 'PSU-Case Form Factor') {
    if (isPass) {
      return 'El formato de la fuente de poder es compatible con el gabinete seleccionado.';
    }
    const matches = detail.match(/(?:incompatible:\s*)?([a-zA-Z0-9,\s-]+)\s+no\s+incluye\s+a\s+([a-zA-Z0-9,\s-]+)/i);
    if (matches) {
      return `El gabinete seleccionado solo admite fuentes de formato ${matches[1].toUpperCase()}, pero elegiste una fuente ${matches[2].toUpperCase()}.`;
    }
    return 'El formato de la fuente de poder no es compatible con el gabinete seleccionado.';
  }

  if (ruleName === 'Form Factor Mobo-Case Match' || ruleName === 'Mobo-Case Form Factor') {
    if (isPass) {
      return 'El formato de la placa madre es compatible con el gabinete.';
    }
    const matches = detail.match(/(?:incompatible:\s*)?([a-zA-Z0-9,\s-]+)\s+no\s+incluye\s+a\s+([a-zA-Z0-9,\s-]+)/i);
    if (matches) {
      return `El gabinete seleccionado solo admite placas de formato ${matches[1].toUpperCase()}, pero elegiste una placa ${matches[2].toUpperCase()}.`;
    }
    return 'Las dimensiones de la placa madre superan el espacio disponible en el gabinete seleccionado.';
  }

  if (ruleName === 'PSU-GPU Watts Match' || ruleName === 'PSU Wattage Capacity' || cleanDetail.includes('potencia') || cleanDetail.includes('watts')) {
    const matches = detail.match(/(\d+)W\s*disponible,\s*(\d+)W\s*requerido/i);
    if (matches) {
      if (isPass) {
        return `La fuente de poder ofrece potencia suficiente: ofrece ${matches[1]}W y tu configuración requiere ${matches[2]}W.`;
      }
      return `La fuente de poder es insuficiente: ofrece ${matches[1]}W pero tu configuración requiere al menos ${matches[2]}W.`;
    }
    return isPass
      ? 'La fuente de poder tiene suficiente potencia.'
      : 'La fuente de poder no tiene suficiente potencia para alimentar los componentes seleccionados.';
  }

  if (ruleName === 'Case GPU Clearance') {
    const matches = detail.match(/(\d+)\s*<=\s*(\d+)/);
    if (matches) {
      return `La longitud de la tarjeta gráfica (${matches[1]} mm) es adecuada para el espacio disponible del gabinete (${matches[2]} mm).`;
    }
    const failMatches = detail.match(/(?:fuera de rango:\s*)?(\d+)\s*lte\s*(\d+)/i);
    if (failMatches) {
      return `La tarjeta gráfica (${failMatches[1]} mm) excede la longitud máxima permitida por el gabinete (${failMatches[2]} mm).`;
    }
    return isPass
      ? 'La tarjeta gráfica cabe en el gabinete.'
      : 'La tarjeta gráfica excede la longitud máxima permitida por el gabinete.';
  }

  if (cleanDetail.includes('formato') || cleanDetail.includes('factor')) {
    if (isPass) {
      return 'El formato del componente es compatible.';
    }
    return 'El formato del componente no es compatible con el resto del ensamble.';
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
  const installedCpu = components.find((c) => c.id === 'cpu')?.dbProduct;
  const installedMobo = components.find((c) => c.id === 'motherboard')?.dbProduct;
  const installedCase = components.find((c) => c.id === 'case')?.dbProduct;
  const installedRam = components.find((c) => c.id === 'ram_1')?.dbProduct;
  const installedGpu = components.find((c) => c.id === 'gpu')?.dbProduct;
  const installedPsu = components.find((c) => c.id === 'psu')?.dbProduct;

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
      const caseForm = getProductAttr(installedCase, 'Formatos Soportados');
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
    if (installedPsu) {
      const psuWatts = parseInt(getProductAttr(installedPsu, 'Potencia') || '0', 10);
      const cpuTdp = parseInt(getProductAttr(prod, 'TDP') || '0', 10);
      const gpuTdp = parseInt(getProductAttr(installedGpu, 'TDP') || '0', 10);
      const requiredWatts = (cpuTdp + gpuTdp) > 0 ? (cpuTdp + gpuTdp + 80) : 0;
      if (psuWatts > 0 && requiredWatts > 0 && psuWatts < requiredWatts) {
        return `Potencia insuficiente: Fuente instalada es de ${psuWatts}W, tu configuración requiere al menos ${requiredWatts}W.`;
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
      const caseForm = getProductAttr(prod, 'Formatos Soportados');
      if (moboForm && caseForm && !isFormFactorCompatible(moboForm, caseForm)) {
        return `Gabinete incompatible: No soporta formato de placa ${moboForm.toUpperCase()} (gabinete soporta ${caseForm.toUpperCase()}).`;
      }
    }
    if (installedPsu) {
      const psuForm = getProductAttr(installedPsu, 'Formato PSU');
      const casePsuForm = getProductAttr(prod, 'Formatos PSU Soportados');
      if (psuForm && casePsuForm && !isPsuFormFactorCompatible(psuForm, casePsuForm)) {
        return `Gabinete incompatible: Requiere fuente de formato ${casePsuForm.toUpperCase()} (fuente instalada es ${psuForm.toUpperCase()}).`;
      }
    }
    if (installedGpu) {
      const gpuLength = parseFloat(getProductAttr(installedGpu, 'Largo GPU') || '0');
      const maxGpuLength = parseFloat(getProductAttr(prod, 'Largo Máximo GPU') || '0');
      if (gpuLength > 0 && maxGpuLength > 0 && gpuLength > maxGpuLength) {
        return `Gabinete incompatible: Espacio máximo para GPU es ${maxGpuLength}mm, pero la GPU instalada mide ${gpuLength}mm.`;
      }
    }
  }

  if (slotId === 'psu') {
    const psuWatts = parseInt(getProductAttr(prod, 'Potencia') || '0', 10);
    const cpuTdp = parseInt(getProductAttr(installedCpu, 'TDP') || '0', 10);
    const gpuTdp = parseInt(getProductAttr(installedGpu, 'TDP') || '0', 10);
    const requiredWatts = (cpuTdp + gpuTdp) > 0 ? (cpuTdp + gpuTdp + 80) : 0;
    if (psuWatts > 0 && requiredWatts > 0 && psuWatts < requiredWatts) {
      return `Potencia insuficiente: Fuente ofrece ${psuWatts}W, tu configuración requiere al menos ${requiredWatts}W.`;
    }
    if (installedCase) {
      const psuForm = getProductAttr(prod, 'Formato PSU');
      const casePsuForm = getProductAttr(installedCase, 'Formatos PSU Soportados');
      if (psuForm && casePsuForm && !isPsuFormFactorCompatible(psuForm, casePsuForm)) {
        return `Formato de fuente incompatible: Gabinete requiere ${casePsuForm.toUpperCase()}, fuente es ${psuForm.toUpperCase()}.`;
      }
    }
  }

  if (slotId === 'gpu') {
    if (installedPsu) {
      const psuWatts = parseInt(getProductAttr(installedPsu, 'Potencia') || '0', 10);
      const cpuTdp = parseInt(getProductAttr(installedCpu, 'TDP') || '0', 10);
      const gpuTdp = parseInt(getProductAttr(prod, 'TDP') || '0', 10);
      const requiredWatts = (cpuTdp + gpuTdp) > 0 ? (cpuTdp + gpuTdp + 80) : 0;
      if (psuWatts > 0 && requiredWatts > 0 && psuWatts < requiredWatts) {
        return `Potencia insuficiente: Fuente instalada es de ${psuWatts}W, tu configuración requiere al menos ${requiredWatts}W.`;
      }
    }
    if (installedCase) {
      const gpuLength = parseFloat(getProductAttr(prod, 'Largo GPU') || '0');
      const maxGpuLength = parseFloat(getProductAttr(installedCase, 'Largo Máximo GPU') || '0');
      if (gpuLength > 0 && maxGpuLength > 0 && gpuLength > maxGpuLength) {
        return `Tarjeta gráfica incompatible: Mide ${gpuLength}mm, pero el gabinete solo permite hasta ${maxGpuLength}mm.`;
      }
    }
  }

  return null;
};
