import Admision from "../components/peticiones/Admision";
import Productos from "../components/peticiones/Productos";
import Sucursales from "../components/peticiones/Sucursales";
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import BreadCrumb from "../components/Breadcrumb";

const Peticiones = () => {
  const items = [{ name: "Peticiones", link: "/inicio/peticiones" }];

  return (
    <div className="mt-5 ms-5 w-100 p-5">
      <BreadCrumb items={items} activeItem={"Peticiones"} />
      <div className="container p-5 ">
        <div className="d-flex align-items-center mt-5 ">
          <div className="row">
            <div className="col-md-4">
              <Admision />
            </div>
            <div className="col-md-4">
              <Productos />
            </div>
            <div className="col-md-4">
              <Sucursales />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Peticiones;
