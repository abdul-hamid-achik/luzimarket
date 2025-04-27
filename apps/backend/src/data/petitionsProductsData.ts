// Detailed product petitions (product addition requests) data
export interface ProductPetition {
  id: number;
  name: string;
  brand: string;
  createdAt: string;
}

export const ProductPetitions: ProductPetition[] = [
  { id: 1, name: "Tetera Sowden", brand: "LuziMarket", createdAt: "2024-01-10" },
  { id: 2, name: "Tetera Sowden Classic", brand: "LuziMarket", createdAt: "2024-02-05" },
  { id: 3, name: "Tetera Designer", brand: "Hay Design", createdAt: "2024-03-12" },
];