import { GoArrowRight } from "react-icons/go";
import Success from "import../";
import Danger from "import../";
import BreadCrumb from "import../";

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
