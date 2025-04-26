import React from "react";
import SelectMetodoPago from "../components/SelectMetodoPago" 
import { Link } from "react-router-dom";
export default function App() {
  return (
    <>
      <div className="modal fade" id="ModalCard" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="ModalCardLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered ">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-center" id="ModalCardLabel">SELECCIONE METODO DE PAGO</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modalB" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <SelectMetodoPago/>
              <br />
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