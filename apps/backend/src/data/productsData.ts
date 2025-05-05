// Sample products to seed into the database
export interface ProductSeed {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

export const Products: ProductSeed[] = [
  {
    name: 'Bouquet de Rosas',
    description: 'Hermoso ramo de rosas frescas para momentos especiales.',
    price: 650,
    category: 'Flowershop',
    imageUrl: 'https://images.unsplash.com/photo-1525948454345-c39df3b1e70?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Caja de Donas',
    description: 'Selección de donas artesanales (6 piezas).',
    price: 150,
    category: 'Sweet',
    imageUrl: 'https://images.unsplash.com/photo-1589987603893-8674b8bb8a8a?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Experiencia Cena',
    description: 'Cena para dos con decoración especial y menú de 3 tiempos.',
    price: 2500,
    category: 'Events + Dinners',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Juego de Tazas',
    description: 'Set de 4 tazas cerámicas coloridas.',
    price: 350,
    category: 'Giftshop',
    imageUrl: 'https://images.unsplash.com/photo-1553524789-29085d31b7c?auto=format&fit=crop&w=300&q=80',
  },
];