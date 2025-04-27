import danger from "@/images/danger_alerta.png";
import ojo from "@/images/ojo.png";

const Alertas = () => {
  return (
    <div
      className="alert alert-danger border pt-1 pb-1 border-danger border-1 rounded-3 alert-dismissible fade show"
      role="alert"
    >
      <div className="d-flex justify-content-between align-items-center ">
        <div className="">
          <img src={danger} alt="" width={20} className="flex-shrink-0 me-2" />
          <span className="text-danger">A simple danger alert</span>
        </div>
        <div className="text-end ">
          <button
            type="button"
            className="btn btn-sm"
            data-bs-dismiss="alert"
            aria-label="Close"
          >
            <img src={ojo} alt="" width={30} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default Alertas;
