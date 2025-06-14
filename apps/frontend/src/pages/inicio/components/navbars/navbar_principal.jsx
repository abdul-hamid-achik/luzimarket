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
import { useCartContext } from "@/context/cart_context";
import { useFavoritesContext } from "@/context/favorites_context";
import { Dropdown } from "react-bootstrap";
import NavDropdown from "react-bootstrap/NavDropdown";

const NavbarPrincipal = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCartContext();
  const { favoritesCount } = useFavoritesContext();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar navbar-expand-lg" id="NavbarPrincipal">
      <div className="container-fluid">
        {/* Mobile Logo */}
        <img
          src={LogoLetraLuzimarket}
          className="ImagenNavbarPrincipalMobile"
          alt="Logo Luzimarket"
        />

        {/* Navbar Toggler for Mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavPrincipal"
          aria-controls="navbarNavPrincipal"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNavPrincipal">
          {/* Left Section - Search Icons */}
          <div className="navbar-nav me-auto div1NavbarPrincipal">
            <img src={LogoluziImagen} className="ImagenNavbarLogo" alt="Logo" />
            <img src={SearchLogo} className="ImagenFormSearch" alt="Search" />
          </div>

          {/* Center Section - Main Logo */}
          <div className="navbar-nav mx-auto">
            <Link to="/" className="nav-link p-0">
              <img
                src={LogoLetraLuzimarket}
                className="ImagenNavbarPrincipal"
                alt="Logo Luzimarket"
              />
            </Link>
          </div>

          {/* Right Section - User Actions */}
          <div className="navbar-nav ms-auto">
            <div className="cajaLogosLuzi d-flex align-items-center">
              {/* User Section */}
              {isAuthenticated ? (
                <NavDropdown
                  title={
                    <span className="d-flex align-items-center">
                      <img src={LogoUserLuzi} className="LogoNavbarPrincipal me-2" alt="User" />
                      <span className="fw-bold text-truncate" style={{ maxWidth: '120px', fontSize: '0.85rem', color: '#222' }}>
                        {user?.email}
                      </span>
                    </span>
                  }
                  id="nav-dropdown-user"
                  align="end"
                  className="border-0 p-0"
                >
                  <NavDropdown.Item as={Link} to="/perfil">Mi Perfil</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/mis-pedidos">Mis Pedidos</NavDropdown.Item>
                  {(user?.role === 'employee' || user?.role === 'admin') && (
                    <>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/dashboard">📊 Dashboard</NavDropdown.Item>
                    </>
                  )}
                  {user?.role === 'admin' && (
                    <NavDropdown.Item as={Link} to="/admin/cms">⚙️ CMS Admin</NavDropdown.Item>
                  )}
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>Cerrar Sesión</NavDropdown.Item>
                </NavDropdown>
              ) : (
                <div className="d-flex align-items-center">
                  <strong className="me-2" style={{ fontSize: '0.85rem' }}>Invitado</strong>
                  <Link to="/login" className="nav-link" style={{ fontSize: '0.85rem' }}>Login</Link>
                  <Link to="/register" className="nav-link ms-2" style={{ fontSize: '0.85rem' }}>Register</Link>
                </div>
              )}

              {/* Favorites Link */}
              <Link to="/favoritos" className="nav-link position-relative ms-2">
                <img src={LogoLikeLuzi} className="LogoNavbarPrincipal" alt="Favorites" />
                {isAuthenticated && favoritesCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                    {favoritesCount}
                    <span className="visually-hidden">favoritos</span>
                  </span>
                )}
              </Link>

              {/* Cart Link */}
              <Link to="/carrito" className="nav-link position-relative ms-2">
                <img src={LogoCartLuzi} className="LogoNavbarPrincipal" alt="Cart" />
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary" style={{ fontSize: '0.6rem' }}>
                    {cartCount}
                    <span className="visually-hidden">productos en carrito</span>
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarPrincipal;
