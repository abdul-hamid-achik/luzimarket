import NavbarPrincipal from "../components/navbars/navbar_principal";
import NavbarDireccion from "../components/navbars/navbar_direccion";
import NavbarOpciones from "../components/navbars/navbar_opciones";

const Navbars = () => {
   return (
      <>
         <div className="navbarFixed">
            <NavbarDireccion />
            <NavbarPrincipal />
            <NavbarOpciones />
         </div>
      </>
   );
}

export default Navbars;