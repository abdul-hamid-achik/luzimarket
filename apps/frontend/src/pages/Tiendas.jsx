import React from 'react'
import Flecha from "import../"
import Graficos1 from "import../"
import Graficos2 from "import../"
import Graficos3 from "import../"
import Graficos4 from "import../"
import Graficos5 from "import../"
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