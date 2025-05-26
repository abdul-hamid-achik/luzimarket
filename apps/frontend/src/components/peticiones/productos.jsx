import { Link } from "react-router-dom";

const renderLineChart = () => (
  <div className="card p-3 rounded-5 w-100 ">
    <div className="d-flex justify-content-between m-4">
      <h3 className="card-title">Productos</h3>
      <div className="ms-2">
        <span className="badge bg-danger rounded-pill text-white fs-6">
          103
        </span>
      </div>
    </div>

    <div className="card-text m-4">
      <p>
        Donec ullamcorper nulla non metus auctor fringilla. Donec ullamcorper
        nulla non metus auctor fringilla euismod
      </p>
    </div>

    <Link to="Productos" className="btn btn-dark p-2 m-4">
      Entrar
    </Link>
  </div>
);

export default renderLineChart;
