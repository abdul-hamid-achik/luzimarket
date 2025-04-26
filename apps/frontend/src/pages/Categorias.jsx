import React from "react";
import { GoArrowRight } from "react-icons/go";
import { Link } from "react-router-dom";
import Categories from "../components/Categorias/index";

function Categorias() {
  return (
    <div className="container mt-5 p-5 overflow-auto">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <h2>
              <i className="text-secondary fs-4 me-3 icon-link">
                <GoArrowRight />
              </i>
              <Link to="#" className="text-decoration-none text-dark">
                Categorias
              </Link>
            </h2>
          </li>
        </ol>
      </nav>

      <Categories />
    </div>
  );
}

export default Categorias;
