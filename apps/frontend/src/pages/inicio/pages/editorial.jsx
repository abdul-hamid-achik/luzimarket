import React from 'react';
import { useArticles } from "@/api/hooks";

// Demo articles data for fallback
const demoArticles = [
  { id: 1, title: 'Tendencias de regalos 2025', summary: 'Descubre las tendencias más populares en regalos para este año.', content: 'Este año, los regalos personalizados y las experiencias únicas están en auge. Desde gadgets tecnológicos hasta kits de bienestar, descubre cómo sorprender a tus seres queridos...' },
  { id: 2, title: 'Cómo elegir el regalo perfecto', summary: 'Consejos prácticos para acertar siempre con tu regalo.', content: 'Elegir el regalo perfecto depende de conocer los gustos y necesidades de la persona. Considera experiencias, productos útiles y detalles personalizados para marcar la diferencia...' },
  { id: 3, title: 'Ideas para celebraciones inolvidables', summary: 'Inspírate con estas ideas para organizar eventos memorables.', content: 'Desde decoraciones temáticas hasta actividades interactivas, aquí tienes ideas para que tu próxima celebración sea inolvidable...' },
];

const Editorial = () => {
  const { data, error, isLoading } = useArticles();
  const articles = (data && data.length) ? data : demoArticles;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Editorial</h1>
      {isLoading && <p>Cargando artículos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {articles.map(article => (
          <div key={article.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, width: 350 }}>
            <h2 style={{ margin: '0 0 8px 0' }}>{article.title}</h2>
            {article.summary && <p>{article.summary}</p>}
            {article.content && <p style={{ fontSize: '0.95em', color: '#555' }}>{article.content.slice(0, 120)}...</p>}
            <a href={'/editorial/' + article.id} style={{ color: '#0070f3' }}>Leer más</a>
          </div>
        ))}
      </div>
      {(!isLoading && articles.length === 0 && !error) && <p>No hay artículos disponibles.</p>}
    </div>
  );
};

export default Editorial;
