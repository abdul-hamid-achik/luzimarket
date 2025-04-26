import "../css/Footer.css"
import Tiktok from "../images/TikTok.png";
import Facebook from "../images/Facebook.png";
import X from "../images/X.png";
import Instagram from "../images/Instagram.png";
import Whatsapp from "../images/Whatsapp.png";
import Youtube from "../images/Youtube.png";
import LogoLuziUser from "../images/NewImagesLuzi/LogoLuziUser.png";


const Footer = () => {
   return (
      <>
         <div className="sticky-bottom">
            <div className="footerPrimerPiso">
               <img src={LogoLuziUser} className="bannerLogoFooter"/>
               
               <div className="FooterTextoPiso2">
                  <p>País: México</p>
                  <p>Newsletter</p>
                  <p>Archivo Editorial</p>
                  <p>Trabaja con Nosotros</p>
                  <p>Mapa del Sitio</p>
               </div>

               <div className="FooterImagenesBannerPiso3">
                  <img src={Facebook} className="bannerRedesSociales2"/>
                  <img src={Youtube} className="bannerRedesSociales"/>
                  <img src={Tiktok} className="bannerRedesSociales2"/>
                  <img src={X} className="bannerRedesSociales2"/>
                  <img src={Instagram} className="bannerRedesSociales2"/>
                  <img src={Whatsapp} className="bannerRedesSociales2"/>
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