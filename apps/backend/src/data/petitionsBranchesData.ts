// Detailed branch petitions (new branch/store requests) data
export interface BranchPetition {
  id: number;
  name: string;
  address: string;
  createdAt: string;
}

export const BranchPetitions: BranchPetition[] = [
  { id: 1, name: 'Sucursal Centro', address: 'Av. Reforma 123, CDMX', createdAt: '2024-01-20' },
  { id: 2, name: 'Sucursal Norte', address: 'Blvd. Norte 456, Monterrey', createdAt: '2024-02-15' },
  { id: 3, name: 'Sucursal Sur', address: 'Calle Sur 789, Guadalajara', createdAt: '2024-03-18' },
];