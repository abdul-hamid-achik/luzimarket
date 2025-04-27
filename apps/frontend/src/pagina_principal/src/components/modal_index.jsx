import SelectEstado from "./select_estado_modal";
import SelectCiudad from "./select_ciudad_modal";
import { Link } from "react-router-dom";
export default function App() {
  return (
    <>
      <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered ">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-center" id="staticBackdropLabel">SELECCIONE UBICACIÓN DE ENTREGA</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <SelectEstado />
              <br />
              <SelectCiudad />
            </div>
            <div className="modal-footer">
              <button type="button"
                className="btn"
                data-bs-dismiss="modal"
                style={{
                  background: "#000",
                  color: "#FFF",
                  paddingLeft: "25px",
                  paddingRight: "25px",
                  paddingBottom: "10px",
                  paddingTop: "10px",
                  border: "1px solid",
                  borderRadius: "0px",
                  position: "relative",
                  right: "11.5rem"
                }} >Aceptar</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}