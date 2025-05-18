import { useState } from 'react';
import FiltrosHandpicked from "@/pages/inicio/components/filtros_handpicked";
import ProductosHandpicked from "@/pages/inicio/components/productos_handpicked";
import "@/pages/inicio/css/handpicked.css";
import "@/pages/inicio/css/general.css";

const HandpickedProductos = () => {
   // Initialize filters state
   const [filters, setFilters] = useState({ categoryIds: [], minPrice: 0, maxPrice: 1000, colors: [] });
   const handleApplyFilters = (newFilters) => setFilters(newFilters);
   const handleClearFilters = () => setFilters({ categoryIds: [], minPrice: 0, maxPrice: 1000, colors: [] });

   return (
      <div className="container-fluid py-4">
         <div className="row">
            <div className="col-lg-3 col-md-4" id="divfiltro">
               <FiltrosHandpicked onApply={handleApplyFilters} onClear={handleClearFilters} />
            </div>
            <div className="col-lg-9 col-md-8 col-12" id="divproducto">
               <ProductosHandpicked filters={filters} />
            </div>
         </div>
      </div>
   );
}
export default HandpickedProductos;
