import React from 'react';
import { useBrands } from "@/api/hooks";

const TiendasMarcas = () => {
  const { data, error, isLoading } = useBrands();
  const brands = data?.data || [];

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Tiendas + Marcas</h1>
      {isLoading && <p>Cargando marcas...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {brands.map(brand => (
          <div key={brand.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, width: 300 }}>
            {brand.attributes.logo && (
              <img src={brand.attributes.logo} alt={brand.attributes.name} style={{ width: '100%', height: 100, objectFit: 'contain', marginBottom: 8 }} />
            )}
            <h2 style={{ margin: '0 0 8px 0' }}>{brand.attributes.name}</h2>
            <p>{brand.attributes.description}</p>
            {brand.attributes.website && (
              <a href={brand.attributes.website} target="_blank" rel="noopener noreferrer">Visitar sitio web</a>
            )}
          </div>
        ))}
      </div>
      {(!isLoading && brands.length === 0 && !error) && <p>No hay marcas disponibles.</p>}
    </div>
  );
};

export default TiendasMarcas;
