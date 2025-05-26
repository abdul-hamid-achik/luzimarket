import ImagenBanner1 from "@/pages/inicio/images/new_images_luzi/new_banner_luzi2.png";
import ImagenBanner2 from "@/pages/inicio/images/new_images_luzi/new_banner_luzi.png";

import "@/pages/inicio/css/general.css"
import { Button } from "react-bootstrap"

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
               <Button
                  variant="dark"
                  className="mt-3"
                  style={{ borderRadius: "0px" }}
               >
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