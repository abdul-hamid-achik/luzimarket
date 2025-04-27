import React from "react";
import Tetera1 from "../../assets/img/tetera1.png";
import Tetera2 from "../../assets/img/tetera2.png";
import Tetera3 from "../../assets/img/tetera3.png";
import BreadCrumb from "../../components/BreadCrumb";

const tablaProducto = () => {
  const items = [
    { name: "Productos", link: "/InicioEmpleados/ProductosEmpleados" },
  ];

  return (
    <div className="container mt-5 p-5">
      <BreadCrumb items={items} activeItem={"Productos"} />
      <div className="container mt-5">
        <div className="row">
          <div className="col-md-6 mb-3">
            <input
              type="text"
              id="nombre"
              name="nombre"
              className="form-control p-2 small"
              value="Tetera Sowden"
            />
          </div>

          <div className="col-md-3 mb-3">
            <input
              type="text"
              name="Precio"
              id="Precio"
              className="form-control p-2 small"
              value="$1,000 (MXN)"
            />
          </div>
          <div className="col-md-3 mb-3">
            <input
              type="text"
              name="Precio"
              id="Precio"
              className="form-control p-2 small"
              placeholder="→ HAY DESIGN"
            />
          </div>
        </div>
      </div>

      <div className="container mt-5">
        <div className="row">
          <div className="col-md-6 mb-5">
            <label
              htmlFor="descripcion"
              className="form-label text-body-tertiary"
            >
              Descripción
            </label>

            <textarea
              name="descripcion"
              id="descripcion"
              className="form-control h-100 p-3 small fs-6"
              rows="8"
            >
              Cras justo odio, dapibus ac facilisis in, egestas eget quam. Fusce
              dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh,
              ut fermentum massa justo sit amet risus. Morbi leo risus, porta ac
              consectetur ac, vestibulum at eros. Lorem ipsum dolor sit amet,
              consectetur adipiscing elit. Cras mattis consectetur purus sit
              amet fermentum. Nullam id dolor id nibh ultricies vehicula ut id
              elit. Donec sed odio dui.
            </textarea>
          </div>

          <div className="col-md-6 mb-5">
            <label
              htmlFor="descripcion"
              className="form-label text-body-tertiary"
            >
              Detalles del producto
            </label>

            <textarea
              name="descripcion"
              id="descripcion"
              className="form-control h-100 p-3 small fs-6"
              rows="8"
            >
              Hour, minute, and second hand in red · Artist signature at back
              face · German-made UTS quartz movement · AA battery required ·
              Approx. H18 x W18 cm Each item is handcrafted and unique. Supplier
              color: Red hands Glass. Made in Denmark. 231741M793001.
            </textarea>
          </div>
        </div>
      </div>

      <div className="container mt-5">
        <div className="row">
          <div className="col-md-4">
            <label
              htmlFor="descripcion"
              className="form-label text-body-tertiary"
            >
              Fotos del producto
            </label>
            <img src={Tetera1} className="img-fluid border border-dark" />
          </div>

          <div className="col-md-4">
            <label
              htmlFor="descripcion"
              className="form-label text-body-tertiary invisible"
            >
              Fotos del producto
            </label>
            <img src={Tetera2} className="img-fluid border border-dark"></img>
          </div>

          <div className="col-md-4">
            <label
              htmlFor="descripcion"
              className="form-label text-body-tertiary invisible"
            >
              Fotos del producto
            </label>
            <img src={Tetera3} className="img-fluid border border-dark"></img>
          </div>
        </div>
      </div>

      <div className="container mt-5">
        <div className="justify-content-end row d-flex">
          <div className="col-md-3 mb-2">
            <button className="btn w-100 border border-black ps-5 pt-3 pb-3 pe-5">
              ← Regresar
            </button>
          </div>

          <div className="col-md-3 mb-2">
            <button className="btn w-100 btn-dark border border-black ps-5 pt-3 pb-3 pe-5">
              Enviar feedback
            </button>
          </div>

          <div className="col-md-3 mb-2">
            <button className="btn w-100 btn-primary border border-black ps-5 pt-3 pb-3 pe-5">
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default tablaProducto;
