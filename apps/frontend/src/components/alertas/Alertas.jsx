import { GoArrowRight } from "react-icons/go";
import Success from "./Success";
import Danger from "./Danger";

const Alertas = () => {
  return (
    <div className="col-auto w-100">
      <h2 className="p-5 ">
        <i className="icon-link fs-3 me-3">
          <GoArrowRight />
        </i>
        Alertas
      </h2>
      <div className="container d-flex align-items-center justify-content-center">
        <div className="container align-items-center p-5 ">
          <Danger />
          <Success />
          <Danger />
          <Success />
        </div>
      </div>
    </div>
  );
};

export default Alertas;
