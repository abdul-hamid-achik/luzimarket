// Detailed admission petitions (affiliate requests) data
export interface AdmissionPetition {
  id: number;
  name: string;
  brand: string;
  createdAt: string;
}

export const AdmissionPetitions: AdmissionPetition[] = [
  { id: 1, name: "Juan Luis Guerra", brand: "Pastelería La Estrella", createdAt: "2023-03-16" },
  { id: 2, name: "Evelyn Rose", brand: "ROWSE", createdAt: "2022-12-01" },
  { id: 3, name: "Mariana García", brand: "Phamilia", createdAt: "2023-02-25" },
  { id: 4, name: "Alejandro Magno III", brand: "Lyto®", createdAt: "2022-12-12" },
];