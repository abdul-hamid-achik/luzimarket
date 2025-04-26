import Navbars from "../components/Navbars";
import Footer from "../components/Footer";
import FiltrosHandpicked from "../components/FiltrosHandpicked";
import ProductosHandpicked from "../components/ProductosHandpicked";
import ImagenMuestraProducto from "../images/ImagenMuestra1.jpg";
import "../css/Handpicked.css";
import "../css/General.css";
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
