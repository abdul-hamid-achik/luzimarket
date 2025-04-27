import Navbars from "import../";
import Footer from "import../";
import FiltrosHandpicked from "import../";
import ProductosHandpicked from "import../";
import ImagenMuestraProducto from "import../";
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
