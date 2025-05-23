import "@/css/fonts.css"
import "@/pages/inicio/css/filtros_handpicked.css"
import { useState } from "react"
import { useCategories } from "@/api/hooks"

const Filtros = ({ onApply, onClear }) => {
   const { data: categories = [], isLoading: catLoading } = useCategories()
   const [selectedCategories, setSelectedCategories] = useState([])
   const [priceRange, setPriceRange] = useState([0, 1000])
   const [selectedColors, setSelectedColors] = useState([])

   const handleCategoryChange = (e) => {
      const value = e.target.value
      if (e.target.checked) setSelectedCategories((prev) => [...prev, value])
      else setSelectedCategories((prev) => prev.filter((id) => id !== value))
   }

   const handlePriceChange = (e) => {
      const { id, value } = e.target
      const num = Number(value)
      setPriceRange((prev) =>
         id === "minPrice" ? [num, prev[1]] : [prev[0], num]
      )
   }

   const handleColorSelect = (color) => {
      setSelectedColors((prev) =>
         prev.includes(color)
            ? prev.filter((c) => c !== color)
            : [...prev, color]
      )
   }

   return (
      <div id="FHP" className="filters-sidebar">
         <h4 className="mb-4 filter-title">Filtros</h4>

         <div className="accordion" id="filterAccordion">
            {/* Categorías */}
            <div className="accordion-item border-0">
               <h2 className="accordion-header" id="headingCategories">
                  <button
                     className="accordion-button"
                     type="button"
                     data-bs-toggle="collapse"
                     data-bs-target="#collapseCategories"
                     aria-expanded="true"
                     aria-controls="collapseCategories"
                  >
                     Categorías
                  </button>
               </h2>
               <div
                  id="collapseCategories"
                  className="accordion-collapse collapse show"
                  aria-labelledby="headingCategories"
                  data-bs-parent="#filterAccordion"
               >
                  <div className="accordion-body">
                     {catLoading ? (
                        <p>Cargando categorías...</p>
                     ) : (
                        categories.map((cat) => (
                           <div className="form-check mb-2" key={cat.id}>
                              <input
                                 className="form-check-input"
                                 type="checkbox"
                                 value={cat.id}
                                 id={`cat${cat.id}`}
                                 onChange={handleCategoryChange}
                                 checked={selectedCategories.includes(cat.id)}
                              />
                              <label className="form-check-label" htmlFor={`cat${cat.id}`}>
                                 {cat.name}
                              </label>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>

            {/* Precio */}
            <div className="accordion-item border-0">
               <h2 className="accordion-header" id="headingPrice">
                  <button
                     className="accordion-button"
                     type="button"
                     data-bs-toggle="collapse"
                     data-bs-target="#collapsePrice"
                     aria-expanded="true"
                     aria-controls="collapsePrice"
                  >
                     Precio
                  </button>
               </h2>
               <div
                  id="collapsePrice"
                  className="accordion-collapse collapse show"
                  aria-labelledby="headingPrice"
                  data-bs-parent="#filterAccordion"
               >
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
                     </div>
                  </div>
               </div>
            </div>

            {/* Color */}
            <div className="accordion-item border-0">
               <h2 className="accordion-header" id="headingColor">
                  <button
                     className="accordion-button collapsed"
                     type="button"
                     data-bs-toggle="collapse"
                     data-bs-target="#collapseColor"
                     aria-expanded="false"
                     aria-controls="collapseColor"
                  >
                     Color
                  </button>
               </h2>
               <div
                  id="collapseColor"
                  className="accordion-collapse collapse"
                  aria-labelledby="headingColor"
                  data-bs-parent="#filterAccordion"
               >
                  <div className="accordion-body">
                     <div className="d-flex flex-wrap gap-2">
                        {['#000', '#fff', '#ff0000', '#0000ff', '#00ff00', '#ffff00'].map((color) => (
                           <div
                              key={color}
                              className={`color-option ${selectedColors.includes(color) ? 'selected' : ''}`}
                              style={{ backgroundColor: color, border: color === '#fff' ? '1px solid #ddd' : 'none' }}
                              title={color}
                              onClick={() => handleColorSelect(color)}
                           />
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="mt-4">
            <button
               className="btn btn-dark w-100"
               onClick={() =>
                  onApply({
                     categoryIds: selectedCategories,
                     minPrice: priceRange[0],
                     maxPrice: priceRange[1],
                     colors: selectedColors,
                  })
               }
            >
               Aplicar Filtros
            </button>
            <button
               className="btn btn-outline-secondary w-100 mt-2"
               onClick={() => {
                  setSelectedCategories([])
                  setPriceRange([0, 1000])
                  setSelectedColors([])
                  onClear()
               }}
            >
               Limpiar Filtros
            </button>
         </div>
      </div>
   )
}

export default Filtros;