import React from "react";
import BreadCrumb from "../../Breadcrumb";
//import TablaAdmision from "../Admisiones/TablaAdmision";

const tablaSucursales = () => {
  const items = [
    { name: "Peticiones", link: "/inicio/peticiones" },
    { name: "Sucursales", link: "/inicio/peticiones/Sucursales" },
  ];

  return (
    <div className="mt-5 ms-5 w-100 p-5">
      <BreadCrumb items={items} activeItem={"Sucursales"} />
      <div className="container p-5">
        <TablaAdmision />
      </div>
    </div>
  );
};

export default tablaSucursales;
