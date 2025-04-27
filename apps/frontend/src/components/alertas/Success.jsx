import danger from "import../";
import ojo from "import../";

const Alertas = () => {
  return (
    <div
      className="alert alert-success border pt-1 pb-1 border-success  border-1 rounded-3 alert-dismissible fade show"
      role="alert"
    >
      <div className="d-flex justify-content-between align-items-center ">
        <div className="">
          <img src={danger} alt="" width={20} className="flex-shrink-0 me-2" />
          <span className="text-success">A simple success alert</span>
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
