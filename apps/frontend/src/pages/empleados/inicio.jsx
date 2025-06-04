import { Outlet } from "react-router-dom";
import NavBarInicio from "./components/navbar";
import SlideBar from "./components/slidebar";
import './inicio.css';

const Inicio = () => {
  return (
    <div className="employee-layout">
      {/* Navbar */}
      <NavBarInicio />

      {/* Main Layout */}
      <div className="employee-main">
        {/* Sidebar */}
        <div className="employee-sidebar">
          <SlideBar />
        </div>

        {/* Content */}
        <div className="employee-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Inicio;
