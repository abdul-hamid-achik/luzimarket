import { GoArrowRight } from "react-icons/go";
import Success from "../../components/alertas/Success";
import Danger from "../../components/alertas/Danger";
import BreadCrumb from "../../components/Breadcrumb";

const Alertas = () => {
  const items = [
    { name: "Alertas", link: "/InicioEmpleados/AlertasEmpleados" },
  ];

  return (
    <div className="mt-5 ms-5 w-100 p-5">
      <BreadCrumb items={items} activeItem="Alertas" />
      <div className="mt-5 p-5">
        <Success />
        <Danger />
        <Success />
        <Danger />
      </div>
    </div>
  );
};

export default Alertas;
