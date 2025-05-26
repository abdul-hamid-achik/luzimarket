import "@/css/index.css";
import { Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function App() {
   return (
      <>
         <div className="contenedor">
            <h3>Información de la marca</h3>
            <div className="col">
               <input type="text" className="col-larga" placeholder="Nombre de la marca / tienda / negocio" />
               <input type="text" className="col-corta" placeholder="Número exterior" />
               <input type="text" className="col-corta" placeholder="Número interior" />
            </div>
            <div className="col">
               <input type="text" className="col-larga" placeholder="Nombre del responsable / contacto" />
               <input type="text" className="col-corta" placeholder="Colonia" />
               <input type="text" className="col-corta" placeholder="Ciudad" />
            </div>
            <div className="col">
               <input type="text" className="col-larga" placeholder="Celular / Whatsapp" />
               <input type="text" className="col-corta" placeholder="Estado" />
               <input type="text" className="col-corta" placeholder="País" />
            </div>
            <div className="col">
               <input type="text" className="col-larga" placeholder="Teléfono de la tienda / negocio" />
               <input type="text" className="col-larga" placeholder="URL / Página web" />
            </div>
            <div className="col">
               <input type="text" className="col-larga-relative1" placeholder="Horarios de la tienda / negocio" />
               <textarea name="" id="" cols="30" rows="10" className="col-larga-unica" placeholder="Describe brevemente el giro o enfoque de tu marca / negocio"></textarea>
            </div>
            <div className="col">
               <input type="text" className="col-larga-relative2" placeholder="Calle" />
            </div>
            <div>
               <h4 className="texto_editarAdmin">¿Cuenta con servicio a domicilio?</h4>
               <div className="contenedor_radio">
                  <Form.Check
                     type="radio"
                     id="delivery-yes"
                     name="delivery"
                     label="Si"
                     defaultChecked
                     className="text-success me-3"
                  />
                  <Form.Check
                     type="radio"
                     id="delivery-no"
                     name="delivery"
                     label="No"
                     className="text-danger"
                  />
               </div>
            </div>
            <div className="col-2">
               <input type="text" className="col-corta2" placeholder="Propio" />
               <input type="text" className="col-corta2" placeholder="Servicio Externo" />
               <input type="text" className="col-corta3" placeholder="Instagram" />
               <input type="text" className="col-corta3" placeholder="Facebook" />
            </div>
            <div className="col-2">
               <input type="text" className="col-larga2" placeholder="¿Qué servicio usas?" />
               <input type="text" className="col-corta22" placeholder="TikTok" />
               <input type="text" className="col-corta22" placeholder="Twitter" />
            </div>
            <div className="content__button">
               <Button
                  variant="outline-dark"
                  className="boton1 me-2"
                  as={Link}
                  to="/inicio/peticiones/admisiones"
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
         </div>
      </>
   );
}
