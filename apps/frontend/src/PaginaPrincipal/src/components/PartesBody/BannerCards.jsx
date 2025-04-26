import ImagenMuestra1 from "../../images/ImagenMuestra1.jpg"
import ImagenMuestra2 from "../../images/ImagenMuestra2.jpg"
import ImagenMuestra3 from "../../images/ImagenMuestra3.jpg"
import ImagenMuestra4 from "../../images/ImagenMuestra4.jpg"


import "../../css/General.css"
const BannerCards =  () => {
    return (
      <>
         <div className="cajaImagenesCard">
         <div className="card CardImagen">
            <img src={ImagenMuestra1} className="imagenCard"/>
            <button className="botonBanner">Flowershop</button>
         </div>
         <div className="card CardImagen">
            <img src={ImagenMuestra2} className="imagenCard"/>
            <button className="botonBanner1">Sweet</button>
         </div>
         <div className="card CardImagen">
            <img src={ImagenMuestra3} className="imagenCard"/>
            <button className="botonBanner2">Events + Dinners</button>
         </div>
         <div className="card CardImagen">
            <img src={ImagenMuestra4} className="imagenCard"/>
            <button className="botonBanner3">Giftshop</button>
         </div> 
      </div>
      </>
    );
}

export default BannerCards;