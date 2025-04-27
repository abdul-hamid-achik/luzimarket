// Sample petition cards for admin petitions page
export interface Petition {
  id: number;
  title: string;
  badgeCount?: number;
  description: string;
  link: string;
}

export const Petitions: Petition[] = [
  {
    id: 1,
    title: 'Afiliado',
    badgeCount: 7,
    description:
      'Donec ullamcorper nulla non metus auctor fringilla. Donec ullamcorper nulla non metus auctor fringilla euismod',
    link: '/inicio/peticiones/admisiones',
  },
  {
    id: 2,
    title: 'Productos',
    badgeCount: 103,
    description:
      'Donec ullamcorper nulla non metus auctor fringilla. Donec ullamcorper nulla non metus auctor fringilla euismod',
    link: '/inicio/peticiones/productos',
  },
  {
    id: 3,
    title: 'Sucursales',
    badgeCount: 0,
    description:
      'Donec ullamcorper nulla non metus auctor fringilla. Donec ullamcorper nulla non metus auctor fringilla euismod',
    link: '/inicio/peticiones/sucursales',
  },
];