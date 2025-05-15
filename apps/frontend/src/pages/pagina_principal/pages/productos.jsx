import FiltrosHandpicked from "@/pages/pagina_principal/components/filtros_handpicked";
import ProductosHandpicked from "@/pages/pagina_principal/components/productos_handpicked";
import "@/pages/pagina_principal/css/handpicked.css";
import "@/pages/pagina_principal/css/general.css";

const HandpickedProductos = () => {
   return (
      <div className="container-fluid py-4">
         <div className="row">
            <div className="col-lg-3 col-md-4" id="divfiltro">
               <FiltrosHandpicked />
            </div>
            <div className="col-lg-9 col-md-8 col-12" id="divproducto">
               <ProductosHandpicked />
            </div>
         </div>
      </div>
   );
}
export default HandpickedProductos;
