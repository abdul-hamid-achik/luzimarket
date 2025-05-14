import React from 'react';
import { useFavorites } from "@/api/hooks";

const Favoritos = () => {
  const { data, error, isLoading } = useFavorites();
  const favorites = data?.data || [];
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Favoritos</h1>
      {isLoading && <p>Cargando favoritos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {favorites.map(product => (
          <div key={product.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, width: 220 }}>
            <img src={product.attributes.image} alt={product.attributes.name} style={{ width: '100%', height: 120, objectFit: 'contain', marginBottom: 8 }} />
            <h2 style={{ fontSize: '1.1em', margin: '0 0 8px 0' }}>{product.attributes.name}</h2>
            <button style={{ background: '#ff6961', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }} disabled>Quitar</button>
          </div>
        ))}
      </div>
      {(!isLoading && favorites.length === 0 && !error) && <p>No hay favoritos disponibles.</p>}
    </div>
  );
};

export default Favoritos;
