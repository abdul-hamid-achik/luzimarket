import React from "react";
import { Link } from "react-router-dom";
import "../css/FormProductos.css";
import Flecha from "../images/flecha-correcta.png";
import ImagenProducto1 from "../images/PastelChocolate.jpg";
import ImagenProducto2 from "../images/PastelVainilla.jpg";
import ImagenProducto3 from "../images/PastelFresa.jpg";

export default function App() {
  return (
    <>
      <div>
        <img src={Flecha} className="flecha" />
        <h1 className="direccion__pagina">Peticiones</h1>
      </div>
      <div className="caja__direccion">
        <img src={Flecha} className="flecha1" />
        <h1 className="direccion__pagina1">Productos</h1>
      </div>
      <div className="caja__form">
        <div className="caja__producto">
          <input
            type="text"
            id="campoProducto"
            placeholder="Nombre del producto"
          />
          <input type="text" id="campoPrecio" placeholder="Precio" />
        </div>
        <div className="caja__Descripcion">
          <textarea
            name=""
            id="campoDescripcion"
            cols="30"
            rows="10"
            placeholder="Descripcion del producto"
          />
          <textarea
            name=""
            id="campoDescripcion"
            cols="30"
            rows="10"
            placeholder="Descripcion del producto"
          />
        </div>
      </div>
      <div className="imagenes__producto">
        <img src={ImagenProducto1} className="producto" />
        <img src={ImagenProducto2} className="producto" />
        <img src={ImagenProducto3} className="producto" />
      </div>
      <div className="botones__opciones">
        <Button
          css={{
            background: "white",
            color: "Black",
            border: "1px solid",
            width: "5%",
          }}
          className="boton__op"
        >
          <Link to="/inicio/peticiones/productos" className="boton_linkP1">
            Regresar
          </Link>
        </Button>

        <Link to="#" className="link__boton">
          <Button
            css={{
              background: "black",
              color: "white",
              border: "1px solid",
              width: "5%",
            }}
            className="boton__op"
          >
            Enviar Feedback
          </Button>
        </Link>

        <Link to="#" className="link__boton">
          <Button
            css={{
              background: "primary",
              color: "white",
              border: "1px solid",
              width: "5%",
            }}
            className="boton__op"
          >
            Aceptar
          </Button>
        </Link>
      </div>
    </>
  );
}
