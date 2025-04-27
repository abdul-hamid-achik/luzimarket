import React from "react";
import "../../css/navbars.css"

const NavbarOpciones = () => {
   return (
      <>
         <nav className="navbar navbar-expand-lg" id="NavbarOpciones">
            <div className="container-fluid">
               <div className="collapse navbar-collapse" id="navbarNav">
                  <ul className="navbar-nav mx-auto">
                     <li className="nav-item">
                        <a className="nav-link" href="#">Best Sellers</a>
                     </li>
                     <li className="nav-item">
                        <a className="nav-link" href="#">Handpicked</a>
                     </li>
                     <li className="nav-item">
                        <a className="nav-link" href="#">Tiendas + Marcas</a>
                     </li>
                     <li className="nav-item">
                        <a className="nav-link" href="#">Categorias</a>
                     </li>
                     <li className="nav-item">
                        <a className="nav-link" href="#">Ocasiones</a>
                     </li>
                     <li className="nav-item">
                        <a className="nav-link" href="#">Editorial</a>
                     </li>
                  </ul>
               </div>
            </div>
         </nav>
      </>
   );
};
export default NavbarOpciones;