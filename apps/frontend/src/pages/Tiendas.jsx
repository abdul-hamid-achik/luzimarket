import Flecha from '@/images/flecha_correcta.png'
import Graficos1 from '@/images/grafico_prueba1.png'
import Graficos2 from '@/images/grafico_prueba2.png'
import Graficos3 from '@/images/grafico_prueba3.png'
import Graficos4 from '@/images/grafico_prueba4.png'
import Graficos5 from '@/images/grafico_prueba5.png'
import '@/css/graficos_prueba.css'


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