import "@/css/fonts.css"
import "@/pages/pagina_principal/css/filtros_handpicked.css"
import { useState } from "react";

const Filtros = () => {
   const [priceRange, setPriceRange] = useState([0, 1000]);

   const handlePriceChange = (e) => {
      setPriceRange([...priceRange]);
   };

   return (
      <div id='FHP' className="filters-sidebar">
         <h4 className="mb-4 filter-title">Filtros</h4>

         <div className="accordion" id="filterAccordion">
            {/* Categorías */}
            <div className="accordion-item border-0">
               <h2 className="accordion-header" id="headingCategories">
                  <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseCategories" aria-expanded="true" aria-controls="collapseCategories">
                     Categorías
                  </button>
               </h2>
               <div id="collapseCategories" className="accordion-collapse collapse show" aria-labelledby="headingCategories" data-bs-parent="#filterAccordion">
                  <div className="accordion-body">
                     <div className="form-check mb-2">
                        <input className="form-check-input" type="checkbox" value="" id="cat1" />
                        <label className="form-check-label" htmlFor="cat1">
                           Flowershop
                        </label>
                     </div>
                     <div className="form-check mb-2">
                        <input className="form-check-input" type="checkbox" value="" id="cat2" />
                        <label className="form-check-label" htmlFor="cat2">
                           Sweet
                        </label>
                     </div>
                     <div className="form-check mb-2">
                        <input className="form-check-input" type="checkbox" value="" id="cat3" />
                        <label className="form-check-label" htmlFor="cat3">
                           Events + Dinners
                        </label>
                     </div>
                     <div className="form-check mb-2">
                        <input className="form-check-input" type="checkbox" value="" id="cat4" />
                        <label className="form-check-label" htmlFor="cat4">
                           Giftshop
                        </label>
                     </div>
                  </div>
               </div>
            </div>

            {/* Precio */}
            <div className="accordion-item border-0">
               <h2 className="accordion-header" id="headingPrice">
                  <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapsePrice" aria-expanded="true" aria-controls="collapsePrice">
                     Precio
                  </button>
               </h2>
               <div id="collapsePrice" className="accordion-collapse collapse show" aria-labelledby="headingPrice" data-bs-parent="#filterAccordion">
                  <div className="accordion-body">
                     <div className="price-range-container">
                        <div className="price-inputs d-flex justify-content-between mb-3">
                           <div>
                              <label htmlFor="minPrice">Min</label>
                              <input
                                 type="number"
                                 id="minPrice"
                                 className="form-control"
                                 value={priceRange[0]}
                                 onChange={handlePriceChange}
                              />
                           </div>
                           <div>
                              <label htmlFor="maxPrice">Max</label>
                              <input
                                 type="number"
                                 id="maxPrice"
                                 className="form-control"
                                 value={priceRange[1]}
                                 onChange={handlePriceChange}
                              />
                           </div>
                        </div>
                        <button className="btn btn-outline-dark w-100">Aplicar</button>
                     </div>
                  </div>
               </div>
            </div>

            {/* Color */}
            <div className="accordion-item border-0">
               <h2 className="accordion-header" id="headingColor">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseColor" aria-expanded="false" aria-controls="collapseColor">
                     Color
                  </button>
               </h2>
               <div id="collapseColor" className="accordion-collapse collapse" aria-labelledby="headingColor" data-bs-parent="#filterAccordion">
                  <div className="accordion-body">
                     <div className="d-flex flex-wrap gap-2">
                        <div className="color-option" style={{ backgroundColor: '#000' }} title="Negro"></div>
                        <div className="color-option" style={{ backgroundColor: '#fff', border: '1px solid #ddd' }} title="Blanco"></div>
                        <div className="color-option" style={{ backgroundColor: '#ff0000' }} title="Rojo"></div>
                        <div className="color-option" style={{ backgroundColor: '#0000ff' }} title="Azul"></div>
                        <div className="color-option" style={{ backgroundColor: '#00ff00' }} title="Verde"></div>
                        <div className="color-option" style={{ backgroundColor: '#ffff00' }} title="Amarillo"></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="mt-4">
            <button className="btn btn-dark w-100">Aplicar Filtros</button>
            <button className="btn btn-outline-secondary w-100 mt-2">Limpiar Filtros</button>
         </div>
      </div>
   );
}

export default Filtros;