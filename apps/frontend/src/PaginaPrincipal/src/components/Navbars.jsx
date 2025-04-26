import NavbarPrincipal from "../components/Navbars/NavbarPrincipal";
import NavbarDireccion from "../components/Navbars/NavbarDireccion";
import NavbarOpciones from "../components/Navbars/NavbarOpciones";

const Navbars = () => {
   return(
      <>
         <div className="navbarFixed">
            <NavbarDireccion/>
            <NavbarPrincipal/>
            <NavbarOpciones/>
         </div>
      </>
   );
}

export default Navbars;