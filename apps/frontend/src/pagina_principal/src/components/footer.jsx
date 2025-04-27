import "@/pagina_principal/src/css/footer.css"
import Tiktok from "@/pagina_principal/src/images/tik_tok.png";
import Facebook from "@/pagina_principal/src/images/facebook.png";
import X from "@/pagina_principal/src/images/x.png";
import Instagram from "@/pagina_principal/src/images/instagram.png";
import Whatsapp from "@/pagina_principal/src/images/whatsapp.png";
import Youtube from "@/pagina_principal/src/images/youtube.png";
import LogoLuziUser from "@/pagina_principal/src/images/new_images_luzi/logo_luzi_user.png";


const Footer = () => {
   return (
      <>
         <div className="sticky-bottom">
            <div className="footerPrimerPiso">
               <img src={LogoLuziUser} className="bannerLogoFooter" />

               <div className="FooterTextoPiso2">
                  <p>País: México</p>
                  <p>Newsletter</p>
                  <p>Archivo Editorial</p>
                  <p>Trabaja con Nosotros</p>
                  <p>Mapa del Sitio</p>
               </div>

               <div className="FooterImagenesBannerPiso3">
                  <img src={Facebook} className="bannerRedesSociales2" />
                  <img src={Youtube} className="bannerRedesSociales" />
                  <img src={Tiktok} className="bannerRedesSociales2" />
                  <img src={X} className="bannerRedesSociales2" />
                  <img src={Instagram} className="bannerRedesSociales2" />
                  <img src={Whatsapp} className="bannerRedesSociales2" />
               </div>

            </div>
            <div className="FooterSegundoPiso">
               <p><span>©</span>2023 LUZI <span>®</span>MARKET</p>
               <p>TERMINOS  CONDICIONES</p>
               <p>POLITICA DE PRIVACIDAD</p>
               <p>COOKIES</p>
               <p>ACCESIBILIDAD</p>
            </div>
         </div>
      </>
   );
}

export default Footer