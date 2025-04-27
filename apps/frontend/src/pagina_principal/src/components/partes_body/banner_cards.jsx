import ImagenMuestra1 from "@/pagina_principal/src/images/imagen_muestra1.jpg"
import ImagenMuestra2 from "@/pagina_principal/src/images/imagen_muestra2.jpg"
import ImagenMuestra3 from "@/pagina_principal/src/images/imagen_muestra3.jpg"
import ImagenMuestra4 from "@/pagina_principal/src/images/imagen_muestra4.jpg"


import "@/pagina_principal/src/css/general.css"

const BannerCards = () => {
   return (
      <>
         <div className="cajaImagenesCard">
            <div className="card CardImagen">
               <img src={ImagenMuestra1} className="imagenCard" />
               <button className="botonBanner">Flowershop</button>
            </div>
            <div className="card CardImagen">
               <img src={ImagenMuestra2} className="imagenCard" />
               <button className="botonBanner1">Sweet</button>
            </div>
            <div className="card CardImagen">
               <img src={ImagenMuestra3} className="imagenCard" />
               <button className="botonBanner2">Events + Dinners</button>
            </div>
            <div className="card CardImagen">
               <img src={ImagenMuestra4} className="imagenCard" />
               <button className="botonBanner3">Giftshop</button>
            </div>
         </div>
      </>
   );
}

export default BannerCards;