/* CSS */
import "@/pages/inicio/css/navbars.css";

/* Imagenes para el navbar */
import LogoLetraLuzimarket from "@/pages/inicio/images/new_images_luzi/logo_luzi1.png";
import SearchLogo from "@/pages/inicio/images/search_logo_luzimarket.png";
import LogoluziImagen from "@/pages/inicio/images/logo_luzimarket.png";
import LogoLikeLuzi from "@/pages/inicio/images/logo_like_luzimarket.png";
import LogoUserLuzi from "@/pages/inicio/images/logo_user_luzi_market.png";
import LogoCartLuzi from "@/pages/inicio/images/cart_luzimarket.png";

/* Librería */
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth_context";
import { Dropdown } from "react-bootstrap";

const NavbarPrincipal = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    // No need to redirect - the auth context will update state
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg" id="NavbarPrincipal">
        <div className="container-fluid">
          <img
            src={LogoLetraLuzimarket}
            className="ImagenNavbarPrincipalMobile"
            alt="Logo Luzimarket"
          />
          <div className="collapse navbar-collapse">
            <div className="navbar-nav mx-5 div1NavbarPrincipal">
              <img src={LogoluziImagen} className="ImagenNavbarLogo" alt="Logo" />
              <img src={SearchLogo} className="ImagenFormSearch" alt="Search" />
            </div>
            <div className="navbar-nav mx-auto">
              <Link to="/">
                <img
                  src={LogoLetraLuzimarket}
                  className="ImagenNavbarPrincipal"
                  style={{ cursor: "pointer" }}
                  alt="Logo Luzimarket"
                />
              </Link>
            </div>
            <div className="navbar-nav mx-5 align-items-center">
              <div className="cajaLogosLuzi d-flex align-items-center">
                {isAuthenticated ? (
                  <Dropdown>
                    <Dropdown.Toggle variant="link" id="dropdown-user" className="p-0 text-decoration-none">
                      <img src={LogoUserLuzi} className="LogoNavbarPrincipal" alt="User" />
                      <span className="ms-2 fw-bold" style={{ minWidth: 120, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.email}
                      </span>
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      <Dropdown.Item as={Link} to="/perfil">Mi Perfil</Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={handleLogout}>Cerrar Sesión</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                ) : (
                  <div className="d-flex align-items-center">
                    <strong className="me-2">Invitado</strong>
                    <Link to="/login" className="nav-link">Login</Link>
                    <Link to="/register" className="nav-link ms-2">Register</Link>
                  </div>
                )}

                <Link to="/favoritos" className="ms-3">
                  <img src={LogoLikeLuzi} className="LogoNavbarPrincipal" alt="Favorites" />
                </Link>
                <Link to="/carrito" className="ms-3">
                  <img src={LogoCartLuzi} className="LogoNavbarPrincipal" alt="Cart" />
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
