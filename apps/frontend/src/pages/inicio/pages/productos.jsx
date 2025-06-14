import { useState } from 'react';
import FiltrosHandpicked from "@/pages/inicio/components/filtros_handpicked";
import ProductosHandpicked from "@/pages/inicio/components/productos_handpicked";
import "@/pages/inicio/css/handpicked.css";
import "@/pages/inicio/css/general.css";

const HandpickedProductos = () => {
   // Initialize filters state
   const [filters, setFilters] = useState({});
   const handleApplyFilters = (newFilters) => {
      // Only include filters that have values
      const activeFilters = {};
      if (newFilters.categoryId) activeFilters.categoryId = newFilters.categoryId;
      if (newFilters.minPrice !== undefined && newFilters.minPrice >= 0) activeFilters.minPrice = newFilters.minPrice;
      if (newFilters.maxPrice !== undefined && newFilters.maxPrice > 0) activeFilters.maxPrice = newFilters.maxPrice;
      setFilters(activeFilters);
   };
   const handleClearFilters = () => setFilters({});

   return (
      <div className="container-fluid py-4">
         <div className="row">
            <div className="col-lg-3 col-md-4 mb-4" id="divfiltro">
               <div className="filters-wrapper">
                  <FiltrosHandpicked onApply={handleApplyFilters} onClear={handleClearFilters} />
               </div>
            </div>
            <div className="col-lg-9 col-md-8 col-12" id="divproducto">
               <ProductosHandpicked filters={filters} />
            </div>
         </div>
      </div>
   );
}
export default HandpickedProductos;
