import React from "react";
import Usuario from "../../pagina_principal/src/images/logo_user_luzi_market.png";
import Logo from "../../images/luzimarket_logo_empleado.png";
import bandera from "../../images/bandera_mx.png";
import notificacion from "../../images/notificacion.png";

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg p-0  border-bottom border-black ">
      <div className="container-fluid">
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-3 mb-2 mt-2 ">
                <a
                  href="#"
                  className="d-block link-body-emphasis text-decoration-none ms-3"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <img
                    src={Usuario}
                    alt="mdo"
                    width="60"
                    height="55"
                    className="rounded-circle border border-2 p-1 me-3"
                  />

                  <span>Mariana García → Montacometa</span>
                </a>
              </div>
              <div className="col-md-6 text-center mb-2 mt-2 ">
                <img src={Logo} alt="" width="300" />
              </div>
              <div className="col-md-3 d-flex align-items-center justify-content-end">
                <a href="#" className="me-3 ">
                  <img src={bandera} alt="" width="20" />
                </a>
                <a href="#">
                  <img src={notificacion} alt="" width="25" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
