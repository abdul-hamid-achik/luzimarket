import NavbarPrincipal from "import../";
import NavbarDireccion from "import../";
import NavbarOpciones from "import../";

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