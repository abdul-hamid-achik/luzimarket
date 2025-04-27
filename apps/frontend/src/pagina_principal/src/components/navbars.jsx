import NavbarPrincipal from "@/pagina_principal/src/components/navbars/navbar_principal";
import NavbarDireccion from "@/pagina_principal/src/components/navbars/navbar_direccion";
import NavbarOpciones from "@/pagina_principal/src/components/navbars/navbar_opciones";

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