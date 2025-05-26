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
   return (
      <div className="page-with-footer">
         {/* ===== Start Navbar ===== */}
         <div className="NavbarIndex">
            <Navbars />
         </div>

         {/* ===== End Navbar ===== */}

         {/* ===== Start Container ===== */}
         <main className="BodyIndex">
            <Outlet />
         </main>

         {/* ===== End Container ===== */}

         {/* ===== Start Footer ===== */}
         <Footer />
         {/* ===== End Footer ===== */}
      </div>
   )
};
export default Inicio;