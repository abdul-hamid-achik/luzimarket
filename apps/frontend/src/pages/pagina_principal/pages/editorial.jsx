import React from 'react';
import { useArticles } from "@/api/hooks";

const Editorial = () => {
  const { data, error, isLoading } = useArticles();
  const articles = data?.data || [];

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Editorial</h1>
      {isLoading && <p>Cargando artículos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {articles.map(article => (
          <div key={article.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, width: 350 }}>
            <h2 style={{ margin: '0 0 8px 0' }}>{article.attributes.title}</h2>
            {article.attributes.summary && <p>{article.attributes.summary}</p>}
            {article.attributes.content && <p style={{ fontSize: '0.95em', color: '#555' }}>{article.attributes.content.slice(0, 120)}...</p>}
            <a href={"/editorial/" + article.id} style={{ color: '#0070f3' }}>Leer más</a>
          </div>
        ))}
      </div>
      {(!isLoading && articles.length === 0 && !error) && <p>No hay artículos disponibles.</p>}
    </div>
  );
};

export default Editorial;
