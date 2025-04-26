/* CSS */
import "../../css/Navbars.css";

/* Imagenes para el navbar */
// import LogoLetraLuzimarket from  "../../images/LogoLetraLuzimarket.png";
import LogoLetraLuzimarket from "../../images/NewImagesLuzi/LogoLuzi1.png";
import SearchLogo from "../../images/SearchLogoLuzimarket.png";
import LogoluziImagen from "../../images/LogoLuzimarket.png";
import LogoLikeLuzi from "../../images/LogoLikeLuzimarket.png";
import LogoUserLuzi from "../../images/LogoUserLuziMarket.png";
import LogoCartLuzi from "../../images/CartLuzimarket.png";
import LogoFamilyLuzi from "../../images/LogoFamilyLuzimarket.png";

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
