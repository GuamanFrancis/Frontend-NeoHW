import type { CatalogComponent } from '../../types/catalog';

export type ComponentState = 'locked' | 'available' | 'installing' | 'installed' | 'incompatible';

export interface PCComponent {
  id: string;
  label: string;
  selectedName: string;
  file: string;
  requiredAfter: string | null;
  installOrder: number;
  startOffset: [number, number, number];
  interaction?: 'fade-in';
  icon: string;
  categorySlug: string;
  dbProduct?: CatalogComponent | null;
  hasModel?: boolean;
  hidden?: boolean;
}

export type CameraAction = {
  type: 'zoom-in' | 'zoom-out' | 'reset' | 'center' | 'toggle-rotate';
  ts: number;
};
