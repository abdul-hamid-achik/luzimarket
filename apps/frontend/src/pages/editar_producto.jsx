import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import "@/css/form_productos.css";
import Flecha from "@/assets/images/flecha_correcta.png";
import ImagenProducto1 from "@/assets/images/pastel_chocolate.jpg";
import ImagenProducto2 from "@/assets/images/pastel_fresa.jpg";
import ImagenProducto3 from "@/assets/images/pastel_vainilla.jpg";

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
          variant="outline-dark"
          className="boton__op me-2"
          as={Link}
          to="/inicio/peticiones/productos"
        >
          Regresar
        </Button>

        <Button
          variant="dark"
          className="boton__op me-2"
        >
          Enviar Feedback
        </Button>

        <Button
          variant="primary"
          className="boton__op"
        >
          Aceptar
        </Button>
      </div>
    </>
  );
}
