import Navbars from "../components/navbars";
import Footer from "../components/footer";
import FiltrosHandpicked from "../components/filtros_handpicked";
import ProductosHandpicked from "../components/productos_handpicked";
import ImagenMuestraProducto from "../components/partes_body/banner_cards"; // replace with actual image if needed
import "../css/handpicked.css";
import "../css/general.css";
import { Card } from "react-bootstrap";

const HandpickedProductos = () => {
   return (
      <>
         <Navbars/>
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
