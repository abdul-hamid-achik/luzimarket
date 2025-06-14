import "@/pages/inicio/css/navbars.css"
import { Link } from "react-router-dom";

const NavbarOpciones = () => {
   return (
      <>
         <nav className="navbar navbar-expand-lg" id="NavbarOpciones">
            <div className="container-fluid">
               <div className="collapse navbar-collapse" id="navbarNav">
                  <ul className="navbar-nav mx-auto">
                     <li className="nav-item">
                        <Link className="nav-link" to="/best-sellers">Más Vendidos</Link>
                     </li>
                     <li className="nav-item">
                        <Link className="nav-link" to="/handpicked/productos">Handpicked</Link>
                     </li>
                     <li className="nav-item">
                        <Link className="nav-link" to="/tiendas-marcas">Tiendas + Marcas</Link>
                     </li>
                     <li className="nav-item">
                        <Link className="nav-link" to="/categorias">Categorias</Link>
                     </li>
                     <li className="nav-item">
                        <Link className="nav-link" to="/ocasiones">Ocasiones</Link>
                     </li>
                     <li className="nav-item">
                        <Link className="nav-link" to="/editorial">Editorial</Link>
                     </li>
                  </ul>
               </div>
            </div>
         </nav>
      </>
   );
};

export default NavbarOpciones;