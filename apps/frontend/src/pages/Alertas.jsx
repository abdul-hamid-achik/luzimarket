import { GoArrowRight } from "react-icons/go";
import Success from "../components/alertas/success";
import Danger from "../components/alertas/danger";
import BreadCrumb from "../components/breadcrumb";

const Alertas = () => {
  const items = [{ name: "Alertas", link: "/inicio/alertas" }];

  return (
    <div className="mt-5 ms-5 w-100 p-5">
      <BreadCrumb items={items} activeItem={"Alertas"} />
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
