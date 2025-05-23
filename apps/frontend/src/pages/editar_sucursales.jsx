import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import '@/css/sucursal_form.css';

export default function App() {
  return (
    <>
      {/* <Grid.Container gap={4}>
        <Grid>
          <Input
            bordered
            clearable
            label="Nombre de la Sucursal"
            placeholder="Nombre de la Sucursal"
            width="500px"
          />
        </Grid>
        <Grid>
          <Input bordered clearable label="Dirección" placeholder="Dirección" />
        </Grid>
        <Grid>
          <Textarea
            bordered
            label="Descripción"
            placeholder="Descripción"
            width="500px"
          />
        </Grid>
        <Grid>
          <Textarea
            bordered
            label="Detalles de la sucursal"
            placeholder="Detalles de la sucursal"
            width="500px"
            maxLength={500}
          />
        </Grid>
      </Grid.Container> */}

      <div className="contenedor__Sucursal">
        <div className="contenedor__form__Suc">
          <input
            type="text"
            name=""
            id="text__Suc"
            placeholder="Nombre del producto"
          />
          <input
            type="text"
            name=""
            id="text__Suc"
            placeholder="Precio del producto"
          />
        </div>
        <div className="textarea__contenedor__Suc">
          <textarea
            id="descripcion__Suc"
            placeholder="Descripción del producto"
          />
          <textarea id="detalle__Suc" placeholder="Detalle del producto" />
        </div>
      </div>

      <div className="contenedor__button__Suc">
        <Button
          variant="outline-dark"
          className="boton1 me-2"
          as={Link}
          to="/inicio/peticiones/sucursales"
        >
          Regresar
        </Button>
        <Button
          variant="dark"
          className="boton2 me-2"
        >
          Enviar Feedback
        </Button>
        <Button
          variant="primary"
          className="boton3"
        >
          Aceptar
        </Button>
      </div>
    </>
  );
}
