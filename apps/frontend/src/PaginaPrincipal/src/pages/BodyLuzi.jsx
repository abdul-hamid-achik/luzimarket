import ImagenMuestra1 from "../images/ImagenMuestra1.jpg";
import ImagenMuestra2 from "../images/ImagenMuestra2.jpg";
import ImagenMuestra3 from "../images/ImagenMuestra3.jpg";
import ImagenMuestra4 from "../images/ImagenMuestra4.jpg";
import ImagenMuestraNvo1 from "../images/productos/pastelChocolate.png";
import ImagenMuestraNvo2 from "../images/productos/tenis.png";
import ImagenMuestraNvo3 from "../images/productos/flores.png";
import ImagenMuestraNvo4 from "../images/productos/chocolates.png";
import ImagenBanner1 from "../images/NewImagesLuzi/NewBannerLuzi2.png";
import ImagenBanner2 from "../images/NewImagesLuzi/NewBannerLuzi.png";
import LogoHandpicked from "../images/NewImagesLuzi/LogoHandLuzi1.png";
import ModalIndex from "../components/ModalIndex";

import "../css/CardIndex.css";
import "../css/General.css";
// import { Button } from "@nextui-org/react"

import Card from "react-bootstrap/Card";
import { Link } from "react-router-dom";

const BodyLuzi = () => {
  return (
    <>
      <div className="cajaBody">
        {/* Banners */}
        <div className="Banners">
          <div className="BannerPrincipal">
            <img src={ImagenBanner1} />
          </div>
          <div className="BannerSecundario">
            <img src={ImagenBanner2} className="ImagenTextoBanner" />
            <p>
              Experiencias y productos seleccionados a mano para momentos
              especiales
            </p>
            <button
              type="button"
              className="btn no-rounded"
              style={{
                backgroundColor: "black",
                padding: "10px",
                paddingLeft: "20px",
                paddingRight: "20px",
                color: "white",
                border: "0px",
                borderRadius: "0px",
              }}
            >
              Ver Handpicked
            </button>
          </div>
        </div>
        <div className="bannerOferta">
          <div className="botonBannerOferta">
            <h4>10% off en tu primer compra al suscribirte gratis</h4>
            <button className="botonBanner4">Suscribirse</button>
          </div>
        </div>

        {/* Cards */}

        <div className="cajaImagenesBanner">
          <div className="cardImage">
            <img src={ImagenMuestra1} className="image" />
            <button className="bottomBanner">Flowershop</button>
          </div>
          <div className="cardImage">
            <img src={ImagenMuestra2} className="image" />
            <button className="bottomBanner">Sweet</button>
          </div>
          <div className="cardImage">
            <img src={ImagenMuestra3} className="image" />
            <button className="bottomBanner">Events + Dinners</button>
          </div>
          <div className="cardImage">
            <img src={ImagenMuestra4} className="image" />
            <button className="bottomBanner">Giftshop</button>
          </div>
        </div>

        {/* Descripcion de la pagina */}

        <div className="cajaDescripcionPagina">
          <p>
            <span className="TituloLuzi">LUZI</span>
            <span className="Simbolo">®</span>
            <span className="TituloLuzi">MARKET </span>
            es una plataforma online que ofrece curaduría,
          </p>
          <p>
            venta y envio a domicilo de regalos excepcionales para momentos
            especiales,
          </p>
          <p>
            con un catálogo de marcas y tiendas seleccionadas en todo México.
          </p>
        </div>

        {/* Productos (Handpicked) */}
        <div className="titulosHandpicked">
          <div className="tituloLogo">
            <h5>Handpicked</h5>
            <img src={LogoHandpicked} alt="" />
          </div>
          <Link to="handpicked/productos" className="LinkButtonVerMasH">
            <button
              type="button"
              className="btn"
              style={{
                backgroundColor: "black",
                padding: "10px",
                paddingLeft: "20px",
                paddingRight: "20px",
                color: "white",
                borderRadius: "0px",
              }}
            >
              Ver Todos
            </button>
          </Link>
        </div>
        <div className="cajaProductosMuestra">
          <Card style={{ width: "18rem" }}>
            <Card.Img
              variant="top"
              src={ImagenMuestraNvo1}
              data-bs-toggle="modal"
              data-bs-target="#staticBackdrop"
              style={{ cursor: "pointer" }}
            />
            <Card.Body>
              <Card.Title>Producto 1</Card.Title>
              <Card.Text>HAY DESIGN</Card.Text>
              <Card.Text>$2,500</Card.Text>
            </Card.Body>
          </Card>

          <Card style={{ width: "18rem" }}>
            <Link to="handpicked/producto1">
              <Card.Img variant="top" src={ImagenMuestraNvo2} />
            </Link>
            <Card.Body>
              <Card.Title>Producto 2</Card.Title>
              <Card.Text>HAY DESIGN</Card.Text>
              <Card.Text>$2,500</Card.Text>
            </Card.Body>
          </Card>

          <Card style={{ width: "18rem" }}>
            <Link to="handpicked/producto1">
              <Card.Img variant="top" src={ImagenMuestraNvo3} />
            </Link>
            <Card.Body>
              <Card.Title>Producto 3</Card.Title>
              <Card.Text>HAY DESIGN</Card.Text>
              <Card.Text>$2,500</Card.Text>
            </Card.Body>
          </Card>

          <Card style={{ width: "18rem" }}>
            <Link to="handpicked/producto1">
              <Card.Img variant="top" src={ImagenMuestraNvo4} />
            </Link>
            <Card.Body>
              <Card.Title>Producto 4</Card.Title>
              <Card.Text>HAY DESIGN</Card.Text>
              <Card.Text>$2,500</Card.Text>
            </Card.Body>
          </Card>
        </div>
        <ModalIndex />
        <br />
        <br />
        <br />
        <br />
      </div>
    </>
  );
};
export default BodyLuzi;
