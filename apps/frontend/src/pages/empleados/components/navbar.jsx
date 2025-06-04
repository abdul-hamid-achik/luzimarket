import Usuario from "@/pages/inicio/images/logo_user_luzi_market.png";
import Logo from "@/assets/images/luzimarket_logo_empleado.png";
import bandera from "@/assets/images/bandera_mx.png";
import notificacion from "@/assets/images/notificacion.png";

const Navbar = () => {
  return (
    <nav
      className="navbar navbar-expand-lg border-bottom border-black"
      style={{
        zIndex: 1050,
        position: 'relative',
        backgroundColor: '#fff',
        minHeight: '70px',
        padding: '0.75rem 0'
      }}
    >
      <div className="container-fluid px-4">
        <div className="d-flex w-100 align-items-center justify-content-between">
          {/* User Section - Left */}
          <div className="d-flex align-items-center" style={{ minWidth: '250px' }}>
            <div className="d-flex align-items-center text-decoration-none">
              <img
                src={Usuario}
                alt="User"
                width="50"
                height="50"
                className="rounded-circle border border-2 p-1 me-3"
                style={{ flexShrink: 0 }}
              />
              <span
                style={{
                  color: '#222',
                  fontWeight: '500',
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                Mariana García → Montacometa
              </span>
            </div>
          </div>

          {/* Logo Section - Center */}
          <div className="d-flex justify-content-center flex-grow-1">
            <img
              src={Logo}
              alt="Luzimarket Logo"
              style={{
                height: '40px',
                width: 'auto',
                maxWidth: '280px'
              }}
            />
          </div>

          {/* Actions Section - Right */}
          <div className="d-flex align-items-center gap-3" style={{ minWidth: '100px', justifyContent: 'flex-end' }}>
            <a href="#" className="d-flex align-items-center text-decoration-none">
              <img src={bandera} alt="Mexico Flag" width="24" height="auto" />
            </a>
            <a href="#" className="d-flex align-items-center text-decoration-none">
              <img src={notificacion} alt="Notifications" width="24" height="auto" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
