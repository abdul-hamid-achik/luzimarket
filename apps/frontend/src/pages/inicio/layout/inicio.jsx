// Paginas 
import { Outlet } from "react-router-dom";
import Navbars from "@/pages/inicio/components/navbars";
import Footer from "@/pages/inicio/components/footer";

// Bootstrap 
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.js';

// CSS
import "@/pages/inicio/css/general.css"

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
            <Outlet />
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