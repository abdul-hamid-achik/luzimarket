/* CSS */
import "@/pages/pagina_principal/css/navbars.css";

/* Imagenes para el navbar */
import LogoLetraLuzimarket from "@/pages/pagina_principal/images/new_images_luzi/logo_luzi1.png";
import SearchLogo from "@/pages/pagina_principal/images/search_logo_luzimarket.png";
import LogoluziImagen from "@/pages/pagina_principal/images/logo_luzimarket.png";
import LogoLikeLuzi from "@/pages/pagina_principal/images/logo_like_luzimarket.png";
import LogoUserLuzi from "@/pages/pagina_principal/images/logo_user_luzi_market.png";
import LogoCartLuzi from "@/pages/pagina_principal/images/cart_luzimarket.png";

/* Librería */
import { Link } from "react-router-dom";

import { useContext } from "react";
import { AuthContext } from "@/context/auth_context";

const NavbarPrincipal = () => {
  const { user } = useContext(AuthContext);
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
            <div className="navbar-nav mx-5 align-items-center">
              <div className="cajaLogosLuzi d-flex align-items-center">
                <Link to="/perfil">
                  <img src={LogoUserLuzi} className="LogoNavbarPrincipal" />
                </Link>
                {/* Show user email or 'Invitado' */}
                <span className="ms-2 fw-bold" style={{ minWidth: 120 }}>
                  {user?.email ? user.email : 'Invitado'}
                </span>
                {/* Optionally, show login/register if not logged in */}
                {!user?.email && (
                  <span className="ms-3">
                    <Link to="/login">Login</Link> / <Link to="/register">Register</Link>
                  </span>
                )}
                <Link to="/favoritos">
                  <img src={LogoLikeLuzi} className="LogoNavbarPrincipal" />
                </Link>
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
