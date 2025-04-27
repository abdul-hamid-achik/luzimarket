import React from 'react'
import Flecha from "../../assets/img/flecha.png"
import Graficos1 from "../../assets/img/graficos1.png"
import Graficos2 from "../../assets/img/graficos2.png"
import Graficos3 from "../../assets/img/graficos3.png"
import Graficos4 from "../../assets/img/graficos4.png"
import Graficos5 from "../../assets/img/graficos5.png"
import '../css/GraficosPrueba.css'


function tienda() {
  return (
    <>

      {/* contenedor que señala las rutas del modulo Tiendas */}
      <div>
        <img src={Flecha} className="flecha" />
        <h1 className="direccion__pagina">Ventas</h1>
      </div>
      {/* ---------------------------------------------------------- */}

      {/* Graficos de Tiendas  */}
      <div>
        <img src={Graficos1} className="" />
        <img src={Graficos2} className="" />
      </div>
      <div className='contenedor_graficos'>
        <img src={Graficos3} className="" />
        <img src={Graficos4} className="" />
        <img src={Graficos5} className="" />
      </div>
    </>
  );
}

export default tienda;