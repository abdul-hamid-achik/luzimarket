import React from 'react';
// Removed dynamic favorites fetching; using static demo data for favorites

// Demo favorites data
const demoFavorites = [
  { id: 1, attributes: { name: 'Camisa Luzimarket', image: '' } },
  { id: 2, attributes: { name: 'Audífonos ElectroMax', image: '' } },
  { id: 3, attributes: { name: 'Reloj ModaPlus', image: '' } },
];

const Favoritos = () => {
  const favorites = demoFavorites;
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Favoritos</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {favorites.map(product => (
          <div key={product.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, width: 220 }}>
            <h2 style={{ fontSize: '1.1em', margin: '0 0 8px 0' }}>{product.attributes.name}</h2>
            <button style={{ background: '#ff6961', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }} disabled>Quitar</button>
          </div>
        ))}
      </div>
      {/* No fallback needed for static demo favorites */}
    </div>
  );
};

export default Favoritos;
