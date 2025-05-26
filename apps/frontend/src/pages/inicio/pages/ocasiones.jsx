import React from 'react';
import { useCategories } from "@/api/hooks";

// Demo categories data for fallback
const demoCategories = [
  { id: 1, image: 'https://dummyimage.com/300x120/ffb347/fff&text=Cumplea%C3%B1os', name: 'Cumpleaños', description: 'Celebra cumpleaños con regalos y productos especiales.' },
  { id: 2, image: 'https://dummyimage.com/300x120/77dd77/fff&text=Aniversario', name: 'Aniversario', description: 'Sorprende en aniversarios con detalles inolvidables.' },
  { id: 3, image: 'https://dummyimage.com/300x120/779ecb/fff&text=Graduaci%C3%B3n', name: 'Graduación', description: 'Regalos para celebrar logros académicos.' },
  { id: 4, image: 'https://dummyimage.com/300x120/ff6961/fff&text=Navidad', name: 'Navidad', description: 'Todo para una Navidad mágica y especial.' },
];

const Ocasiones = () => {
  const { data, error, isLoading } = useCategories();
  const categories = (data && data.length) ? data : demoCategories;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Ocasiones</h1>
      {isLoading && <p>Cargando ocasiones...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, width: 300 }}>
            {cat.image && (
              <img src={cat.image} alt={cat.name} style={{ width: '100%', height: 100, objectFit: 'contain', marginBottom: 8 }} />
            )}
            <h2 style={{ margin: '0 0 8px 0' }}>{cat.name}</h2>
            <p>{cat.description}</p>
          </div>
        ))}
      </div>
      {(!isLoading && categories.length === 0 && !error) && <p>No hay ocasiones disponibles.</p>}
    </div>
  );
};

export default Ocasiones;
