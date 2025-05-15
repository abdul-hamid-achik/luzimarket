import React from 'react';
import { GoArrowRight } from "react-icons/go";
import { Link } from "react-router-dom";
import { useCategories } from '@/api/hooks';
import CatSlider from '@/components/categorias';

function Categorias() {
  const { data: categories = [], isLoading, error } = useCategories();

  return (
    <>
      <div className="container-fluid p-0">
        <div className="row">
          <div className="col-12">
            <div className="container mt-4 mb-3">
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
            </div>

            {/* Render categories section */}
            <CatSlider />

            {isLoading && (
              <div className="text-center my-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger m-5">
                Error al cargar las categorías. Por favor intente nuevamente.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Categorias;
