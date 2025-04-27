import "@/css/index.css";
import { Button, Checkbox } from "@nextui-org/react";
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
                  <Checkbox isRounded id="label" defaultSelected color="success">Si</Checkbox>
                  <Checkbox isRounded id="label" defaultSelected color="error">No</Checkbox>
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
               <Button css={{
                  background: "white",
                  color: "Black",
                  border: "1px solid",
                  width: "5%"
               }} className="boton1">
                  <Link to="/inicio/peticiones/admisiones" className="boton_linkP1">Regresar</Link>
               </Button>
               <Link to="#" className="boton_link2">
                  <Button css={{
                     background: "black",
                     color: "white",
                     border: "1px solid",
                     width: "5%"
                  }} className="boton2">
                     Enviar Feedback
                  </Button>
               </Link>
               <Link to="#" className="boton_link3">
                  <Button css={{
                     background: "primary",
                     color: "white",
                     border: "1px solid",
                     width: "5%"
                  }} className="boton3">
                     Aceptar
                  </Button>
               </Link>
            </div>
         </div>
      </>
   );
}
