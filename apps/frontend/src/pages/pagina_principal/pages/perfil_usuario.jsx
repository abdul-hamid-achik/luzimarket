import Navbars from "@/pages/pagina_principal/components/navbars/navbar_principal";
import Footer from "@/pages/pagina_principal/components/footer";
import ModalUsr from "@/pages/pagina_principal/components/modal_index";

const Perfil = () => {
    return (
        <>
            <Navbars />
            <div className="container rounded bg-white mt-5 mb-5">
                <div className="row">
                    <div className="col-md-3 border-right">
                        <div className="d-flex flex-column align-items-center text-center p-3 py-5">
                            <img className="rounded-circle mt-5" width="150px" height="150px" src="https://www.stockvault.net/data/2011/08/12/126170/preview16.jpg" />
                            <span className="font-weight-bold mt-2">Nombre de Usuario</span></div>
                    </div>
                    <div className="col-md-5 border-right">
                        <div className="p-3 py-5">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h3 className="text-right">Detalles del Perfil</h3>
                            </div>
                            <div className="row mt-2">
                                <div className="col-md-6"><label className="labels">Nombre</label><input type="text" className="form-control" placeholder="first name" value="" /></div>
                                <div className="col-md-6"><label className="labels">Apellido</label><input type="text" className="form-control" value="" placeholder="surname" /></div>
                            </div>
                            <div className="row mt-3">
                                <div className="col-md-12"><label className="labels">Telefono</label><input type="text" className="form-control" placeholder="enter phone number" value="" /></div>
                                <div className="col-md-12"><label className="labels">Direccion</label><input type="text" className="form-control" placeholder="enter address line 1" value="" /></div>
                                <div className="col-md-12"><label className="labels">Codigo Postal</label><input type="text" className="form-control" placeholder="enter address line 2" value="" /></div>
                                <div className="col-md-12"><label className="labels">Estado</label><input type="text" className="form-control" placeholder="enter address line 2" value="" /></div>
                                <div className="col-md-12"><label className="labels">Area</label><input type="text" className="form-control" placeholder="enter address line 2" value="" /></div>
                            </div>
                            <div className="row mt-3">
                                <div className="col-md-6"><label className="labels">Pais</label><input type="text" className="form-control" placeholder="country" value="" /></div>
                                <div className="col-md-6"><label className="labels">Estado/Region</label><input type="text" className="form-control" value="" placeholder="state" /></div>
                            </div>
                            <div className="mt-5"><button className="btn btn-primary profile-button" type="button">Guardar Cambios</button></div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="p-3 py-5">
                            <div className="d-flex justify-content-between align-items-center experience"><h3>Metodo de pago</h3></div><br />
                            <div className="col-md-12"><label className="labels">Tarjeta termina en *98</label>
                                <button
                                    className="btn btn-primary profile-button"
                                    type="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#ModalCard">
                                    Cambiar</button></div> <br />
                        </div>
                    </div>
                </div>
                <ModalUsr />
            </div>
            <Footer />
        </>
    );
};

export default Perfil;
