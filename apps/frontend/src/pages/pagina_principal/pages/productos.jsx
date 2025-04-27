import Navbars from "@/pages/pagina_principal/components/navbars";
import Footer from "@/pages/pagina_principal/components/footer";
import FiltrosHandpicked from "@/pages/pagina_principal/components/filtros_handpicked";
import ProductosHandpicked from "@/pages/pagina_principal/components/productos_handpicked";
import "@/pages/pagina_principal/css/handpicked.css";
import "@/pages/pagina_principal/css/general.css";

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
