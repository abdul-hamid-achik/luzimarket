import { Outlet } from "react-router-dom";
import NavBarInicio from "./components/navbar";
import SlideBar from "./components/slidebar";

const Inicio = () => {
  return (
    <>
      <div>
        <NavBarInicio />
      </div>
      <div className="container-fluid">
        <div className="row">
          <div className="sidebar border border-right col-md-3 col-lg-2 p-0 bg-body-tertiary d-none d-md-block">
            <SlideBar />
          </div>
          <main className="outlet d-flex col-md-9 col-lg-10">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default Inicio;
