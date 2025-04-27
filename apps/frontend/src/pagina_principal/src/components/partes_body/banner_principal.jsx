import ImagenBanner1 from "@/images/new_images_luzi/new_banner_luzi2.png";
import ImagenBanner2 from "@/images/new_images_luzi/new_banner_luzi.png";

import "@/css/general.css"
import { Button } from "@nextui-org/react"

const BannerPrincipal = () => {
   return (
      <>
         <div className="Banners">
            <div className="BannerPrincipal">
               <img src={ImagenBanner1} />
            </div>
            <div className="BannerSecundario">
               <img src={ImagenBanner2} className="ImagenTextoBanner" />
               <p>Experiencias y productos seleccionados a mano para momentos especiales</p>
               <Button css={{ background: "Black", color: "White", border: "0px solid", width: "5%", marginTop: "1rem", borderRadius: "0px" }} >
                  Ver Handpicked
               </Button>
            </div>
         </div>

         <div className="bannerOferta">
            <div className="botonBannerOferta">
               <h4>10% off en tu primer compra al suscribirte gratis</h4>
               <button className="botonBanner4">Suscribirse</button>
            </div>
         </div>
      </>
   );
}

export default BannerPrincipal;