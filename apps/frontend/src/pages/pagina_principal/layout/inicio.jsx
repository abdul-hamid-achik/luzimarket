// Paginas 
import Navbars from "@/pages/pagina_principal/components/navbars/navbar_principal";
import BodyLuzimarket from "@/pages/pagina_principal/components/partes_body/banner_principal";
import Footer from "@/pages/pagina_principal/components/footer";

// Bootstrap 
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.js';

// CSS
import "@/pages/pagina_principal/css/general.css"

const Inicio = () => {
   console.log('Inicio component is rendering...');
   return (
      <>
         {/* ===== Start Navbar ===== */}
         <div className="NavbarIndex">
            <Navbars />
         </div>

         {/* ===== End Navbar ===== */}


         {/* ===== Start Container ===== */}
         <div className="BodyIndex">
            <BodyLuzimarket />
         </div>

         {/* ===== End Container ===== */}


         {/* ===== Start Footer ===== */}
         <div className="FooterIndex">
            <Footer />
         </div>
         {/* ===== End Footer ===== */}
      </>
   )
};
export default Inicio;