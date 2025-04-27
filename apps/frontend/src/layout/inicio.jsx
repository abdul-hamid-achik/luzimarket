import { Outlet } from "react-router-dom";
import NavBarInicio from "import../";
import SlideBar from "import../";

const Inicio = () => {
  return (
    <>
      <header>
        <NavBarInicio />
      </header>
      <div className="container-fluid">
        <div className="row">
          <div className="sidebar border border-right col-md-3 col-lg-2 p-0 bg-body-tertiary d-none d-lg-block">
            <SlideBar />
          </div>
          <main className="d-flex col-md-9 col-lg-10 px-md-4t">
            {/* Aplica la clase "outlet" al main para el Outlet */}
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default Inicio;
