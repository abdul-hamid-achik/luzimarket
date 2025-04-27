// Paginas 
import Navbars from "import../";
import BodyLuzimarket from "import../";
import Footer from "import../";

// Bootstrap 
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.js';

// CSS
import "../css/General.css"
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