import Ciudades from "@/pages/empleados/components/select_estados_ciudades";
import BreadCrumb from "@/components/breadcrumb";
import Tabla from "@/pages/empleados/components/tabla";

const Horarios = () => {
  const items = [{ name: "Horarios", link: "/InicioEmpleados/Horarios" }];

  return (
    <div className="mt-5 ms-5 w-100 p-5">
      <BreadCrumb items={items} activeItem={"Horarios"} />
      <div className="mt-5">
        <Ciudades />
      </div>
      <div className="mt-5">
        <Tabla />
      </div>
      <div className="mt-5">
        <div className="d-flex justify-content-end">
          <div className="col-md-2">
            <button className="btn btn-dark p-3 w-100">Actualizar</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Horarios;
