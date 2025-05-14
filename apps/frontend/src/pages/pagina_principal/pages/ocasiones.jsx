import React from 'react';
import { useCategories } from "@/api/hooks";

const Ocasiones = () => {
  const { data, error, isLoading } = useCategories();
  const categories = data?.data || [];

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Ocasiones</h1>
      {isLoading && <p>Cargando ocasiones...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, width: 300 }}>
            {cat.attributes.image && (
              <img src={cat.attributes.image} alt={cat.attributes.name} style={{ width: '100%', height: 100, objectFit: 'contain', marginBottom: 8 }} />
            )}
            <h2 style={{ margin: '0 0 8px 0' }}>{cat.attributes.name}</h2>
            <p>{cat.attributes.description}</p>
          </div>
        ))}
      </div>
      {(!isLoading && categories.length === 0 && !error) && <p>No hay ocasiones disponibles.</p>}
    </div>
  );
};

export default Ocasiones;
