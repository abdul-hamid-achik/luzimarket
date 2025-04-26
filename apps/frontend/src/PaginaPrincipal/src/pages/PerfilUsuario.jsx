import Navbars from "../components/Navbars";
import Footer from "../components/Footer";
import { Padding } from "@mui/icons-material";
import ModalUsr from "../components/ModalInfoPago";

const Perfil = () => {
    return (
      <>
      <Navbars />
        <div class="container rounded bg-white mt-5 mb-5">
            <div class="row">
                <div class="col-md-3 border-right">
                    <div class="d-flex flex-column align-items-center text-center p-3 py-5">
                        <img class="rounded-circle mt-5" width="150px" height="150px" src="https://www.stockvault.net/data/2011/08/12/126170/preview16.jpg"/>
                        <span class="font-weight-bold mt-2">Nombre de Usuario</span></div>
                </div>
                <div class="col-md-5 border-right">
                    <div class="p-3 py-5">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h3 class="text-right">Detalles del Perfil</h3>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-6"><label class="labels">Nombre</label><input type="text" class="form-control" placeholder="first name" value=""/></div>
                            <div class="col-md-6"><label class="labels">Apellido</label><input type="text" class="form-control" value="" placeholder="surname"/></div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-12"><label class="labels">Telefono</label><input type="text" class="form-control" placeholder="enter phone number" value=""/></div>
                            <div class="col-md-12"><label class="labels">Direccion</label><input type="text" class="form-control" placeholder="enter address line 1" value=""/></div>
                            <div class="col-md-12"><label class="labels">Codigo Postal</label><input type="text" class="form-control" placeholder="enter address line 2" value=""/></div>
                            <div class="col-md-12"><label class="labels">Estado</label><input type="text" class="form-control" placeholder="enter address line 2" value=""/></div>
                            <div class="col-md-12"><label class="labels">Area</label><input type="text" class="form-control" placeholder="enter address line 2" value=""/></div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-6"><label class="labels">Pais</label><input type="text" class="form-control" placeholder="country" value=""/></div>
                            <div class="col-md-6"><label class="labels">Estado/Region</label><input type="text" class="form-control" value="" placeholder="state"/></div>
                        </div>
                        <div class="mt-5"><button class="btn btn-primary profile-button" type="button">Guardar Cambios</button></div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-3 py-5">
                        <div class="d-flex justify-content-between align-items-center experience"><h3>Metodo de pago</h3></div><br/>
                        <div class="col-md-12"><label class="labels">Tarjeta termina en *98</label>
                            <button 
                            class="btn btn-primary profile-button" 
                            type="button"
                            data-bs-toggle="modal" 
                            data-bs-target="#ModalCard">
                                Cambiar</button></div> <br/>
                    </div>
                </div>
            </div>
            <ModalUsr/>
        </div>
        <Footer />
    </>
 );
};

export default Perfil;
