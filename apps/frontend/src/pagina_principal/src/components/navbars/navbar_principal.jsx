/* CSS */
import "../../css/Navbars.css";

/* Imagenes para el navbar */
// import LogoLetraLuzimarket from  "import../";
import LogoLetraLuzimarket from "import../";
import SearchLogo from "import../";
import LogoluziImagen from "import../";
import LogoLikeLuzi from "import../";
import LogoUserLuzi from "import../";
import LogoCartLuzi from "import../";
import LogoFamilyLuzi from "import../";

/* Librería */
import { Input } from "@nextui-org/react";
import { Link } from "react-router-dom";

const NavbarPrincipal = () => {
  return (
    <>
      <nav className="navbar navbar-expand-lg" id="NavbarPrincipal">
        <div className="container-fluid">
          <img
            src={LogoLetraLuzimarket}
            className="ImagenNavbarPrincipalMobile"
          />
          <div className="collapse navbar-collapse">
            <div className="navbar-nav mx-5 div1NavbarPrincipal">
              <img src={LogoluziImagen} className="ImagenNavbarLogo" />
              <img src={SearchLogo} className="ImagenFormSearch" />
            </div>
            <div className="navbar-nav mx-auto">
              <Link to="/">
                <img
                  src={LogoLetraLuzimarket}
                  className="ImagenNavbarPrincipal"
                  style={{ cursor: "pointer" }}
                />
              </Link>
            </div>
            <div className="navbar-nav mx-5">
              <div className="cajaLogosLuzi">
                <img src={LogoUserLuzi} className="LogoNavbarPrincipal" />
                <img src={LogoLikeLuzi} className="LogoNavbarPrincipal" />
                <Link to="/carrito">
                  <img src={LogoCartLuzi} className="LogoNavbarPrincipal" />
                </Link>
              </div>
            </div>
          </div>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>
      </nav>
    </>
  );
};
export default NavbarPrincipal;
