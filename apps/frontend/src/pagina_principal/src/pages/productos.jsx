import Navbars from "@/pagina_principal/src/components/navbars";
import Footer from "@/pagina_principal/src/components/footer";
import FiltrosHandpicked from "@/pagina_principal/src/components/filtros_handpicked";
import ProductosHandpicked from "@/pagina_principal/src/components/productos_handpicked";
import ImagenMuestraProducto from "@/pagina_principal/src/components/partes_body/banner_cards"; // replace with actual image if needed
import "@/pagina_principal/src/css/handpicked.css";
import "@/pagina_principal/src/css/general.css";
import { Card } from "react-bootstrap";

const HandpickedProductos = () => {
   return (
      <>
         <Navbars />
         <div className="containerHP">
            <div className="row">
               <div className="col" id="divfiltro"> {/*col-md-3*/}
                  <FiltrosHandpicked />
               </div>
               <div className="col" id="divproducto"> {/*col-md-9*/}
                  <ProductosHandpicked />
               </div>
            </div>
         </div>
         <Footer />
      </>
   );
}
export default HandpickedProductos;
