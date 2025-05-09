import React from 'react';
import { GoArrowRight } from "react-icons/go";
import { Link } from "react-router-dom";
import { useCategories } from '@/api/hooks';
function Categorias() {
  const { data: categories = [], isLoading, error } = useCategories();
  return (
    <div className="container mt-5 p-5 overflow-auto">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <h2>
              <i className="text-secondary fs-4 me-3 icon-link">
                <GoArrowRight />
              </i>
              <Link to="/inicio/categorias" className="text-decoration-none text-dark">
                Categorias
              </Link>
            </h2>
          </li>
        </ol>
      </nav>

      {isLoading && <p>Loading categories...</p>}
      {error && <p className="text-danger">Error loading categories: {error.message}</p>}
      {!isLoading && !error && (
        <ul className="list-group">
          {categories.map(cat => (
            <li key={cat.id} className="list-group-item">
              {cat.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Categorias;
