import React from 'react';
import { GoArrowRight } from "react-icons/go";
import { Link } from "react-router-dom";
import { useCategories } from '@/api/hooks';
import CatSlider from '@/components/categorias';

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

      {/* Always render the slider for categories */}
      <CatSlider />
    </div>
  );
}

export default Categorias;
