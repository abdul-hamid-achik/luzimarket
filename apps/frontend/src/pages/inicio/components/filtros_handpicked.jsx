import "@/css/fonts.css"
import "@/pages/inicio/css/productos_listing.css"
import { useState } from "react"
import { useCategories } from "@/api/hooks"

const Filtros = ({ onApply, onClear }) => {
   const { data: categories = [], isLoading: catLoading } = useCategories()
   const [selectedCategories, setSelectedCategories] = useState([])
   const [priceRange, setPriceRange] = useState([0, 1000])
   const [selectedColors, setSelectedColors] = useState([])
   const [openSections, setOpenSections] = useState({
      categories: true,
      price: true,
      color: false
   })

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
      <div className="filters-sidebar">
         <h4 className="filter-title">Filtros</h4>

         <div className="filter-sections">
            {/* Categorías */}
            <div className="accordion-item">
               <button
                  className="accordion-button"
                  type="button"
                  onClick={() => setOpenSections(prev => ({ ...prev, categories: !prev.categories }))}
                  aria-expanded={openSections.categories}
               >
                  Categorías
               </button>
               {openSections.categories && (
                  <div className="accordion-body">
                     {catLoading ? (
                        <p>Cargando categorías...</p>
                     ) : (
                        categories.map((cat) => (
                           <div className="form-check" key={cat.id}>
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
               )}
            </div>

            {/* Precio */}
            <div className="accordion-item">
               <button
                  className="accordion-button"
                  type="button"
                  onClick={() => setOpenSections(prev => ({ ...prev, price: !prev.price }))}
                  aria-expanded={openSections.price}
               >
                  Precio
               </button>
               {openSections.price && (
                  <div className="accordion-body">
                     <div className="price-inputs">
                        <div>
                           <label htmlFor="minPrice">Min ($)</label>
                           <input
                              type="number"
                              id="minPrice"
                              value={priceRange[0]}
                              onChange={handlePriceChange}
                           />
                        </div>
                        <div>
                           <label htmlFor="maxPrice">Max ($)</label>
                           <input
                              type="number"
                              id="maxPrice"
                              value={priceRange[1]}
                              onChange={handlePriceChange}
                           />
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* Color */}
            <div className="accordion-item">
               <button
                  className="accordion-button"
                  type="button"
                  onClick={() => setOpenSections(prev => ({ ...prev, color: !prev.color }))}
                  aria-expanded={openSections.color}
               >
                  Color
               </button>
               {openSections.color && (
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
               )}
            </div>
         </div>

         <div className="filter-buttons">
            <button
               className="btn-apply-filters"
               onClick={() =>
                  onApply({
                     categoryId: selectedCategories.length > 0 ? selectedCategories[0] : null,
                     minPrice: priceRange[0] * 100, // Convert to cents
                     maxPrice: priceRange[1] * 100, // Convert to cents
                     colors: selectedColors,
                  })
               }
            >
               Aplicar Filtros
            </button>
            <button
               className="btn-clear-filters"
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