import React from "react";
import { Link } from "react-router-dom";
import "../css/sucursal_form.css";

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
          css={{
            background: "white",
            color: "Black",
            border: "1px solid",
            width: "5%",
          }}
          className="boton1"
        >
          <Link to="/inicio/peticiones/sucursales" className="boton_linkP1">
            Regresar
          </Link>
        </Button>
        <Button
          css={{
            background: "black",
            color: "white",
            border: "1px solid",
            width: "5%",
          }}
          className="boton2"
        >
          <Link to="#" className="boton_linkP2">
            Enviar Feedback
          </Link>
        </Button>
        <Button
          css={{
            background: "primary",
            color: "white",
            border: "1px solid",
            width: "5%",
          }}
          className="boton3"
        >
          <Link to="#" className="boton_linkP3">
            Aceptar
          </Link>
        </Button>
      </div>
    </>
  );
}
