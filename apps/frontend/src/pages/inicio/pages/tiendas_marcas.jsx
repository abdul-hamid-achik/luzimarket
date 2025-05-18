import React from 'react';
import { useBrands } from "@/api/hooks";

// Demo brands data for fallback
const demoBrands = [
  { id: 1, logo: 'https://dummyimage.com/200x100/000/fff&text=Luzimarket', name: 'Luzimarket Originals', description: 'Our in-house brand for quality essentials.', website: 'https://luzimarket.com/originals' },
  { id: 2, logo: 'https://dummyimage.com/200x100/111/eee&text=ElectroMax', name: 'ElectroMax', description: 'Top electronics and gadgets.', website: 'https://electromax.com' },
  { id: 3, logo: 'https://dummyimage.com/200x100/222/fff&text=ModaPlus', name: 'ModaPlus', description: 'Trendy fashion for all ages.', website: 'https://modaplus.com' },
];

const TiendasMarcas = () => {
  const { data, error, isLoading } = useBrands();
  const brands = (data && data.length) ? data : demoBrands;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Tiendas + Marcas</h1>
      {isLoading && <p>Cargando marcas...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {brands.map(brand => (
          <div key={brand.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, width: 300 }}>
            {brand.logo && (
              <img
                src={brand.logo}
                alt={brand.name}
                style={{ width: '100%', height: 100, objectFit: 'contain', marginBottom: 8 }}
              />
            )}
            <h2 style={{ margin: '0 0 8px 0' }}>{brand.name}</h2>
            <p>{brand.description}</p>
            {brand.website && (
              <a href={brand.website} target="_blank" rel="noopener noreferrer">
                Visitar sitio web
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TiendasMarcas;
