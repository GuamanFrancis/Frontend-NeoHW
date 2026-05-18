export type SellerOrderStatus = 'Pendiente' | 'En proceso' | 'Enviado' | 'Entregado' | 'Cancelado';

export type SellerOrder = {
  id: string;
  itemsCount: number;
  clientName: string;
  clientEmail: string;
  createdAt: string;
  total: number;
  status: SellerOrderStatus;
};

const now = new Date();

export const sellerOrdersData: SellerOrder[] = [
  {
    id: '#NHW-000123',
    itemsCount: 3,
    clientName: 'Juan Perez',
    clientEmail: 'juan.perez@gmail.com',
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    total: 1249.99,
    status: 'Pendiente',
  },
  {
    id: '#NHW-000122',
    itemsCount: 5,
    clientName: 'Maria Garcia',
    clientEmail: 'maria.garcia@gmail.com',
    createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    total: 2799,
    status: 'En proceso',
  },
  {
    id: '#NHW-000121',
    itemsCount: 2,
    clientName: 'Carlos Lopez',
    clientEmail: 'carlos.lopez@gmail.com',
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    total: 349.99,
    status: 'Enviado',
  },
  {
    id: '#NHW-000120',
    itemsCount: 4,
    clientName: 'Ana Martinez',
    clientEmail: 'ana.martinez@gmail.com',
    createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    total: 1899.5,
    status: 'Entregado',
  },
  {
    id: '#NHW-000119',
    itemsCount: 1,
    clientName: 'Luis Ramirez',
    clientEmail: 'luis.ramirez@gmail.com',
    createdAt: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    total: 159.99,
    status: 'Cancelado',
  },
  {
    id: '#NHW-000118',
    itemsCount: 6,
    clientName: 'Sofia Villacis',
    clientEmail: 'sofia.villacis@gmail.com',
    createdAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    total: 3099.99,
    status: 'En proceso',
  },
];
